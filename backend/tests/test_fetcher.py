# tests/test_fetcher.py
import gzip
from types import SimpleNamespace
from urllib.parse import urlsplit

import httpx
import pytest

from app.services.scraper import html_fetcher as f  
from app.services.scraper.url_validator import UnsafeURL

HTML = {"content-type": "text/html; charset=utf-8"}


@pytest.fixture
def server(monkeypatch):
    """Fake validator + fake network. Set server.handler per test."""
    state = SimpleNamespace(handler=None, requests=[], validated=[],
                            ips=["93.184.216.34"])

    def fake_validate(url):
        state.validated.append(url)
        host = urlsplit(url).hostname
        if host == "evil.test":
            raise UnsafeURL("blocked")
        return SimpleNamespace(url=url, hostname=host, ips=state.ips)

    def fake_transport(hostname, ip):
        def handle(request):
            state.requests.append(request)
            return state.handler(request)
        return httpx.MockTransport(handle)

    monkeypatch.setattr(f, "validate_url", fake_validate)
    monkeypatch.setattr(f, "PinnedIPTransport", fake_transport)
    return state


def ok(body=b"<html>hi</html>", headers=None):
    return httpx.Response(200, headers=headers or HTML, content=body)


def redirect(location, code=302):
    return httpx.Response(code, headers={"location": location})


# ---------- fetch_html: happy path ----------

def test_success(server):
    server.handler = lambda r: ok()
    result = f.fetch_html("https://example.com/")
    assert result.status_code == 200
    assert result.html == "<html>hi</html>"
    assert "text/html" in result.content_type
    assert result.url == "https://example.com/"


# ---------- status / content-type ----------

@pytest.mark.parametrize("code", [204, 301 - 1 + 100, 404, 500])
def test_non_200_raises(server, code):
    server.handler = lambda r: httpx.Response(code)
    with pytest.raises(f.FetchError, match="HTTP"):
        f.fetch_html("https://example.com/")


def test_non_html_rejected(server):
    server.handler = lambda r: ok(b"{}", {"content-type": "application/json"})
    with pytest.raises(f.FetchError, match="Expected HTML"):
        f.fetch_html("https://example.com/")


def test_missing_content_type_rejected(server):
    server.handler = lambda r: httpx.Response(200, content=b"x")
    with pytest.raises(f.FetchError):
        f.fetch_html("https://example.com/")


# ---------- size limits ----------

def test_content_length_too_large(server):
    server.handler = lambda r: ok(
        b"x", {**HTML, "content-length": str(f.MAX_HTML_SIZE + 1)}
    )
    with pytest.raises(f.FetchError, match="size limit"):
        f.fetch_html("https://example.com/")


def test_invalid_content_length(server):
    server.handler = lambda r: ok(b"x", {**HTML, "content-length": "abc"})
    with pytest.raises(f.FetchError, match="Invalid Content-Length"):
        f.fetch_html("https://example.com/")


def test_streamed_body_over_limit_without_content_length(server, monkeypatch):
    monkeypatch.setattr(f, "MAX_HTML_SIZE", 10)

    def gen():
        yield b"a" * 6
        yield b"b" * 6

    server.handler = lambda r: httpx.Response(200, headers=HTML, content=gen())
    with pytest.raises(f.FetchError, match="size limit"):
        f.fetch_html("https://example.com/")


def test_decompressed_size_is_limited(server, monkeypatch):
    monkeypatch.setattr(f, "MAX_HTML_SIZE", 100)
    bomb = gzip.compress(b"a" * 10_000)  # small on the wire, big decoded
    assert len(bomb) < 100
    server.handler = lambda r: ok(bomb, {**HTML, "content-encoding": "gzip"})
    with pytest.raises(f.FetchError, match="size limit"):
        f.fetch_html("https://example.com/")


def test_body_exactly_at_limit_ok(server, monkeypatch):
    monkeypatch.setattr(f, "MAX_HTML_SIZE", 10)
    server.handler = lambda r: ok(b"a" * 10)
    assert f.fetch_html("https://example.com/").html == "a" * 10


# ---------- redirects ----------

def test_absolute_redirect_followed_and_revalidated(server):
    def handler(r):
        if r.url.path == "/":
            return redirect("https://other.example/final")
        return ok()
    server.handler = handler
    result = f.fetch_html("https://example.com/")
    assert result.html
    assert server.validated == [
        "https://example.com/", "https://other.example/final"
    ]


def test_relative_redirect_resolved(server):
    server.handler = lambda r: (
        redirect("/next") if r.url.path == "/start" else ok()
    )
    f.fetch_html("https://example.com/start")
    assert server.validated[-1] == "https://example.com/next"


@pytest.mark.parametrize("code", sorted(f.REDIRECT_CODES))
def test_all_redirect_codes(server, code):
    server.handler = lambda r: (
        redirect("/b", code) if r.url.path == "/a" else ok()
    )
    assert f.fetch_html("https://example.com/a").status_code == 200


def test_redirect_to_unsafe_url_blocked_before_request(server):
    server.handler = lambda r: redirect("http://evil.test/admin")
    with pytest.raises(UnsafeURL):
        f.fetch_html("https://example.com/")
    assert len(server.requests) == 1  # the evil URL was never requested


def test_redirect_without_location(server):
    server.handler = lambda r: httpx.Response(302)
    with pytest.raises(f.FetchError, match="Location"):
        f.fetch_html("https://example.com/")


def test_redirect_loop_hits_limit(server):
    server.handler = lambda r: redirect("/loop")
    with pytest.raises(f.FetchError, match="Maximum redirect"):
        f.fetch_html("https://example.com/loop")
    assert len(server.requests) == f.MAX_REDIRECTS + 1


def test_exactly_max_redirects_allowed(server):
    hops = {"n": 0}

    def handler(r):
        if hops["n"] < f.MAX_REDIRECTS:
            hops["n"] += 1
            return redirect(f"/hop{hops['n']}")
        return ok()

    server.handler = handler
    assert f.fetch_html("https://example.com/").status_code == 200


# ---------- validation / errors ----------

def test_unsafe_initial_url_propagates(server):
    with pytest.raises(UnsafeURL):
        f.fetch_html("http://evil.test/")
    assert server.requests == []


def test_no_validated_ips(server):
    server.ips = []
    with pytest.raises(f.FetchError, match="No validated IP"):
        f.fetch_html("https://example.com/")


def test_timeout_wrapped(server):
    def handler(r):
        raise httpx.ReadTimeout("slow", request=r)
    server.handler = handler
    with pytest.raises(f.FetchError, match="timed out"):
        f.fetch_html("https://example.com/")


def test_connect_error_wrapped(server):
    def handler(r):
        raise httpx.ConnectError("nope", request=r)
    server.handler = handler
    with pytest.raises(f.FetchError, match="HTTP request failed"):
        f.fetch_html("https://example.com/")


# ---------- PinnedIPTransport ----------

class Recorder:
    last = None

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.request = None
        self.closed = False
        Recorder.last = self

    def handle_request(self, request):
        self.request = request
        return httpx.Response(200, request=request)

    def close(self):
        self.closed = True


@pytest.fixture
def pinned(monkeypatch):
    monkeypatch.setattr(f.httpx, "HTTPTransport", Recorder)

    def send(url):
        t = f.PinnedIPTransport("example.com", "93.184.216.34")
        t.handle_request(httpx.Request("GET", url))
        return t, Recorder.last.request

    return send


def test_pinned_connects_to_ip(pinned):
    _, req = pinned("https://example.com/path?q=1")
    assert req.url.host == "93.184.216.34"
    assert req.url.path == "/path"
    assert req.url.query == b"q=1"


def test_pinned_host_header_default_port(pinned):
    _, req = pinned("https://example.com/")
    assert req.headers["host"] == "example.com"  # fails if "example.com:None"


def test_pinned_host_header_explicit_default_port(pinned):
    _, req = pinned("https://example.com:443/")
    assert req.headers["host"] == "example.com"


def test_pinned_host_header_custom_port(pinned):
    _, req = pinned("https://example.com:8443/")
    assert req.headers["host"] == "example.com:8443"


def test_pinned_http_has_no_sni(pinned):
    _, req = pinned("http://example.com/")
    assert "sni_hostname" not in req.extensions


def test_pinned_https_sets_sni_as_str(pinned):
    _, req = pinned("https://example.com/")
    assert req.extensions["sni_hostname"] == "example.com"  # str, not bytes


def test_pinned_secure_defaults_and_close(pinned):
    t, _ = pinned("https://example.com/")
    assert Recorder.last.kwargs == {
        "verify": True, "trust_env": False, "retries": 0
    }
    t.close()
    assert Recorder.last.closed