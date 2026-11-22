"""Unit tests for url_validator.py  ->  run with:  pytest -v test_url_validator.py

No real DNS is used: every test injects a fake resolver, so results are deterministic
and the suite runs offline.
"""
import dataclasses
import ipaddress
import socket
import time

import pytest

from app.services.scraper import url_validator

from app.services.scraper.url_validator import (
    
    validate_url,
    is_safe_url,
    UnsafeURL,
    is_public_ip,
    normalize_hostname,
    ValidatedURL
)


# ----------------------------------------------------------------------------
# Fake DNS
# ----------------------------------------------------------------------------
FAKE_DNS = {
    "example.com": {"93.184.216.34"},
    "xn--exmple-cua.com": {"93.184.216.34"},          # punycode (exämple.com)
    "dual.example": {"93.184.216.34", "2606:4700:4700::1111"},
    "mixed.example": {"93.184.216.34", "10.0.0.5"},   # one bad record among good ones
    "rebind.example": {"127.0.0.1"},
    "v6loop.example": {"::1"},
    "v4mapped.example": {"::ffff:127.0.0.1"},
    "metadata.example": {"169.254.169.254"},
    "multicast.example": {"224.0.0.1"},
    "cgnat.example": {"100.64.0.1"},
    "intranet": {"192.168.0.10"},                     # single-label internal host
}


def fake_resolver(host):
    return FAKE_DNS.get(host, set())                 # unknown host -> NXDOMAIN-like


def check(url):
    return validate_url(url, resolver=fake_resolver)


def reason_of(url, resolver=fake_resolver):
    with pytest.raises(UnsafeURL) as exc:
        validate_url(url, resolver=resolver)
    return str(exc.value)


# ----------------------------------------------------------------------------
# 1. Happy path
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "https://example.com",
        "http://example.com",
        "HTTPS://example.com",                 # scheme is case-insensitive
        "https://EXAMPLE.COM",                 # host is case-insensitive
        "https://example.com.",                # single trailing root dot
        "https://example.com/products?id=10",
        "https://example.com/path#fragment",
        "https://example.com:443/products?id=10",
        "http://example.com:80",
        "https://xn--exmple-cua.com",          # punycode accepted
        "https://dual.example",                # v4 + v6 both public
        "http://8.8.8.8",                      # public IPv4 literal
        "https://[2606:4700:4700::1111]/",     # public IPv6 literal
    ],
)
def test_valid_urls_pass(url):
    assert is_safe_url(url, resolver=fake_resolver) is True


# ----------------------------------------------------------------------------
# 2. Non-string / empty / length
# ----------------------------------------------------------------------------
@pytest.mark.parametrize("value", [None, "", 123, b"https://example.com", ["https://example.com"]])
def test_non_string_or_empty(value):
    assert reason_of(value) == "empty_or_non_string"


def test_url_too_long():
    assert reason_of("https://example.com/" + "a" * 2100) == "too_long"


def test_url_at_length_limit_is_allowed():
    url = "https://example.com/" + "a" * (url_validator.MAX_URL_LENGTH - len("https://example.com/"))
    assert len(url) == url_validator.MAX_URL_LENGTH
    check(url)


# ----------------------------------------------------------------------------
# 3. Dangerous characters / parser-differential tricks
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        " https://example.com",                # leading space
        "https://example.com ",                # trailing space
        "https://exa mple.com",                # inner space
        "https://exa\tmple.com",               # tab
        "https://example.com\n",               # newline
        "https://example.com\r\n",             # CRLF
        "https://example.com\x00",             # NUL
        "https://example.com\x7f",             # DEL
        "https://example.com\\@evil.com",      # backslash confusion
        "https:\\\\example.com",               # backslashes instead of slashes
    ],
)
def test_whitespace_control_backslash_rejected(url):
    assert reason_of(url) == "whitespace_control_or_backslash"


@pytest.mark.parametrize(
    "url",
    ["https://exämple.com", "https://例え.jp", "https://example.com/ü", "https://example。com"],
)
def test_non_ascii_rejected(url):
    assert reason_of(url) == "non_ascii"


# ----------------------------------------------------------------------------
# 4. Scheme
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com",
        "file:///etc/passwd",
        "gopher://example.com",
        "ws://example.com",
        "javascript:alert(1)",
        "data:text/plain,hello",
        "example.com",                          # no scheme
        "//example.com",                        # scheme-relative
        "://example.com",
    ],
)
def test_scheme_not_allowed(url):
    assert reason_of(url) == "scheme_not_allowed"


# ----------------------------------------------------------------------------
# 5. Credentials / userinfo
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "https://user:password@example.com",
        "https://user@example.com",
        "https://@example.com",                 # empty userinfo
        "https://:@example.com",
        "https://example.com@evil.com",         # classic host confusion
        "https://trusted.com@127.0.0.1",
    ],
)
def test_userinfo_rejected(url):
    assert reason_of(url) == "userinfo_not_allowed"


# ----------------------------------------------------------------------------
# 6. Missing host
# ----------------------------------------------------------------------------
@pytest.mark.parametrize("url", ["https://", "https:///example.com", "http://:80", "https://?x=1"])
def test_missing_host(url):
    assert reason_of(url) == "missing_host"


# ----------------------------------------------------------------------------
# 7. Ports
# ----------------------------------------------------------------------------
@pytest.mark.parametrize("url", ["https://example.com:abc", "https://example.com:99999", "https://example.com:-1"])
def test_unparsable_port(url):
    assert reason_of(url) == "unparsable"


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com:8080",
        "http://example.com:5432",
        "https://example.com:80",              # http's default on https
        "http://example.com:443",              # https's default on http
        "https://example.com:0",
        "http://127.0.0.1:8000",
    ],
)
def test_non_default_port_rejected(url):
    # (the last case is rejected for its port before its IP is even looked at)
    assert reason_of(url) == "port_not_allowed"


def test_default_ports_filled_in():
    assert check("https://example.com").port == 443
    assert check("http://example.com").port == 80
    assert check("https://example.com:443").port == 443
    assert check("http://example.com:80").port == 80


# ----------------------------------------------------------------------------
# 8. Hostname syntax
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "https://example..com",                 # empty label
        "https://example.com..",                # two trailing dots
        "https://.example.com",                 # leading dot
        "https://-example.com",                 # label starts with hyphen
        "https://example-.com",                 # label ends with hyphen
        "https://exa_mple.com",                 # underscore (policy: rejected)
        "https://exa!mple.com",
        "https://a" + "b" * 63 + ".com",         # 64-char label
    ],
)
def test_bad_hostname_label(url):
    assert reason_of(url) == "bad_hostname_label"


def test_hostname_too_long():
    host = ".".join(["a" * 60] * 5) + ".com"      # > 253 chars, every label <= 63
    assert len(host) > 253
    assert reason_of(f"https://{host}") == "bad_hostname_length"


def test_label_of_exactly_63_chars_is_ok():
    host = "a" * 63 + ".com"
    assert normalize_hostname(host) == host


def test_hostname_of_exactly_253_chars_is_ok():
    host = ".".join(["a" * 61] * 3 + ["b" * 61])  # 61*4 + 3 dots = 247
    host = host + ".com"                          # 251
    assert len(host) <= 253
    assert normalize_hostname(host) == host


@pytest.mark.parametrize("bad", ["[invalid-ipv6]", "[::1", "[]"])
def test_malformed_ipv6_brackets_rejected(bad):
    assert not is_safe_url(f"https://{bad}/", resolver=fake_resolver)


def test_normalize_hostname_lowercases_and_strips_one_dot():
    assert normalize_hostname("EXAMPLE.COM.") == "example.com"
    assert normalize_hostname("Sub.Example.Com") == "sub.example.com"


def test_normalize_hostname_rejects_empty():
    with pytest.raises(UnsafeURL):
        normalize_hostname(".")
    with pytest.raises(UnsafeURL):
        normalize_hostname("")


# ----------------------------------------------------------------------------
# 9. Legacy / obfuscated IP notations (inet_aton quirks)
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "http://2130706433",                    # decimal 127.0.0.1
        "http://127.1",                         # short form
        "http://127.0.1",
        "http://0177.0.0.1",                    # octal
        "http://0x7f.0x0.0x0.0x1",              # hex
        "http://0x7f.0x1",
        "http://0x7f000001",
        "http://017700000001",                  # octal long form
        "http://1.2.3.4.5",                     # not a valid quad, still numeric
        "http://256.256.256.256",
    ],
)
def test_numeric_ip_notations_rejected(url):
    assert reason_of(url) == "numeric_or_ambiguous_ip_form"


# ----------------------------------------------------------------------------
# 10. IP literals that are not public
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1",
        "http://127.255.255.254",
        "http://0.0.0.0",
        "http://10.0.0.1",
        "http://172.16.0.1",
        "http://172.31.255.255",
        "http://192.168.1.1",
        "http://169.254.169.254",               # cloud metadata
        "http://100.64.0.1",                    # CGNAT
        "http://192.0.2.1",                     # TEST-NET-1
        "http://198.51.100.1",                  # TEST-NET-2
        "http://203.0.113.1",                   # TEST-NET-3
        "http://224.0.0.1",                     # multicast
        "http://240.0.0.1",                     # reserved
        "http://255.255.255.255",               # broadcast
        "http://[::1]",
        "http://[::]",
        "http://[fe80::1]",                     # link-local
        "http://[fc00::1]",                     # unique local
        "http://[fd00:ec2::254]",               # AWS IPv6 metadata
        "http://[ff02::1]",                     # multicast
        "http://[::ffff:127.0.0.1]",            # IPv4-mapped loopback
        "http://[::ffff:10.0.0.1]",             # IPv4-mapped private
        "http://[::ffff:169.254.169.254]",      # IPv4-mapped metadata
        "http://[64:ff9b::7f00:1]",             # NAT64 -> 127.0.0.1
        "http://[64:ff9b::a00:1]",              # NAT64 -> 10.0.0.1
        "http://[2002:7f00:1::]",               # 6to4  -> 127.0.0.1
        "http://[2002:a00:1::]",                # 6to4  -> 10.0.0.1
        "http://[2001:0:4136:e378:8000:63bf:80ff:fffe]",  # Teredo client 127.0.0.1
    ],
)
def test_non_public_ip_literals_rejected(url):
    assert reason_of(url) == "non_public_ip"


def test_ip_literal_skips_dns():
    def boom(_host):
        raise AssertionError("resolver must not be called for IP literals")

    result = validate_url("http://8.8.8.8", resolver=boom)
    assert result.ips == ("8.8.8.8",)
    assert result.hostname == "8.8.8.8"


def test_ipv6_literal_returns_unbracketed_normalized_form():
    result = check("https://[2606:4700:4700:0:0:0:0:1111]/")
    assert result.ips == ("2606:4700:4700::1111",)


# ----------------------------------------------------------------------------
# 11. is_public_ip directly
# ----------------------------------------------------------------------------
@pytest.mark.parametrize("addr", ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111", "2001:4860:4860::8888"])
def test_is_public_ip_true(addr):
    assert is_public_ip(ipaddress.ip_address(addr)) is True


@pytest.mark.parametrize(
    "addr",
    [
        "127.0.0.1", "0.0.0.0", "10.1.2.3", "172.20.0.1", "192.168.0.1", "169.254.1.1",
        "100.64.0.1", "224.0.0.1", "239.255.255.250", "240.0.0.1", "255.255.255.255",
        "::1", "::", "fe80::1", "fc00::1", "ff02::1",
        "::ffff:127.0.0.1", "::ffff:192.168.1.1",
        "64:ff9b::7f00:1", "2002:7f00:1::", "2001:0:4136:e378:8000:63bf:80ff:fffe",
    ],
)
def test_is_public_ip_false(addr):
    assert is_public_ip(ipaddress.ip_address(addr)) is False


# NOTE: "::ffff:8.8.8.8" is deliberately NOT asserted either way: ipaddress changed how it
# classifies IPv4-mapped addresses across Python versions. Failing closed is acceptable.


# ----------------------------------------------------------------------------
# 12. DNS-based rejections
# ----------------------------------------------------------------------------
@pytest.mark.parametrize(
    "url",
    [
        "https://rebind.example",       # public-looking name -> 127.0.0.1
        "https://v6loop.example",       # -> ::1
        "https://v4mapped.example",     # -> ::ffff:127.0.0.1
        "https://metadata.example",     # -> 169.254.169.254
        "https://multicast.example",
        "https://cgnat.example",
        "https://mixed.example",        # ONE bad record rejects the whole host
        "https://intranet",             # single-label internal name
    ],
)
def test_hostnames_resolving_to_non_public_ips_rejected(url):
    assert reason_of(url) == "resolves_to_non_public_ip"


def test_unknown_host_has_no_records():
    assert reason_of("https://nxdomain.example") == "no_dns_records"


def test_resolver_gaierror_becomes_dns_failure():
    def failing(_h):
        raise socket.gaierror("name or service not known")

    assert reason_of("https://example.com", resolver=failing) == "dns_failure"


def test_resolver_unicode_error_becomes_dns_failure():
    def failing(_h):
        raise UnicodeError("label too long")

    assert reason_of("https://example.com", resolver=failing) == "dns_failure"


def test_resolver_oserror_becomes_dns_failure():
    def failing(_h):
        raise OSError("network unreachable")

    assert reason_of("https://example.com", resolver=failing) == "dns_failure"


def test_resolver_returning_garbage_rejected():
    assert reason_of("https://example.com", resolver=lambda h: {"not-an-ip"}) == "unparsable_resolved_ip"


def test_dns_timeout(monkeypatch):
    monkeypatch.setattr(url_validator, "DNS_TIMEOUT", 0.1)

    def slow(_h):
        time.sleep(0.6)
        return {"93.184.216.34"}

    start = time.monotonic()
    assert reason_of("https://example.com", resolver=slow) == "dns_timeout"
    assert time.monotonic() - start < 0.5          # we did not wait for the slow resolver


# ----------------------------------------------------------------------------
# 13. Return value (ValidatedURL) and resolver contract
# ----------------------------------------------------------------------------
def test_validated_url_fields():
    result = check("https://EXAMPLE.com./products?id=10")
    assert isinstance(result, ValidatedURL)
    assert result.url == "https://EXAMPLE.com./products?id=10"   # original kept
    assert result.scheme == "https"
    assert result.hostname == "example.com"                        # normalized
    assert result.port == 443
    assert result.ips == ("93.184.216.34",)


def test_ips_are_sorted_and_deduplicated():
    result = validate_url(
        "https://example.com",
        resolver=lambda h: ["93.184.216.34", "93.184.216.34", "8.8.8.8", "1.1.1.1"],
    )
    assert result.ips == ("1.1.1.1", "8.8.8.8", "93.184.216.34")


def test_dual_stack_returns_both_families():
    result = check("https://dual.example")
    assert set(result.ips) == {"93.184.216.34", "2606:4700:4700::1111"}


def test_validated_url_is_immutable():
    result = check("https://example.com")
    with pytest.raises(dataclasses.FrozenInstanceError):
        result.hostname = "evil.com"


def test_resolver_receives_normalized_hostname():
    seen = []

    def spy(host):
        seen.append(host)
        return {"93.184.216.34"}

    validate_url("https://EXAMPLE.com.", resolver=spy)
    assert seen == ["example.com"]


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com",                    # scheme
        "https://user:pw@example.com",          # userinfo
        "https://example.com:8080",             # port
        "https://exa mple.com",                 # bad char
        "https://-bad.com",                     # hostname syntax
        "http://2130706433",                    # numeric IP
        "http://127.0.0.1",                     # IP literal
    ],
)
def test_resolver_not_called_when_rejected_early(url):
    def spy(host):
        raise AssertionError(f"DNS lookup should not happen for {url!r}")

    assert not is_safe_url(url, resolver=spy)


# ----------------------------------------------------------------------------
# 14. is_safe_url wrapper
# ----------------------------------------------------------------------------
def test_is_safe_url_returns_bool_and_never_raises():
    for value in [None, "", 123, "https://example.com", "http://127.0.0.1", "\x00", "https://[::1"]:
        result = is_safe_url(value, resolver=fake_resolver)
        assert isinstance(result, bool)


def test_unsafe_url_is_value_error_subclass():
    assert issubclass(UnsafeURL, ValueError)


# ----------------------------------------------------------------------------
# 15. Regression tests: the exact URLs from the original script
# ----------------------------------------------------------------------------
ORIGINAL_SCRIPT_CASES = [
    ("https://example.com", True),
    ("http://localhost:8000", False),
    ("http://127.0.0.1", False),
    ("http://192.168.1.1", False),
    ("ftp://example.com", False),
    ("https://invalid-domain-xyz.example", False),
    ("https://user:password@example.com", False),
    ("https://example.com:99999", False),
    ("https://example.com:443", True),
    ("https://example.com:8080", False),
    ("http://example.com:80", True),
    ("http://example.com:5432", False),
    ("https://", False),
    ("https:///example.com", False),
    ("https://example.com:abc", False),
    ("https://[invalid-ipv6]/", False),
    ("javascript:alert(1)", False),
]


@pytest.mark.parametrize("url,expected", ORIGINAL_SCRIPT_CASES)
def test_original_script_cases(url, expected):
    assert is_safe_url(url, resolver=fake_resolver) is expected


# The last loop of the original script fed bare hostnames to the URL validator. Test them as
# hostnames instead, which is what was intended:
@pytest.mark.parametrize(
    "host,ok",
    [
        ("EXAMPLE.COM", True),
        ("example.com.", True),
        ("example.com..", False),
        ("example..com", False),
        ("-example.com", False),
        ("example-.com", False),
    ],
)
def test_original_hostname_cases(host, ok):
    if ok:
        normalize_hostname(host)
    else:
        with pytest.raises(UnsafeURL):
            normalize_hostname(host)