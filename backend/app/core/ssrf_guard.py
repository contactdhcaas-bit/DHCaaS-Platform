from __future__ import annotations

import asyncio
import ipaddress
import re
import socket
from dataclasses import dataclass
from typing import Awaitable, Callable, Iterable, Union


IPAddress = Union[ipaddress.IPv4Address, ipaddress.IPv6Address]
Resolver = Callable[[str, int], Awaitable[Iterable[str]]]

PRIVATE_NETWORKS = (
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("fc00::/7"),
)

PLATFORM_NETWORKS = (
    ipaddress.ip_network("168.63.129.16/32"),      # Azure host endpoint
    ipaddress.ip_network("100.100.100.200/32"),    # Alibaba Cloud IMDS
    ipaddress.ip_network("fd00:ec2::254/128"),     # AWS EC2 IPv6 IMDS (must never be allowed)
)

TRANSITION_NETWORKS = (
    ipaddress.ip_network("64:ff9b::/96"),
    ipaddress.ip_network("64:ff9b:1::/48"),
    ipaddress.ip_network("2002::/16"),
    ipaddress.ip_network("2001::/32"),
)

DNS_LABEL = re.compile(
    r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?",
    re.ASCII,
)

NUMERIC_LABEL = re.compile(
    r"(?:[0-9]+|0x[0-9a-f]+)",
    re.IGNORECASE | re.ASCII,
)


class SSRFBlocked(ValueError):
    """The connector target failed the destination policy."""


@dataclass(frozen=True)
class ValidatedTarget:
    hostname: str
    port: int
    addresses: tuple[str, ...]


def parse_private_setting(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes"}
    return False


def _in_networks(address: IPAddress, networks: tuple) -> bool:
    return any(
        address.version == network.version and address in network
        for network in networks
    )


def _parse_ip(value: str) -> IPAddress:
    if not isinstance(value, str) or "%" in value:
        raise SSRFBlocked("Invalid resolved address")

    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        raise SSRFBlocked("Invalid resolved address") from None

    if isinstance(address, ipaddress.IPv6Address):
        if address.ipv4_mapped is not None:
            return address.ipv4_mapped

    return address


def _check_address(address: IPAddress, allow_private: bool) -> None:
    if (
        address.is_loopback
        or address.is_link_local
        or address.is_unspecified
        or address.is_multicast
        or address.is_reserved
        or _in_networks(address, PLATFORM_NETWORKS)
        or _in_networks(address, TRANSITION_NETWORKS)
    ):
        raise SSRFBlocked("Connector target address is prohibited")

    if _in_networks(address, PRIVATE_NETWORKS):
        if allow_private:
            return
        raise SSRFBlocked("Private connector targets are disabled")

    if not address.is_global:
        raise SSRFBlocked("Connector target must be globally reachable")


def _normalize_host(host: str) -> str:
    if not isinstance(host, str) or not host or host != host.strip():
        raise SSRFBlocked("Invalid connector host")

    if any(
        char.isspace()
        or ord(char) < 32
        or ord(char) == 127
        or char in "/\\@?#%"
        for char in host
    ):
        raise SSRFBlocked("Invalid connector host")

    if host.startswith("[") or host.endswith("]"):
        if not (host.startswith("[") and host.endswith("]")):
            raise SSRFBlocked("Invalid connector host")
        inner = host[1:-1]
        address = _parse_ip(inner)
        if ":" not in inner:
            raise SSRFBlocked("Invalid connector host")
        return str(address)

    try:
        return str(ipaddress.ip_address(host))
    except ValueError:
        pass

    if ":" in host:
        raise SSRFBlocked("Provide a hostname, not a URL or host:port")

    host = host.rstrip(".")
    if not host:
        raise SSRFBlocked("Invalid connector host")

    try:
        ascii_host = host.encode("idna").decode("ascii").lower()
    except UnicodeError:
        raise SSRFBlocked("Invalid connector host") from None

    labels = ascii_host.split(".")
    if len(ascii_host) > 253 or any(
        not DNS_LABEL.fullmatch(label) for label in labels
    ):
        raise SSRFBlocked("Invalid connector host")

    if all(NUMERIC_LABEL.fullmatch(label) for label in labels):
        raise SSRFBlocked("Ambiguous numeric connector host")

    return ascii_host


async def system_resolver(host: str, port: int) -> tuple[str, ...]:
    loop = asyncio.get_running_loop()
    results = await loop.getaddrinfo(
        host,
        port,
        family=socket.AF_UNSPEC,
        type=socket.SOCK_STREAM,
        proto=socket.IPPROTO_TCP,
    )

    return tuple(
        result[4][0]
        for result in results
        if result[0] in {socket.AF_INET, socket.AF_INET6}
    )


async def validate_connector_target(
    host: str,
    port: int,
    *,
    allow_private: bool = False,
    resolver: Resolver = system_resolver,
    timeout: float = 3.0,
) -> ValidatedTarget:
    if type(port) is not int or not 1 <= port <= 65535:
        raise SSRFBlocked("Invalid connector port")

    hostname = _normalize_host(host)
    allow_private = parse_private_setting(allow_private)

    try:
        literal = ipaddress.ip_address(hostname)
    except ValueError:
        literal = None

    if literal is not None:
        addresses = (hostname,)
    else:
        try:
            addresses = tuple(
                await asyncio.wait_for(
                    resolver(hostname, port),
                    timeout=timeout,
                )
            )
        except (OSError, asyncio.TimeoutError, UnicodeError):
            raise SSRFBlocked("Connector DNS resolution failed") from None

    if not addresses:
        raise SSRFBlocked("Connector DNS returned no addresses")

    validated = []
    for value in addresses:
        address = _parse_ip(value)
        _check_address(address, allow_private)
        normalized = str(address)
        if normalized not in validated:
            validated.append(normalized)

    return ValidatedTarget(
        hostname=hostname,
        port=port,
        addresses=tuple(validated),
    )