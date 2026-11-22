"""SSRF-oriented URL validator.

validate_url() returns the resolved public IPs so the caller can CONNECT TO THOSE IPs
(pinning) instead of letting the HTTP client resolve the name a second time.
"""
import ipaddress
import re
import socket
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from dataclasses import dataclass
from typing import Callable, Iterable
from urllib.parse import urlsplit

DEFAULT_PORTS = {"http": 80, "https": 443}
MAX_URL_LENGTH = 2048
DNS_TIMEOUT = 3.0

_LABEL_RE = re.compile(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")
# whitespace, control chars, backslash (browsers treat "\" like "/", parsers disagree)
_BAD_CHARS_RE = re.compile(r"[\x00-\x20\x7f\\]")
_NAT64 = ipaddress.ip_network("64:ff9b::/96")

_pool = ThreadPoolExecutor(max_workers=4)


class UnsafeURL(ValueError):
    """Raised with a machine-readable reason. Log it; don't echo it to end users."""


@dataclass(frozen=True)
class ValidatedURL:
    url: str
    scheme: str
    hostname: str          # normalized (lowercase, no trailing dot)
    port: int
    ips: tuple[str, ...]   # all public IPs the host resolves to -> connect to one of these


# ---------- IP checks ----------
def is_public_ip(ip: ipaddress._BaseAddress) -> bool:
    if ip.version == 6:
        embedded = []
        if ip.ipv4_mapped:
            embedded.append(ip.ipv4_mapped)           # ::ffff:127.0.0.1
        if ip.sixtofour:
            embedded.append(ip.sixtofour)             # 2002::/16
        if ip.teredo:
            embedded.extend(ip.teredo)                # 2001::/32 (server, client)
        if ip in _NAT64:
            embedded.append(ipaddress.IPv4Address(int(ip) & 0xFFFFFFFF))
        if any(not is_public_ip(e) for e in embedded):
            return False
    # is_global alone is not enough on every Python version (e.g. multicast), so be explicit
    return ip.is_global and not (
        ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast
        or ip.is_reserved or ip.is_unspecified
    )


# ---------- hostname checks ----------
def normalize_hostname(host: str) -> str:
    host = host.lower()
    if host.endswith("."):
        host = host[:-1]
    if not host or len(host) > 253:
        raise UnsafeURL("bad_hostname_length")
    labels = host.split(".")
    for label in labels:
        if len(label) > 63 or not _LABEL_RE.fullmatch(label):
            raise UnsafeURL("bad_hostname_label")
    # Real TLDs always start with a letter. This kills every legacy numeric form that
    # inet_aton/getaddrinfo may accept: 2130706433, 127.1, 0177.0.0.1, 0x7f.0x1 ...
    if not labels[-1][0].isalpha():
        raise UnsafeURL("numeric_or_ambiguous_ip_form")
    return host


# ---------- DNS ----------
def system_resolver(host: str) -> Iterable[str]:
    infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    return {i[4][0] for i in infos}


def resolve(host: str, resolver: Callable[[str], Iterable[str]]) -> set[str]:
    future = _pool.submit(resolver, host)
    try:
        return set(future.result(timeout=DNS_TIMEOUT))
    except FutureTimeout:
        raise UnsafeURL("dns_timeout")
    except (socket.gaierror, UnicodeError, OSError):
        raise UnsafeURL("dns_failure")


# ---------- main entry ----------
def validate_url(url: str, resolver: Callable[[str], Iterable[str]] = system_resolver) -> ValidatedURL:
    if not isinstance(url, str) or not url:
        raise UnsafeURL("empty_or_non_string")
    if len(url) > MAX_URL_LENGTH:
        raise UnsafeURL("too_long")
    if _BAD_CHARS_RE.search(url):
        raise UnsafeURL("whitespace_control_or_backslash")
    if not url.isascii():
        raise UnsafeURL("non_ascii")  # force callers to send punycode (xn--) explicitly

    try:
        parts = urlsplit(url)
        port = parts.port           # may raise ValueError (non-numeric / out of range)
        host = parts.hostname
    except ValueError:
        raise UnsafeURL("unparsable")

    scheme = parts.scheme
    if scheme not in DEFAULT_PORTS:
        raise UnsafeURL("scheme_not_allowed")
    if "@" in parts.netloc:
        raise UnsafeURL("userinfo_not_allowed")   # also catches "https://@host"
    if not host:
        raise UnsafeURL("missing_host")
    if port is not None and port != DEFAULT_PORTS[scheme]:
        raise UnsafeURL("port_not_allowed")
    port = port or DEFAULT_PORTS[scheme]

    # IP literal (v4 dotted-quad or bracketed v6): check directly, no DNS needed
    try:
        literal = ipaddress.ip_address(host)
    except ValueError:
        literal = None

    if literal is not None:
        if not is_public_ip(literal):
            raise UnsafeURL("non_public_ip")
        return ValidatedURL(url, scheme, str(literal), port, (str(literal),))

    host = normalize_hostname(host)
    addrs = resolve(host, resolver)
    if not addrs:
        raise UnsafeURL("no_dns_records")

    ips = []
    for a in addrs:
        try:
            ip = ipaddress.ip_address(a)
        except ValueError:
            raise UnsafeURL("unparsable_resolved_ip")
        if not is_public_ip(ip):
            raise UnsafeURL("resolves_to_non_public_ip")  # ONE bad record rejects the host
        ips.append(str(ip))
    return ValidatedURL(url, scheme, host, port, tuple(sorted(ips)))


def is_safe_url(url: str, **kw) -> bool:
    try:
        validate_url(url, **kw)
        return True
    except UnsafeURL:
        return False