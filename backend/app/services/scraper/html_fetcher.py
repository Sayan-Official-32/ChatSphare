from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit

import httpx

from app.services.scraper.url_validator import (
    UnsafeURL,
    validate_url,
)


# Initial safety limits
CONNECT_TIMEOUT = 5.0
READ_TIMEOUT = 15.0
MAX_REDIRECTS = 5
MAX_HTML_SIZE = 5 * 1024 * 1024  # 5 MB

REDIRECT_CODES = {301, 302, 303, 307, 308}

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36 ChatSphareBot/1.0"
)
DEFAULT_HEADERS = {
    "User-Agent": DEFAULT_USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def _clean_response_headers(headers: httpx.Headers) -> httpx.Headers:
    """
    Remove content-encoding and content-length headers when constructing a response copy
    with already-decompressed in-memory bytes to prevent secondary zlib decompression crashes.
    """
    return httpx.Headers({
        k: v for k, v in headers.items()
        if k.lower() not in ("content-encoding", "content-length")
    })


class FetchError(Exception):
    """Raised when a webpage cannot be fetched safely."""


@dataclass(frozen=True)
class FetchResult:
    url: str
    status_code: int
    content_type: str
    html: str


class PinnedIPTransport(httpx.BaseTransport):
    """
    Connect to an IP already approved by the URL validator,
    while preserving the original hostname for HTTP Host and TLS SNI.
    """

    def __init__(self, hostname: str, ip: str):
        self.hostname = hostname
        self.ip = ip
        self.transport = httpx.HTTPTransport(
            verify=True,
            trust_env=False,
            retries=0,
        )

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        original_url = request.url

        # Change only the network destination.
        request.url = original_url.copy_with(host=self.ip)

        # Keep the original website identity.
        port = original_url.port
        default_port = 443 if original_url.scheme == "https" else 80

        host_header = self.hostname
        if port is not None and port != default_port:
            host_header = f"{self.hostname}:{port}"

        request.headers["host"] = host_header

        # Preserve the original hostname for TLS SNI.
        if original_url.scheme == "https":
            request.extensions["sni_hostname"] = self.hostname

        return self.transport.handle_request(request)

    def close(self) -> None:
        self.transport.close()


def _download_once(url: str) -> httpx.Response:
    """
    Validate the URL and download from an approved IP.
    Automatic redirects are deliberately disabled.
    """

    validated = validate_url(url)

    if not validated.ips:
        raise FetchError("No validated IP addresses available")

    # Use an IP that was approved by the validator.
    approved_ip = validated.ips[0]

    transport = PinnedIPTransport(
        hostname=validated.hostname,
        ip=approved_ip,
    )

    timeout = httpx.Timeout(
        connect=CONNECT_TIMEOUT,
        read=READ_TIMEOUT,
        write=5.0,
        pool=5.0,
    )

    try:
        with httpx.Client(
            transport=transport,
            timeout=timeout,
            follow_redirects=False,
            trust_env=False,
            headers=DEFAULT_HEADERS,
        ) as client:
            # Stream instead of downloading the entire response at once.
            with client.stream("GET", validated.url) as response:
                # Copy the bounded body before the client closes.
                body = bytearray()

                if response.status_code in REDIRECT_CODES:
                    return _make_response_copy(response, bytes(body))

                if response.status_code != 200:
                    raise FetchError(
                        f"Website returned HTTP {response.status_code}"
                    )

                content_type = response.headers.get(
                    "content-type", ""
                ).lower()

                if "text/html" not in content_type:
                    raise FetchError(
                        f"Expected HTML, received: {content_type}"
                    )

                content_length = response.headers.get("content-length")

                if content_length:
                    try:
                        if int(content_length) > MAX_HTML_SIZE:
                            raise FetchError(
                                "HTML response exceeds size limit"
                            )
                    except ValueError:
                        raise FetchError("Invalid Content-Length header")

                for chunk in response.iter_bytes():
                    body.extend(chunk)

                    if len(body) > MAX_HTML_SIZE:
                        raise FetchError(
                            "HTML response exceeds size limit"
                        )

                # Build a response copy with the downloaded content.
                # Headers are cleaned to strip content-encoding / content-length
                # because `body` is already decompressed plain bytes.
                return httpx.Response(
                    status_code=response.status_code,
                    headers=_clean_response_headers(response.headers),
                    content=bytes(body),
                    request=response.request,
                )

    except UnsafeURL:
        raise
    except httpx.TimeoutException as exc:
        raise FetchError("Website request timed out") from exc
    except httpx.HTTPError as exc:
        raise FetchError(f"HTTP request failed: {exc}") from exc
    finally:
        transport.close()


def _make_response_copy(
    response: httpx.Response,
    body: bytes,
) -> httpx.Response:
    return httpx.Response(
        status_code=response.status_code,
        headers=_clean_response_headers(response.headers),
        content=body,
        request=response.request,
    )


def fetch_html(url: str) -> FetchResult:
    """
    Fetch HTML safely, validating every redirect destination.
    """

    current_url = url

    for redirect_count in range(MAX_REDIRECTS + 1):

        response = _download_once(current_url)

        if response.status_code not in REDIRECT_CODES:
            try:
                html = response.text
                return FetchResult(
                    url=str(response.request.url),
                    status_code=response.status_code,
                    content_type=response.headers.get(
                        "content-type", ""
                    ),
                    html=html,
                )
            finally:
                response.close()

        try:
            location = response.headers.get("location")

            if not location:
                raise FetchError("Redirect has no Location header")

            if redirect_count == MAX_REDIRECTS:
                raise FetchError("Maximum redirect limit exceeded")

            current_url = urljoin(current_url, location)

            # The next iteration validates the new destination
            # before making another network request.

        finally:
            response.close()

    raise FetchError("Unable to fetch webpage")


class AsyncPinnedIPTransport(httpx.AsyncBaseTransport):
    """
    Async transport that connects to an IP approved by the URL validator,
    while preserving the original hostname for HTTP Host and TLS SNI.
    """

    def __init__(self, hostname: str, ip: str):
        self.hostname = hostname
        self.ip = ip
        self.transport = httpx.AsyncHTTPTransport(
            verify=True,
            trust_env=False,
            retries=0,
        )

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        original_url = request.url
        request.url = original_url.copy_with(host=self.ip)

        port = original_url.port
        default_port = 443 if original_url.scheme == "https" else 80

        host_header = self.hostname
        if port is not None and port != default_port:
            host_header = f"{self.hostname}:{port}"

        request.headers["host"] = host_header

        if original_url.scheme == "https":
            request.extensions["sni_hostname"] = self.hostname

        return await self.transport.handle_async_request(request)

    async def aclose(self) -> None:
        await self.transport.aclose()


async def _download_once_async(url: str) -> httpx.Response:
    validated = validate_url(url)

    if not validated.ips:
        raise FetchError("No validated IP addresses available")

    approved_ip = validated.ips[0]
    transport = AsyncPinnedIPTransport(
        hostname=validated.hostname,
        ip=approved_ip,
    )

    timeout = httpx.Timeout(
        connect=CONNECT_TIMEOUT,
        read=READ_TIMEOUT,
        write=5.0,
        pool=5.0,
    )

    try:
        async with httpx.AsyncClient(
            transport=transport,
            timeout=timeout,
            follow_redirects=False,
            trust_env=False,
            headers=DEFAULT_HEADERS,
        ) as client:
            async with client.stream("GET", validated.url) as response:
                body = bytearray()

                if response.status_code in REDIRECT_CODES:
                    return _make_response_copy(response, bytes(body))

                if response.status_code != 200:
                    raise FetchError(
                        f"Website returned HTTP {response.status_code}"
                    )

                content_type = response.headers.get(
                    "content-type", ""
                ).lower()

                if "text/html" not in content_type:
                    raise FetchError(
                        f"Expected HTML, received: {content_type}"
                    )

                content_length = response.headers.get("content-length")
                if content_length:
                    try:
                        if int(content_length) > MAX_HTML_SIZE:
                            raise FetchError(
                                "HTML response exceeds size limit"
                            )
                    except ValueError:
                        raise FetchError("Invalid Content-Length header")

                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > MAX_HTML_SIZE:
                        raise FetchError(
                            "HTML response exceeds size limit"
                        )

                return httpx.Response(
                    status_code=response.status_code,
                    headers=_clean_response_headers(response.headers),
                    content=bytes(body),
                    request=response.request,
                )

    except UnsafeURL:
        raise
    except httpx.TimeoutException as exc:
        raise FetchError("Website request timed out") from exc
    except httpx.HTTPError as exc:
        raise FetchError(f"HTTP request failed: {exc}") from exc
    finally:
        await transport.aclose()


async def fetch_html_async(url: str) -> FetchResult:
    """
    Fetch HTML asynchronously, validating every redirect destination.
    Safe for direct usage inside FastAPI async route handlers.
    """
    current_url = url

    for redirect_count in range(MAX_REDIRECTS + 1):
        response = await _download_once_async(current_url)

        if response.status_code not in REDIRECT_CODES:
            try:
                html = response.text
                return FetchResult(
                    url=str(response.request.url),
                    status_code=response.status_code,
                    content_type=response.headers.get("content-type", ""),
                    html=html,
                )
            finally:
                await response.aclose()

        try:
            location = response.headers.get("location")
            if not location:
                raise FetchError("Redirect has no Location header")

            if redirect_count == MAX_REDIRECTS:
                raise FetchError("Maximum redirect limit exceeded")

            current_url = urljoin(current_url, location)
        finally:
            await response.aclose()

    raise FetchError("Unable to fetch webpage")
