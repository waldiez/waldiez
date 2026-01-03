# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc
# pylint: disable=unused-argument, import-outside-toplevel
# pyright: reportUnknownMemberType=false,reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# flake8: noqa: E501
"""Test waldiez.models.tool.predefined._email.*."""

import inspect
from typing import Any

import pytest

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._email import SendEmailToolImpl


class FakeSMTPBase:
    """Fake SMTP base for capturing behavior."""

    def __init__(self, host: str, port: int, **kw: Any):
        self.host = host
        self.port = port
        self.kw = kw
        self.ehlo_called = False
        self.starttls_called = False
        self.login_args: tuple[str, str] | None = None
        self.sent: list[tuple[Any, list[str]]] = []

    # context manager
    def __enter__(self) -> "FakeSMTPBase":
        """Enter the context manager."""
        return self

    def __exit__(self, *exc: Any) -> Any:
        """Exit the context manager."""
        return False

    def ehlo(self) -> None:
        """Identify the client to the SMTP server."""
        self.ehlo_called = True

    # noinspection PyUnusedLocal
    def starttls(self, context: Any = None) -> None:
        """Start TLS encryption."""
        self.starttls_called = True

    def login(self, user: str, pwd: str) -> None:
        """Log in to the SMTP server."""
        self.login_args = (user, pwd)

    def send_message(
        self, msg: Any, to_addrs: list[str] | None = None
    ) -> dict[str, Any]:
        """Send a message via SMTP."""
        self.sent.append((msg, list(to_addrs or [])))
        return {}  # like smtplib: dict of failures, empty on success


class FakeSMTP(FakeSMTPBase):
    """Fake smtplib.SMTP."""


class FakeSMTPSSL(FakeSMTPBase):
    """Fake smtplib.SMTP_SSL."""


@pytest.fixture(name="secrets")
def secrets_fixture() -> dict[str, str]:
    """
    Fixture for providing SMTP secrets.

    Returns
    -------
    dict[str, str]
        The SMTP secrets.
    """
    return {
        "SMTP_HOST": "smtp.test.local",
        "SMTP_PORT": "587",
        "SMTP_USERNAME": "bot@test.local",
        "SMTP_PASSWORD": "secret",  # nosemgrep # nosec
    }


def _exec_generated(
    tool: SendEmailToolImpl, secrets: dict[str, str]
) -> tuple[dict[str, Any], Any, Any, Any]:
    """Exec the generated tool code and return namespace and callables."""
    code = tool.get_content(secrets)
    ns: dict[str, Any] = {}
    # pylint: disable=exec-used
    # noinspection BuiltinExec
    exec("\n".join(tool.tool_imports), ns, ns)  # noqa: S102 # nosemgrep # nosec
    # noinspection BuiltinExec
    exec(code, ns, ns)  # noqa: S102 # nosemgrep # nosec
    sync_fn = ns["_send_email_sync"]
    async_fn = ns["_send_email_async"]
    exported = ns[tool.name]
    return ns, sync_fn, async_fn, exported


def test_validate_secrets(secrets: dict[str, str]) -> None:
    """Test secret validation."""
    tool = SendEmailToolImpl()
    assert not tool.validate_secrets(secrets)

    bad = secrets.copy()
    bad["SMTP_PASSWORD"] = ""  # nosemgrep # nosec
    bad["SMTP_PORT"] = "not-an-int"
    issues = tool.validate_secrets(bad)
    assert "SMTP_PASSWORD" in issues
    assert any("not a valid integer" in s for s in issues)


def test_generated_sync_starttls_paths_and_headers(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """STARTTLS path, header visibility, envelope recipients."""
    created: dict[str, FakeSMTP] = {}

    def _factory(host: str, port: int, **kw: Any) -> FakeSMTP:
        obj = FakeSMTP(host, port, **kw)
        created["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", _factory)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    tool = SendEmailToolImpl()
    tool.validate_kwargs(
        {"is_async": False, "use_ssl": False, "use_starttls": True}
    )
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    res = send_sync(
        subject="S",
        to="one@a",
        body_text="t",
        cc=["two@b", "two@b"],  # dup to test dedupe
        bcc=["hidden@c"],
        reply_to=["r@x"],
    )
    assert res == {}
    smtp_inst: FakeSMTP = created["obj"]
    assert smtp_inst.ehlo_called is True
    assert smtp_inst.starttls_called is True
    assert smtp_inst.login_args == (
        secrets["SMTP_USERNAME"],
        secrets["SMTP_PASSWORD"],
    )
    assert len(smtp_inst.sent) == 1

    msg, to_addrs = smtp_inst.sent[0]
    # Standard headers present
    assert msg["Date"] is not None
    assert msg["Message-ID"] is not None
    # BCC must not be in headers
    assert msg["Bcc"] is None
    # Visible recipients only in headers
    assert set(str(msg["To"]).split(", ")) == {"one@a"}
    assert set(str(msg["Cc"]).split(", ")) == {"two@b"}
    # Envelope: to + cc + bcc (dedup)
    assert set(to_addrs) == {"one@a", "two@b", "hidden@c"}


def test_headers_and_commas(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """Comma-separated strings for to/cc split correctly; headers + envelope match expectations."""
    created: dict[str, FakeSMTP] = {}

    def _factory(host: str, port: int, **kw: Any) -> FakeSMTP:
        obj = FakeSMTP(host, port, **kw)
        created["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", _factory)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    tool = SendEmailToolImpl()
    tool.validate_kwargs({"use_ssl": False, "use_starttls": True})
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    res = send_sync(
        subject="Subject",
        to="a@x, b@y",
        body_text="hello",
        cc="c@z, d@w",
        bcc="h@h",
    )
    assert res == {}
    msg, env = created["obj"].sent[0]
    # Standard headers present
    assert msg["Date"] is not None
    assert msg["Message-ID"] is not None
    # Headers reflect only visible recipients (comma split)
    assert set(str(msg["To"]).split(", ")) == {"a@x", "b@y"}
    assert set(str(msg["Cc"]).split(", ")) == {"c@z", "d@w"}
    # Envelope includes BCC too
    assert set(env) == {"a@x", "b@y", "c@z", "d@w", "h@h"}


def test_bcc_only(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """BCC-only send should work and not set Bcc header."""
    created: dict[str, FakeSMTP] = {}

    def _factory(host: str, port: int, **kw: Any) -> FakeSMTP:
        obj = FakeSMTP(host, port, **kw)
        created["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", _factory)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    tool = SendEmailToolImpl()
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    res = send_sync(subject="S", to="", bcc=["hidden@c"], body_text="t")
    assert res == {}
    msg, env = created["obj"].sent[0]
    # No To/Cc headers, but still sends
    assert (msg["To"] or "") == ""
    assert msg["Cc"] is None
    assert msg["Bcc"] is None
    assert set(env) == {"hidden@c"}


def test_missing_body_raises(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """Guardrail: must provide body_text or body_html."""
    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    tool = SendEmailToolImpl()
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    with pytest.raises(
        ValueError, match="Provide at least one of body_text or body_html"
    ):
        send_sync(subject="S", to="a@x")


def test_generated_ssl_path(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """SMTPS path (implicit TLS) should not call STARTTLS."""
    created_ssl: dict[str, FakeSMTPSSL] = {}

    def _factory_ssl(host: str, port: int, **kw: Any) -> FakeSMTPSSL:
        obj = FakeSMTPSSL(host, port, **kw)
        created_ssl["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP_SSL", _factory_ssl)
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)

    tool = SendEmailToolImpl()
    tool.validate_kwargs({"use_ssl": True, "use_starttls": False})
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    res = send_sync(subject="X", to=["a@x"], body_text="t", bcc=["h@x"])
    assert res == {}
    inst: FakeSMTPSSL = created_ssl["obj"]
    assert inst.starttls_called is False
    assert len(inst.sent) == 1
    _, to_addrs = inst.sent[0]
    assert set(to_addrs) == {"a@x", "h@x"}


@pytest.mark.asyncio
async def test_exported_async_when_configured(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """Exported callable is truly async when configured; works end-to-end."""
    # Configure the tool to export an async function
    tool = SendEmailToolImpl()
    tool.validate_kwargs({"is_async": True})

    created: dict[str, FakeSMTP] = {}

    def _factory(host: str, port: int, **kw: Any) -> FakeSMTP:
        obj = FakeSMTP(host, port, **kw)
        created["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", _factory)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    _ns, _send_sync, _send_async, exported = _exec_generated(tool, secrets)

    assert inspect.iscoroutinefunction(exported)

    res = await exported(
        subject="A",
        to="x@y",
        body_text="yo",
        cc=["c@c"],
        bcc=["b@b"],
    )
    assert res == {}
    inst: FakeSMTP = created["obj"]
    assert len(inst.sent) == 1
    msg, env = inst.sent[0]
    assert msg["Bcc"] is None
    assert set(env) == {"x@y", "c@c", "b@b"}


def test_sender_default_and_override(
    monkeypatch: pytest.MonkeyPatch, secrets: dict[str, str]
) -> None:
    """From defaults to SMTP_USERNAME; override respected."""
    created: dict[str, FakeSMTP] = {}

    def _factory(host: str, port: int, **kw: Any) -> FakeSMTP:
        obj = FakeSMTP(host, port, **kw)
        created["obj"] = obj
        return obj

    import smtplib

    monkeypatch.setattr(smtplib, "SMTP", _factory)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSMTPSSL)

    tool = SendEmailToolImpl()
    _ns, send_sync, _send_async, _exported = _exec_generated(tool, secrets)

    # default sender (SMTP_USERNAME)
    send_sync(subject="S", to="a@x", body_text="t")
    msg, _ = created["obj"].sent[0]
    assert msg["From"] == secrets["SMTP_USERNAME"]

    # explicit sender override
    created.clear()
    send_sync(subject="S", to="a@x", sender="over@ride", body_text="t")
    msg, _ = created["obj"].sent[0]
    assert msg["From"] == "over@ride"
