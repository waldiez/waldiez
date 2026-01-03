# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined send email tool."""

from copy import deepcopy
from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


# noinspection PyBroadException,TryExceptPass
class SendEmailToolImpl(PredefinedTool):
    """Predefined tool for sending emails."""

    required_secrets: list[str] = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
    ]
    required_kwargs: dict[str, type] = {}

    DEFAULT_KWARGS: dict[str, Any] = {
        "is_async": False,  # controls whether the exported tool function is async or sync
        "subject": "",
        "body_text": "",
        "body_html": "",
        "to": [],
        "attachments": [],
        "cc": [],
        "bcc": [],
        "reply_to": [],
        "sender": "",
        "use_ssl": False,
        "use_starttls": True,
        "timeout": 30.0,
    }

    kwarg_types: dict[str, type] = {
        "is_async": bool,
        "subject": str,
        "body_text": str,
        "body_html": str,
        "to": list,
        "attachments": list,
        "cc": list,
        "bcc": list,
        "reply_to": list,
        "sender": str,
        "use_ssl": bool,
        "use_starttls": bool,
        "timeout": float,
    }

    def __init__(self) -> None:
        self._kwargs: dict[str, Any] = deepcopy(self.DEFAULT_KWARGS)

    @property
    def name(self) -> str:
        return "send_email"

    @property
    def description(self) -> str:
        return "A tool for sending emails with support for attachments, HTML/text content, and various SMTP configurations."

    @property
    def kwargs(self) -> dict[str, Any]:
        """
        Get the keyword arguments for the tool.

        Returns
        -------
        dict[str, Any]
            The keyword arguments for the tool.
        """
        return dict(self._kwargs)

    @property
    def tags(self) -> list[str]:
        return ["email", "communication", "smtp"]

    @property
    def requirements(self) -> list[str]:
        return []

    @property
    def tool_imports(self) -> list[str]:
        return [
            "import asyncio",
            "import smtplib",
            "import ssl",
            "from email.message import EmailMessage",
            "from email.utils import formatdate, make_msgid",
            "from pathlib import Path",
        ]

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """
        Validate the provided secrets against the tool's requirements.

        Parameters
        ----------
        secrets: dict[str, str]
            The secrets to validate.

        Returns
        -------
        list[str]
            A list of validation error messages, if any.
        """
        problems: list[str] = []
        for key in self.required_secrets:
            val = secrets.get(key)
            if val is None or str(val).strip() == "":
                problems.append(key)
        # pylint: disable=broad-exception-caught
        try:
            port = int(secrets.get("SMTP_PORT", ""))
            if not 1 <= port <= 65535:
                problems.append("SMTP_PORT (invalid port range)")
        except Exception:
            problems.append("SMTP_PORT (not a valid integer)")
        return problems

    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """
        Validate the provided keyword arguments against the tool's requirements.

        Parameters
        ----------
        kwargs: dict[str, Any]
            The keyword arguments to validate.

        Returns
        -------
        list[str]
            A list of validation error messages, if any.
        """
        updated = dict(self._kwargs)
        # noinspection DuplicatedCode
        for key, value in kwargs.items():
            if key in self.kwarg_types:
                typ = self.kwarg_types[key]
                # pylint: disable=broad-exception-caught
                try:
                    if typ is list and isinstance(value, str):
                        updated[key] = [
                            s.strip() for s in value.split(",") if s.strip()
                        ]
                    else:
                        updated[key] = typ(value)
                except Exception:
                    pass
        self._kwargs = updated
        return []

    def _get_effective_kwargs(
        self,
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Get effective keyword arguments."""
        effective = dict(self._kwargs)
        # noinspection DuplicatedCode
        if runtime_kwargs:
            # cast only known keys, same rules as validate_kwargs
            for k, v in runtime_kwargs.items():
                if k in self.kwarg_types:
                    typ = self.kwarg_types[k]
                    # pylint: disable=broad-exception-caught
                    try:
                        if typ is list and isinstance(v, str):
                            effective[k] = [
                                s.strip() for s in v.split(",") if s.strip()
                            ]
                        else:
                            effective[k] = typ(v)
                    except Exception:
                        pass
        return effective

    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """
        Generate the email content based on the provided secrets and tool kwargs.

        Parameters
        ----------
        secrets: dict[str, str]
            The secrets required for SMTP authentication and configuration.
        runtime_kwargs: dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            The generated email content.
        """
        smtp_host = secrets.get("SMTP_HOST", "smtp.gmail.com")
        try:
            smtp_port = int(secrets.get("SMTP_PORT", "587"))
        except (ValueError, TypeError):
            smtp_port = 587
        smtp_user = secrets.get("SMTP_USERNAME", "")
        smtp_pass = secrets.get("SMTP_PASSWORD", "")

        effective_kwargs = self._get_effective_kwargs(runtime_kwargs)

        is_async = effective_kwargs.get("is_async", False)
        use_ssl = effective_kwargs.get("use_ssl", False)
        use_starttls = effective_kwargs.get("use_starttls", True)
        timeout = effective_kwargs.get("timeout", 30.0)

        base = f"""
def _collect_rcpts(to, cc, bcc):
    rcpts = []
    for part in (to, cc, bcc):
        if not part:
            continue
        if isinstance(part, str):
            rcpts.extend([s.strip() for s in part.split(",") if s.strip()])
        else:
            rcpts.extend(part)
    seen, out = set(), []
    for r in rcpts:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def _split_emails(value) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [s.strip() for s in value.split(",") if s.strip()]
    return list(value)

def _build_message(
    subject: str,
    sender: str,
    recipients: str | list[str],
    body_text: str | None = None,
    body_html: str | None = None,
    attachments: list | None = None,
    cc: list[str] | None = None,
    reply_to: list[str] | None = None,
) -> EmailMessage:
    recipients = _split_emails(recipients)
    cc = _split_emails(cc)
    reply_to = _split_emails(reply_to)
    attachments = attachments or []

    if not (body_text or body_html):
        raise ValueError("Provide at least one of body_text or body_html.")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid()
    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = ", ".join(reply_to)

    if body_html and body_text:
        msg.set_content(body_text)
        msg.add_alternative(body_html, subtype="html")
    elif body_html:
        msg.add_alternative(body_html, subtype="html")
    else:
        msg.set_content(body_text or "")

    for item in attachments:
        if isinstance(item, Path):
            data = item.read_bytes()
            filename = item.name
            mime = "application/octet-stream"
        else:
            filename, data, mime = item
        maintype, _, subtype = mime.partition("/")
        msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    return msg


def _send_email_sync(
    subject: str,
    to: str | list[str],
    body_text: str | None = None,
    body_html: str | None = None,
    attachments: list | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: list[str] | None = None,
    sender: str | None = None,
    use_ssl: bool = {use_ssl},
    use_starttls: bool = {use_starttls},
    timeout: float = {timeout},
) -> dict:
    smtp_host = "{smtp_host}"
    smtp_port = {smtp_port}
    username = "{smtp_user}"
    password = "{smtp_pass}"
    sender = sender or username

    context = ssl.create_default_context()
    msg = _build_message(
        subject=subject,
        sender=sender,
        recipients=to,
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
        cc=cc,
        reply_to=reply_to,
    )
    rcpts = _collect_rcpts(to, cc, bcc)
    if not rcpts:
        raise ValueError("No recipients provided (to/cc/bcc are all empty).")
    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=timeout) as server:
            if username and password:
                server.login(username, password)
            return server.send_message(msg, to_addrs=rcpts)
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=timeout) as server:
            server.ehlo()
            if use_starttls:
                server.starttls(context=context)
                server.ehlo()
            if username and password:
                server.login(username, password)
            return server.send_message(msg, to_addrs=rcpts)


async def _send_email_async(
    subject: str,
    to: str | list[str],
    body_text: str | None = None,
    body_html: str | None = None,
    attachments: list | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: list[str] | None = None,
    sender: str | None = None,
    use_ssl: bool = {use_ssl},
    use_starttls: bool = {use_starttls},
    timeout: float = {timeout},
) -> dict:
    return await asyncio.to_thread(
        _send_email_sync,
        subject=subject,
        to=to,
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
        cc=cc,
        bcc=bcc,
        reply_to=reply_to,
        sender=sender,
        use_ssl=use_ssl,
        use_starttls=use_starttls,
        timeout=timeout,
    )
"""

        # exported callable is chosen by config: async or sync
        if is_async:
            exported = f'''
async def {self.name}(
    subject: str,
    to: str | list[str],
    body_text: str | None = None,
    body_html: str | None = None,
    attachments: list | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: list[str] | None = None,
    sender: str | None = None,
) -> dict:
    """Send email asynchronously.

    At least one recipient must be specified.
    At least one of `body_text` or `body_html` must be provided.

    Args:
        subject: The email subject.
        to: The recipient email address(es).
        body_text: The plain text body of the email.
        body_html: The HTML body of the email.
        attachments: Any file attachments to include.
        cc: The CC email address(es).
        bcc: The BCC email address(es).
        reply_to: The reply-to email address(es).
        sender: The sender email address.

    Returns:
        A dictionary containing the result of the email sending operation.
    """
    return await _send_email_async(
        subject=subject,
        to=to,
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
        cc=cc,
        bcc=bcc,
        reply_to=reply_to,
        sender=sender,
    )
'''
        else:
            exported = f'''
def {self.name}(
    subject: str,
    to: str | list[str],
    body_text: str | None = None,
    body_html: str | None = None,
    attachments: list | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: list[str] | None = None,
    sender: str | None = None,
) -> dict:
    """Send email synchronously.

    At least one recipient must be specified.
    At least one of `body_text` or `body_html` must be provided.

    Args:
        subject: The email subject.
        to: The recipient email address(es).
        body_text: The plain text body of the email.
        body_html: The HTML body of the email.
        attachments: Any file attachments to include.
        cc: The CC email address(es).
        bcc: The BCC email address(es).
        reply_to: The reply-to email address(es).
        sender: The sender email address.

    Returns:
        A dictionary containing the result of the email sending operation.
    """
    return _send_email_sync(
        subject=subject,
        to=to,
        body_text=body_text,
        body_html=body_html,
        attachments=attachments,
        cc=cc,
        bcc=bcc,
        reply_to=reply_to,
        sender=sender,
    )
'''

        return base + exported


# pylint: disable=invalid-name
SendEmailTool = SendEmailToolImpl()
SendEmailConfig = PredefinedToolConfig(
    name=SendEmailTool.name,
    description=SendEmailTool.description,
    tags=SendEmailTool.tags,
    requirements=SendEmailTool.requirements,
    required_secrets=SendEmailTool.required_secrets,
    required_kwargs=SendEmailTool.required_kwargs,
    implementation=SendEmailTool,
)
