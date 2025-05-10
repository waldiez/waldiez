# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Tool model."""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple, Union

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..common import (
    WaldiezBase,
    gather_code_imports,
    get_function,
    now,
    parse_code_string,
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
    tags : List[str]
        The tags of the tool.
    requirements : List[str]
        The requirements of the tool.
    created_at : str
        The date and time when the tool was created.
    updated_at : str
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
        List[str],
        Field(
            title="Tags",
            description="The tags of the tool.",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        List[str],
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

    @staticmethod
    def load(data_or_path: Union[str, Path, Dict[str, Any]]) -> "WaldiezTool":
        """Load a tool from a read-only file.

        Parameters
        ----------
        data_or_path : Union[str, Path, Dict[str, Any]]
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
            try:
                data_dict = json.loads(data_string)
            except BaseException as exc:  # pylint: disable=broad-except
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

    _tool_imports: Tuple[List[str], List[str]] = ([], [])

    def get_imports(self) -> Tuple[List[str], List[str]]:
        """Get the tool imports.

        Returns
        -------
        Tuple[List[str], List[str]]
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
    def is_interop(self) -> bool:
        """Check if the tool is interoperability.

        Returns
        -------
        bool
            True if the tool is interoperability, False otherwise.
        """
        return self.tool_type in ("langchain", "crewai")

    def get_content(self) -> str:
        """Get the content of the tool.

        Returns
        -------
        str
            The content of the tool.
        """
        if self.is_shared or self.is_interop:
            return self.data.content
        # if custom, only the function content
        return get_function(self.data.content, self.name)

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
        return self

    @property
    def content(self) -> str:
        """Get the content (source) of the tool."""
        return self.data.content

    @property
    def secrets(self) -> Dict[str, str]:
        """Get the secrets (environment variables) of the tool."""
        return self.data.secrets or {}
