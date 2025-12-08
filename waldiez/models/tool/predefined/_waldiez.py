# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Predefined Waldiez tool for Waldiez (like inception or sth)."""

from typing import Any

from ._config import PredefinedToolConfig
from .protocol import PredefinedTool


class WaldiezFlowToolImpl(PredefinedTool):
    """Perplexity AI search tool for Waldiez."""

    required_secrets: list[str] = []
    required_kwargs: dict[str, type] = {"flow": str, "skip_deps": bool}
    _kwargs: dict[str, Any] = {"skip_deps": False}

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
        structured_io = str(use_structured_io).lower() == "false"
        skip_deps = str(self.kwargs.get("skip_deps", "False")).lower() == "true"
        the_def = "async def" if is_async else "def"
        content = f'''
{the_def} {self.name}(flow: str | Path | None = None, env_path: str | None = None, skip_deps: bool | None = None) -> ReplyResult:
    """Run a waldiez flow and return its results.

    Args:
        flow: The path of te flow to run.
        env_path: Optional path to file with environment variables to use for the flow.
        skip_deps : Skip 'pip install' dependencies before running the flow.

    Returns:
        list[str] | list[dict[str, Any]] | str: The flow results.

    Raises:
        FileNotFoundError: If the flow path cannot be resolved.
        RuntimeError: If running the flow fails.
    """
    import tempfile
    import os
    import shutil
    from urllib.request import urlopen
    from waldiez import WaldiezRunner
    if skip_deps is None:
        skip_deps = {skip_deps}
    if not flow or (not flow.startswith("http") and not os.path.exists(flow)):
        flow = "{self.kwargs.get("flow")}"
    if isinstance(flow, Path):
        flow_str = str(flow)
    else:
        flow_str = flow

    is_http_url = isinstance(flow_str, str) and (
        flow_str.startswith("http://") or flow_str.startswith("https://")
    )
    tmp_dir = tempfile.mkdtemp(prefix="waldiez_flow_")
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
        runner = WaldiezRunner.load(flow, dot_env=env_path, skip_deps=skip_deps)
"""
        if is_async:
            content += f"""
        result = await runner.a_run(output_path=output_path, structured_io={structured_io}, skip_mmd=True, skip_timeline=True, skip_symlinks=True)
"""
        else:
            content += f"""
        result = runner.run(output_path=output_path, structured_io={structured_io}, skip_mmd=True, skip_timeline=True, skip_symlinks=True)
"""
        content += """
        return ReplyResult(message=f"{result}")
    except BaseException as error:
        print(error)
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
