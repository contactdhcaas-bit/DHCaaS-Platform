import asyncio
import pytest

from app.core.ssrf_guard import (
    SSRFBlocked,
    parse_private_setting,
    validate_connector_target,
)


def run(coroutine):
    return asyncio.run(coroutine)


async def never_resolve(host, port):
    raise AssertionError("Literal IP must not trigger DNS")


@pytest.mark.parametrize("host", [
    "169.254.169.254",
    "169.254.170.2",
    "169.254.0.1",
    "127.0.0.1",
    "127.255.255.254",
    "::1",
    "[::1]",
    "::ffff:127.0.0.1",
    "::ffff:169.254.169.254",
    "fe80::1",
    "fd00:ec2::254",
    "0.0.0.0",
    "::",
    "224.0.0.1",
    "ff02::1",
    "100.64.0.1",
    "168.63.129.16",
    "100.100.100.200",
    "192.0.2.1",
    "2001:db8::1",
    "64:ff9b::a00:1",
])
def test_prohibited_addresses(host):
    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            host, 5432, resolver=never_resolve
        ))


@pytest.mark.parametrize("host", [
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.254",
    "192.168.1.2",
    "fd12:3456::1",
    "::ffff:10.1.2.3",
])
def test_private_targets_default_denied(host):
    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            host, 5432, resolver=never_resolve
        ))


@pytest.mark.parametrize("host", [
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.2",
    "fd12:3456::1",
])
def test_private_override(host):
    target = run(validate_connector_target(
        host, 5432, allow_private=True, resolver=never_resolve
    ))
    assert target.addresses == (host,)


@pytest.mark.parametrize("host", [
    "127.0.0.1",
    "::1",
    "169.254.169.254",
    "fe80::1",
    "168.63.129.16",
    "fd00:ec2::254",
])
def test_private_override_never_enables_dangerous_targets(host):
    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            host, 5432, allow_private=True, resolver=never_resolve
        ))


@pytest.mark.parametrize("host", [
    "8.8.8.8",
    "2606:4700:4700::1111",
])
def test_public_literals(host):
    target = run(validate_connector_target(
        host, 5432, resolver=never_resolve
    ))
    assert target.addresses == (host,)


@pytest.mark.parametrize("host", [
    "http://example.com",
    "user@example.com",
    "example.com:5432",
    "example.com/path",
    "example.com?x=1",
    "example.com#fragment",
    " example.com",
    "example.com ",
    "example.com\n",
    "fe80::1%eth0",
    "2130706433",
    "127.1",
    "0177.0.0.1",
    "0x7f000001",
    "0x7f.0.0.1",
    "",
])
def test_invalid_or_ambiguous_hosts(host):
    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            host, 5432, resolver=never_resolve
        ))


@pytest.mark.parametrize("port", [0, 65536, -1, True, "5432"])
def test_invalid_ports(port):
    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            "8.8.8.8", port, resolver=never_resolve
        ))


@pytest.mark.parametrize("answers", [
    ("127.0.0.1",),
    ("169.254.169.254",),
    ("10.0.0.1",),
    ("::1",),
    ("8.8.8.8", "192.168.1.2"),
    ("8.8.8.8", "::ffff:127.0.0.1"),
    ("8.8.8.8", "fe80::1"),
])
def test_dns_all_answers_must_pass(answers):
    async def resolver(host, port):
        return answers

    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            "db.example.com", 5432, resolver=resolver
        ))


def test_dns_public_answers():
    async def resolver(host, port):
        assert host == "db.example.com"
        assert port == 5432
        return (
            "8.8.8.8",
            "2606:4700:4700::1111",
            "8.8.8.8",
        )

    target = run(validate_connector_target(
        "DB.EXAMPLE.COM.", 5432, resolver=resolver
    ))
    assert target.hostname == "db.example.com"
    assert target.addresses == (
        "8.8.8.8",
        "2606:4700:4700::1111",
    )


def test_empty_dns_fails_closed():
    async def resolver(host, port):
        return ()

    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            "db.example.com", 5432, resolver=resolver
        ))


def test_dns_error_fails_closed():
    async def resolver(host, port):
        raise OSError("Resolution failed")

    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            "db.example.com", 5432, resolver=resolver
        ))


def test_dns_timeout_fails_closed():
    async def resolver(host, port):
        await asyncio.sleep(1)
        return ("8.8.8.8",)

    with pytest.raises(SSRFBlocked):
        run(validate_connector_target(
            "db.example.com",
            5432,
            resolver=resolver,
            timeout=0.01,
        ))


def test_revalidation_blocks_changed_dns():
    calls = 0

    async def resolver(host, port):
        nonlocal calls
        calls += 1
        return ("8.8.8.8",) if calls == 1 else ("127.0.0.1",)

    async def scenario():
        created = await validate_connector_target(
            "db.example.com", 5432, resolver=resolver
        )
        assert created.addresses == ("8.8.8.8",)

        with pytest.raises(SSRFBlocked):
            await validate_connector_target(
                "db.example.com", 5432, resolver=resolver
            )

    run(scenario())
    assert calls == 2


@pytest.mark.parametrize("value", [
    False, None, "false", "0", "no", "", "unexpected"
])
def test_private_setting_fail_closed(value):
    assert parse_private_setting(value) is False


@pytest.mark.parametrize("value", [
    True, "true", "1", "yes", " TRUE "
])
def test_private_setting_explicit_enable(value):
    assert parse_private_setting(value) is True