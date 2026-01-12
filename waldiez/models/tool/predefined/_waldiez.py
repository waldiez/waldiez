# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long
# pyright: reportUnnecessaryIsInstance=false
# flake8: noqa: E501
"""Predefined Waldiez tool for Waldiez (like inception or sth)."""

import json
import os
from pathlib import Path
from typing import Any

from ...common import get_valid_python_variable_name
from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class WaldiezFlowToolImpl(PredefinedTool):
    """Perplexity AI search tool for Waldiez."""

    return_options = ["all", "messages", "summary", "last"]
    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {
        "flow": str,
        "name": str,
        "description": str,
        "skip_deps": bool,
    }
    _kwargs: dict[str, Any] = {
        "skip_deps": False,
        "return_option": "all",
        "dot_env": None,
    }

    @property
    def name(self) -> str:
        """Tool name."""
        return "waldiez_flow"

    @property
    def description(self) -> str:
        """Tool description."""
        return "Run a complete waldiez flow as tool."

    @property
    def kwargs(self) -> dict[str, Any]:
        """Keyword arguments for the tool, used for initialization."""
        return self._kwargs

    @property
    def requirements(self) -> list[str]:
        """Python requirements for the tool."""
        return ["waldiez"]

    @property
    def tags(self) -> list[str]:
        """Tags for the tool, used for categorization."""
        return ["waldiez"]

    @property
    def tool_imports(self) -> list[str]:
        """Imports required for the tool implementation."""
        return [
            "from waldiez import WaldiezRunner",
        ]

    def validate_secrets(self, secrets: dict[str, str]) -> list[str]:
        """Validate secrets and return list of missing required ones.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.

        Returns
        -------
        list[str]
            List of missing required secrets.
        """
        return []

    # noinspection DuplicatedCode
    def validate_kwargs(self, kwargs: dict[str, Any]) -> list[str]:
        """Validate keyword arguments and return list of missing required ones.

        Parameters
        ----------
        kwargs : dict[str, Any]
            Dictionary of keyword arguments.

        Returns
        -------
        list[str]
            List of missing required keyword arguments.
        """
        missing: list[str] = []
        for key, type_of in self.required_kwargs.items():
            if key not in kwargs:
                missing.append(key)
                continue
            if key == "flow":
                # handle possible windows path
                flow_path = resolve_path(kwargs[key])
                self._kwargs[key] = flow_path
                continue
            try:
                casted = type_of(kwargs[key])
                self._kwargs[key] = casted
            except Exception:  # pylint: disable=broad-exception-caught
                pass
        dot_env = kwargs.get("dot_env", None)
        if isinstance(dot_env, str):
            self._kwargs["dot_env"] = dot_env
        return_option = kwargs.get("return_option", "all")
        if not return_option or return_option not in self.return_options:
            return_option = "all"
        self._kwargs["return_option"] = return_option
        return missing

    @property
    def return_type(self) -> str:
        """Get the tool's return type."""
        ret = self.kwargs.get("return_option", "all")
        if ret not in self.return_options:
            ret = "all"
        return ret

    def _update_kwargs(self, runtime_kwargs: dict[str, Any] | None) -> None:
        if runtime_kwargs:
            for key, value in runtime_kwargs.items():
                if key in self._kwargs:
                    self._kwargs[key] = value

    def _get_reply_result(self) -> str:
        if self.return_type == "messages":
            return """
        while isinstance(result, list):
            result = result[-1]
        if not isinstance(result, dict) or not result:
            return ReplyResult(message=json.dumps(result, default=str))
        messages = result.get("messages", result.get("history", []))
        if not isinstance(messages, list) or not messages:
            return ReplyResult(message=json.dumps(result, default=str))
        return ReplyResult(message=json.dumps(messages, default=str))
"""
        if self.return_type == "last":
            return """
        while isinstance(result, list):
            result = result[-1]
        if not isinstance(result, dict) or not result:
            return ReplyResult(message=json.dumps(result, default=str))
        messages = result.get("messages", result.get("history", []))
        if not isinstance(messages, list) or not messages:
            return ReplyResult(message=json.dumps(result, default=str))
        last_message = messages[-1]
        if isinstance(last_message, str):
            return ReplyResult(message=last_message)
        if "content" in last_message and isinstance(last_message["content"], str):
            return ReplyResult(message=last_message["content"])
        return ReplyResult(message=json.dumps(messages[-1], default=str))
"""
        if self.return_type == "summary":
            return """
        while isinstance(result, list):
            result = result[-1]
        if not isinstance(result, dict) or not result:
            return ReplyResult(message=json.dumps(result, default=str))
        summary = result.get("summary", "")
        if not isinstance(summary, (str, dict)):
            return ReplyResult(message=json.dumps(summary, default=str))
        if isinstance(summary, str):
            return ReplyResult(message=summary)
        if "content" in summary and isinstance(summary["content"], str):
            return ReplyResult(message=summary["content"])
        return ReplyResult(message=json.dumps(summary, default=str))
"""
        # return_type: "all"
        # everything
        return """
        return ReplyResult(message=json.dumps(result, default=str))
"""

    # pylint: disable=unused-argument
    def get_content(
        self,
        secrets: dict[str, str],
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Get the content of the tool.

        Parameters
        ----------
        secrets : dict[str, str]
            Dictionary of secrets/environment variables.
        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            Content of the tool.
        """
        self._update_kwargs(runtime_kwargs)
        is_async_flow = (
            runtime_kwargs.get("is_async", "False")
            if runtime_kwargs
            else "False"
        )
        is_async = str(is_async_flow).lower().strip() == "true"
        use_structured_io = (
            runtime_kwargs.get("structured_io", True)
            if runtime_kwargs
            else "True"
        )
        structured_io = str(use_structured_io).lower() == "true"
        skip_deps = str(self.kwargs.get("skip_deps", "False")).lower() == "true"
        dot_env: str | None = self.kwargs.get("dot_env", None)
        if (
            not dot_env
            or not isinstance(dot_env, str)
            or not os.path.exists(dot_env)
        ):
            dot_env = None
        dot_env_arg = "None" if not dot_env else f"{json.dumps(dot_env)}"
        the_def = "async def" if is_async else "def"
        name = get_valid_python_variable_name(self.kwargs["name"])
        description = self.kwargs["description"]
        content = f'''
{the_def} {name}(message: str | None = None) -> ReplyResult:
    """{description}

    Args:
        message: str | None: Optional initial message to pass to the flow. Defaults to None (use the flow's original message)

    Returns:
        list[str] | list[dict[str, Any]] | str: The flow results.

    Raises:
        FileNotFoundError: If the flow path cannot be resolved.
        RuntimeError: If running the flow fails.
    """
    import json
    import tempfile
    import shutil
    from urllib.request import urlopen
    from waldiez import WaldiezRunner
    skip_deps = {skip_deps}
    flow = "{self.kwargs.get("flow")}"
    if isinstance(flow, Path):
        flow_str = str(flow)
    else:
        flow_str = flow
    is_http_url = isinstance(flow_str, str) and (
        flow_str.startswith("http://") or flow_str.startswith("https://")
    )
    tmp_dir = tempfile.mkdtemp(prefix="wlz-tool")
    flow_path = os.path.join(tmp_dir, "flow.waldiez")
    output_path = os.path.join(tmp_dir, "flow.py")
    if is_http_url:
        try:
            with urlopen(flow_str) as resp, open(flow_path, "wb") as f:
                shutil.copyfileobj(resp, f)
        except Exception as e:
            raise RuntimeError(f"Failed to download flow from URL {{flow_str}}: {{e}}") from e
    else:
        # Local filesystem check
        if not flow_str or not os.path.exists(flow_str):
            raise FileNotFoundError(f"Invalid flow path: {{flow_str}}")
        shutil.copyfile(flow_str, flow_path)
'''
        content += f"""
    try:
        runner = WaldiezRunner.load(
            flow_path,
            dot_env={dot_env_arg},
            skip_deps=skip_deps,
            structured_io={structured_io},
        )
"""
        if is_async:
            content += f"""
        if message:
            result = await runner.a_run(
                output_path=output_path,
                structured_io={structured_io},
                skip_mmd=True,
                skip_timeline=True,
                skip_symlinks=True,
                is_waat=True,
                message=message,
            )
        else:
            result = await runner.a_run(
                output_path=output_path,
                structured_io={structured_io},
                skip_mmd=True,
                skip_timeline=True,
                skip_symlinks=True,
                is_waat=True,
                message=message,
            )
"""
        else:
            content += f"""
        if message:
            result = runner.run(
                output_path=output_path,
                structured_io={structured_io},
                skip_mmd=True,
                skip_timeline=True,
                skip_symlinks=True,
                message=message,
                is_waat=True,
            )
        else:
            result = runner.run(
                output_path=output_path,
                structured_io={structured_io},
                skip_mmd=True,
                skip_timeline=True,
                skip_symlinks=True,
                is_waat=True,
            )
"""
        content += self._get_reply_result()
        content += """
    except BaseException as error:
        print("error during waat call: ", error)
        raise RuntimeError(str(error)) from error
    finally:
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except BaseException as error:
            pass
"""
        return content


def extract_raw_string_content(value: str) -> str:
    """Remove Python-style raw-string wrapper like r"..." / r'...' if present.

    Parameters
    ----------
    value : str
        The path that might be wrapped in raw string format.

    Returns
    -------
    str
        The actual content of the path, without raw string formatting.
    """
    s = value.strip()
    if len(s) >= 3 and (
        s.startswith('r"')
        or s.startswith("r'")
        or s.startswith('R"')
        or s.startswith("R'")
    ):
        quote = s[1]
        # r"...."
        if s.endswith(quote):
            return s[2:-1]
        # malformed wrapper: r"...  (no closing quote)
        return s[2:]
    return s


def _strip_wrapping_quotes(value: str) -> str:
    s = value.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ('"', "'"):
        return s[1:-1]
    return s


def resolve_path(path: str) -> str:
    """Resolve a local path (or pass through http/https URLs).

    Parameters
    ----------
    path : str
        The path to resolve.

    Returns
    -------
    str
        The resolved path, potentially wrapped in raw string format.

    Raises
    ------
    FileNotFoundError
        If the flow path cannot be resolved.
    """
    s = path.strip()
    if s.startswith(("http://", "https://")):
        return s

    s = extract_raw_string_content(s)
    s = _strip_wrapping_quotes(s)

    # Handle double / JSON-escaped backslashes
    while "\\\\" in s:  # pragma: no cover
        s = s.replace("\\\\", "\\")

    resolved = Path(s).expanduser().resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"Path does not exist: {s}")

    return str(resolved)


# pylint: disable=invalid-name
WaldiezFlowTool = WaldiezFlowToolImpl()
WaldiezFlowConfig = PredefinedToolConfig(
    name=WaldiezFlowTool.name,
    description=WaldiezFlowTool.description,
    required_secrets=WaldiezFlowTool.required_secrets,
    required_kwargs=WaldiezFlowTool.required_kwargs,
    requirements=WaldiezFlowTool.requirements,
    tags=WaldiezFlowTool.tags,
    implementation=WaldiezFlowTool,
)
