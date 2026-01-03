# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Tool model."""

import json
import re
from pathlib import Path
from typing import Any

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..common import (
    WaldiezBase,
    gather_code_imports,
    get_function,
    now,
    parse_code_string,
)
from .predefined import (
    get_predefined_tool_config,
    list_predefined_tools,
)
from .tool_data import WaldiezToolData
from .tool_type import WaldiezToolType

SHARED_TOOL_NAME = "waldiez_shared"


class WaldiezTool(WaldiezBase):
    """Waldiez Tool.

    Attributes
    ----------
    id : str
        The ID of the tool.
    type : Literal["tool"]
        The type of the "node" in a graph: "tool".
    name : str
        The name of the tool.
    description : str
        The description of the tool.
    tags : list[str]
        The tags of the tool.
    requirements : list[str]
        The requirements of the tool.
    created_at : str, optional
        The date and time when the tool was created.
    updated_at : str, optional
        The date and time when the tool was last updated.
    data : WaldiezToolData
        The data of the tool. See `WaldiezToolData`.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The ID of the tool.")
    ]
    type: Annotated[
        Literal["tool"],
        Field(
            default="tool",
            title="Type",
            description="The type of the 'node' in a graph.",
        ),
    ]
    name: Annotated[
        str, Field(..., title="Name", description="The name of the tool.")
    ]
    description: Annotated[
        str,
        Field(
            ...,
            title="Description",
            description="The description of the tool.",
        ),
    ]
    tags: Annotated[
        list[str],
        Field(
            title="Tags",
            description="The tags of the tool.",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        list[str],
        Field(
            title="Requirements",
            description="The requirements of the tool.",
            default_factory=list,
        ),
    ]
    data: Annotated[
        WaldiezToolData,
        Field(..., title="Data", description="The data of the tool."),
    ]
    created_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Created At",
            description="The date and time when the tool was created.",
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Updated At",
            description="The date and time when the tool was last updated.",
        ),
    ]

    def get_name(self) -> str:
        """Get the name of the tool.

        Returns
        -------
        str
            The name of the tool.
        """
        if self.is_waldiez_flow:
            return self.data.kwargs.get("name", self.name)
        return self.name

    def get_description(self) -> str:
        """Get the description of the tool.

        Returns
        -------
        str
            The description of the tool.
        """
        if self.is_waldiez_flow:
            return self.data.kwargs.get("description", self.description)
        return self.description

    @staticmethod
    def load(data_or_path: str | Path | dict[str, Any]) -> "WaldiezTool":
        """Load a tool from a read-only file.

        Parameters
        ----------
        data_or_path : str | Path | dict[str, Any]
            The path to the read-only file or the loaded data.

        Returns
        -------
        WaldiezTool
            The tool.

        Raises
        ------
        FileNotFoundError
            If the file is not found.
        ValueError
            If the JSON is invalid or the data is invalid.
        """
        if isinstance(data_or_path, dict):
            return WaldiezTool.model_validate(data_or_path)
        if not isinstance(data_or_path, Path):
            data_or_path = Path(data_or_path)
        resolved = data_or_path.resolve()
        if not resolved.is_file():
            raise FileNotFoundError(f"File not found: {resolved}")
        with resolved.open("r", encoding="utf-8") as file:
            data_string = file.read()
            # pylint: disable=broad-exception-caught
            try:
                data_dict = json.loads(data_string)
            except BaseException as exc:
                raise ValueError(f"Invalid WaldiezTool/JSON: {exc}") from exc
            return WaldiezTool.model_validate(data_dict)

    @property
    def tool_type(self) -> WaldiezToolType:
        """Get the tool type.

        Returns
        -------
        WaldiezToolType
            The type of the tool:
            [shared, custom, langchain, crewai].
        """
        return self.data.tool_type

    _tool_imports: tuple[list[str], list[str]] = ([], [])

    def get_imports(self) -> tuple[list[str], list[str]]:
        """Get the tool imports.

        Returns
        -------
        tuple[list[str], list[str]]
            The builtin and external imports.
        """
        return self._tool_imports

    @property
    def is_shared(self) -> bool:
        """Check if the tool is shared.

        Returns
        -------
        bool
            True if the tool is shared, False otherwise.
        """
        return self.tool_type == "shared" or self.name == SHARED_TOOL_NAME

    @property
    def is_predefined(self) -> bool:
        """Check if the tool is predefined.

        Returns
        -------
        bool
            True if the tool is predefined, False otherwise.
        """
        return self.tool_type == "predefined"

    @property
    def is_interop(self) -> bool:
        """Check if the tool is interoperability.

        Returns
        -------
        bool
            True if the tool is interoperability, False otherwise.
        """
        return self.tool_type in ("langchain", "crewai")

    @property
    def is_waldiez_flow(self) -> bool:
        """Check if the tool is a waldiez flow.

        Returns
        -------
        bool
            True if the tool is a waldiez flow, False otherwise.
        """
        return self.is_predefined and (self.name == "waldiez_flow")

    @property
    def content(self) -> str:
        """Get the content (source) of the tool."""
        return self.data.content

    @property
    def secrets(self) -> dict[str, str]:
        """Get the secrets (environment variables) of the tool."""
        return self.data.secrets or {}

    def get_content(self, runtime_kwargs: dict[str, Any] | None = None) -> str:
        """Get the content of the tool.

        Parameters
        ----------
        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            The content of the tool.
        """
        if self.is_predefined:
            if self.is_waldiez_flow:
                runtime_kwargs = runtime_kwargs or {}
                # we might have modified the name (to ensure unique valid names)
                runtime_name = runtime_kwargs.pop("name", None)
                runtime_kwargs.update(self.data.kwargs)
                if (
                    runtime_name
                    and isinstance(runtime_name, str)
                    and runtime_name != "waldiez_flow"
                ):
                    runtime_kwargs["name"] = runtime_name
            content = self._generate_predefined_content(
                runtime_kwargs=runtime_kwargs
            )
            return content
        if self.is_shared or self.is_interop:
            return self.data.content
        # if custom, only the function content
        return get_function(self.data.content, self.get_name())

    def _generate_predefined_content(
        self,
        runtime_kwargs: dict[str, Any] | None = None,
    ) -> str:
        """Generate the content for a predefined tool.

        Parameters
        ----------
        runtime_kwargs : dict[str, Any] | None, optional
            Runtime keyword arguments to customize the content generation.

        Returns
        -------
        str
            The content of the predefined tool.
        """
        config = get_predefined_tool_config(self.name)
        if not config:
            return ""
        return config.get_content(
            self.data.secrets,
            runtime_kwargs=runtime_kwargs,
        )

    def _validate_interop_tool(self) -> None:
        """Validate the interoperability tool.

        Raises
        ------
        ValueError
            If the tool name is not in the content.
        """
        if self.is_interop:
            # we expect sth like:
            # with single or double quotes for type={tool_type}
            # {tool_name} = *.convert_tool(..., type="{tool_type}", ...)
            if f"{self.name} = " not in self.data.content:
                raise ValueError(
                    f"The tool name '{self.name}' is not in the content."
                )
            # we don't want the conversion to ag2 tool (we do it internally)
            # or the tool registration (we do it after having the agent names)
            # so no `.convert_tool(... type="...")`
            # or `.register_for_llm(...)`, `.register_for_execution(...)`
            to_exclude = [
                r".convert_tool\(.+?type=",
                rf"{self.name}.register_for_llm\(",
                rf"{self.name}.register_for_execution\(",
            ]
            for exclude in to_exclude:
                if re.search(exclude, self.data.content):
                    raise ValueError(
                        f"Invalid tool content: '{exclude}' is not allowed."
                    )

    def _validate_custom_tool(self) -> None:
        """Validate a custom tool.

        Raises
        ------
        ValueError
            If the tool name is not in the content.
            If the tool content is invalid.
        """
        search = f"def {self.name}("
        if self.tool_type == "custom" and not self.is_shared:
            if search not in self.data.content:
                raise ValueError(
                    f"The tool name '{self.name}' is not in the content."
                )
            error, tree = parse_code_string(self.data.content)
            if error is not None or tree is None:
                raise ValueError(f"Invalid tool content: {error}")

    def _validate_predefined_tool(self) -> None:
        """Validate a predefined tool.

        Raises
        ------
        ValueError
            If the tool name is not in the content.
            If the tool content is invalid.
        """
        if self.is_predefined:
            config = get_predefined_tool_config(self.name)
            if not config:
                available_tools = list_predefined_tools()
                msg = (
                    f"Unknown predefined tool: {self.name}. "
                    f"Available tools: {available_tools}"
                )
                raise ValueError(msg)
            missing_secrets = config.validate_secrets(self.data.secrets)
            if missing_secrets:
                msg = (
                    f"Missing required secrets for {self.name}: "
                    f"{missing_secrets}"
                )
                raise ValueError(msg)
            invalid_kwargs = config.validate_kwargs(self.data.kwargs)
            if invalid_kwargs:
                msg = (
                    f"Invalid keyword arguments for {self.name}: "
                    f"{invalid_kwargs}"
                )
                raise ValueError(msg)
            # Update tool metadata from predefined config
            if not self.description:
                self.description = config.description

            # Merge requirements
            predefined_reqs = set(config.requirements)
            existing_reqs = set(self.requirements)
            self.requirements = list(predefined_reqs | existing_reqs)

            # Merge tags
            predefined_tags = set(config.tags)
            existing_tags = set(self.tags)
            self.tags = list(predefined_tags | existing_tags)
            self.data.content = config.get_content(self.data.secrets)

    @model_validator(mode="after")
    def validate_data(self) -> Self:
        """Validate the data.

        Returns
        -------
        WaldiezTool
            The tool.

        Raises
        ------
        ValueError
            If the tool name is not in the content.
            If the tool content is invalid.
        """
        self._validate_custom_tool()
        self._validate_interop_tool()
        self._validate_predefined_tool()
        if self.is_predefined:
            config = get_predefined_tool_config(self.name)
            if config:
                self._tool_imports = (
                    ["import os"],
                    config.implementation.tool_imports,
                )
        else:
            self._tool_imports = gather_code_imports(
                self.data.content, self.is_interop
            )
        # remove the imports from the content
        # we will place them at the top of the file
        all_imports = self._tool_imports[0] + self._tool_imports[1]
        code_lines = self.data.content.splitlines()
        valid_lines = [
            line
            for line in code_lines
            if not any(line.startswith(imp) for imp in all_imports)
        ]
        # remove empty lines at the beginning and end
        # of the content
        while valid_lines and not valid_lines[0].strip():
            valid_lines.pop(0)
        while valid_lines and not valid_lines[-1].strip():
            valid_lines.pop()
        self.data.content = "\n".join(valid_lines)
        # if self.is_predefined and self.name == "waldiez_flow":
        #     self.name = self.data.kwargs.get("name", self.name)
        #     self.description = self.data.kwargs.get(
        #         "description", self.description
        #     )
        return self
