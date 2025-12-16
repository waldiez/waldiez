# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Waldiez tool for Waldiez (like inception or sth)."""

import json
from typing import Any

from ...common import get_valid_python_variable_name
from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class WaldiezFlowToolImpl(PredefinedTool):
    """Perplexity AI search tool for Waldiez."""

    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {
        "flow": str,
        "name": str,
        "description": str,
        "skip_deps": bool,
    }
    _kwargs: dict[str, Any] = {"skip_deps": False, "message": None}

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
            try:
                casted = type_of(kwargs[key])
                self._kwargs[key] = casted
            except Exception:  # pylint: disable=broad-exception-caught
                pass
        message = kwargs.get("message", None)
        if isinstance(message, str):
            self._kwargs["message"] = message
        return missing

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
        the_def = "async def" if is_async else "def"
        name = get_valid_python_variable_name(self.kwargs["name"])
        description = self.kwargs["description"]
        message = self.kwargs["message"]
        message_arg = "None"
        if message:
            message_arg = f"{json.dumps(message)}"
        content = f'''
{the_def} {name}() -> ReplyResult:
    """{description}

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
        content += """
    try:
        runner = WaldiezRunner.load(flow_path, dot_env=env_path, skip_deps=skip_deps)
"""
        if is_async:
            content += f"""
        result = await runner.a_run(
            output_path=output_path,
            structured_io={structured_io},
            skip_mmd=True,
            skip_timeline=True,
            skip_symlinks=True,
            message={message_arg},
        )
"""
        else:
            content += f"""
        result = runner.run(
            output_path=output_path,
            structured_io={structured_io},
            skip_mmd=True,
            skip_timeline=True,
            skip_symlinks=True,
            message={message_arg},
        )
"""
        content += """
        return ReplyResult(message=json.dumps(result))
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
