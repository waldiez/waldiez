# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=no-self-use
"""Test waldiez.exporting.flow.utils.importing.*."""

from waldiez.exporting.core import ImportPosition
from waldiez.exporting.flow.utils.importing import (
    COMMON_AUTOGEN_IMPORTS,
    clean_and_group_autogen_imports,
    ensure_np_import,
    gather_imports,
    get_sorted_imports,
    get_the_imports_string,
    sort_imports,
)


class TestGetSortedImports:
    """Test get_sorted_imports function."""

    def test_empty_list(self) -> None:
        """Test with empty list."""
        result = get_sorted_imports([])
        assert result == []

    def test_import_statements_only(self) -> None:
        """Test with import statements only."""
        imports = ["import os", "import sys", "import json"]
        result = get_sorted_imports(imports)
        expected = ["import json", "import os", "import sys"]
        assert result == expected

    def test_from_statements_only(self) -> None:
        """Test with from statements only."""
        imports = [
            "from os import path",
            "from sys import argv",
            "from json import dumps",
        ]
        result = get_sorted_imports(imports)
        expected = [
            "from json import dumps",
            "from os import path",
            "from sys import argv",
        ]
        assert result == expected

    def test_mixed_statements(self) -> None:
        """Test with mixed import and from statements."""
        imports = [
            "from os import path",
            "import sys",
            "from json import dumps",
            "import json",
        ]
        result = get_sorted_imports(imports)
        expected = [
            "import json",
            "import sys",
            "from json import dumps",
            "from os import path",
        ]
        assert result == expected


class TestSortImports:
    """Test sort_imports function."""

    def test_empty_imports(self) -> None:
        """Test with empty imports list."""
        result = sort_imports([])
        (
            builtin_imports,
            autogen_imports,
            third_party_imports,
            local_imports,
            got_import_autogen,
        ) = result

        assert len(builtin_imports) > 0  # Should contain default builtins
        # The common autogen imports should be cleaned and grouped
        expected_autogen = clean_and_group_autogen_imports(
            COMMON_AUTOGEN_IMPORTS
        )
        assert autogen_imports == sorted(expected_autogen)
        assert "import numpy as np" in third_party_imports
        assert local_imports == []
        assert got_import_autogen is False

    def test_import_autogen_detection(self) -> None:
        """Test detection of 'import autogen' statement."""
        imports = [("import autogen", ImportPosition.THIRD_PARTY)]
        result = sort_imports(imports)
        _, _, _, _, got_import_autogen = result
        assert got_import_autogen is True

    def test_autogen_from_imports(self) -> None:
        """Test autogen from imports are grouped correctly."""
        imports = [
            ("from autogen import Assistant", ImportPosition.THIRD_PARTY),
            (
                "from autogen.agents import UserProxy",
                ImportPosition.THIRD_PARTY,
            ),
        ]
        result = sort_imports(imports)
        _, autogen_imports, _, _, _ = result

        # Should contain the new autogen imports plus the common ones
        # all cleaned and grouped
        # The function cleans and groups all autogen imports, i
        # ncluding the common ones
        assert any("Assistant" in imp for imp in autogen_imports)
        assert any("UserProxy" in imp for imp in autogen_imports)
        # Should also contain the grouped common autogen imports
        assert any("Agent" in imp for imp in autogen_imports)

    def test_third_party_imports(self) -> None:
        """Test third party imports handling."""
        imports = [
            ("import requests", ImportPosition.THIRD_PARTY),
            ("from flask import Flask", ImportPosition.THIRD_PARTY),
        ]
        result = sort_imports(imports)
        _, _, third_party_imports, _, _ = result

        assert "import requests" in third_party_imports
        assert "from flask import Flask" in third_party_imports
        assert "import numpy as np" in third_party_imports  # Always added

    def test_local_imports(self) -> None:
        """Test local imports handling."""
        imports = [
            ("from .utils import helper", ImportPosition.LOCAL),
            ("import mymodule", ImportPosition.LOCAL),
        ]
        result = sort_imports(imports)
        _, _, _, local_imports, _ = result

        assert "import mymodule" in local_imports
        assert "from .utils import helper" in local_imports


class TestCleanAndGroupAutogenImports:
    """Test clean_and_group_autogen_imports function."""

    def test_empty_list(self) -> None:
        """Test with empty list."""
        result = clean_and_group_autogen_imports([])
        assert not result

    def test_direct_imports(self) -> None:
        """Test direct autogen imports."""
        imports = ["import autogen", "import autogen.agents"]
        result = clean_and_group_autogen_imports(imports)
        expected = ["import autogen", "import autogen.agents"]
        assert result == expected

    def test_from_imports_grouping(self) -> None:
        """Test grouping of from imports."""
        imports = [
            "from autogen import Agent",
            "from autogen import Assistant",
            "from autogen.agents import UserProxy",
            "from autogen.agents import GroupChatManager",
        ]
        result = clean_and_group_autogen_imports(imports)

        # Should group by module path and sort items within each group
        assert "from autogen import Agent, Assistant" in result
        assert (
            "from autogen.agents import GroupChatManager, UserProxy" in result
        )
        assert len(result) == 2  # Two grouped import statements

    def test_mixed_imports(self) -> None:
        """Test mixed direct and from imports."""
        imports = [
            "import autogen",
            "from autogen import Agent",
            "from autogen.agents import UserProxy",
        ]
        result = clean_and_group_autogen_imports(imports)

        # Direct imports come first, then grouped from imports
        assert "import autogen" in result
        assert "from autogen import Agent" in result
        assert "from autogen.agents import UserProxy" in result
        assert len(result) == 3

    def test_duplicate_items_handling(self) -> None:
        """Test handling of duplicate items in same module."""
        imports = [
            "from autogen import Agent",
            "from autogen import Agent",  # Duplicate
            "from autogen import Assistant",
        ]
        result = clean_and_group_autogen_imports(imports)

        # Should deduplicate and group
        assert len(result) == 1  # One grouped import statement
        grouped_import = result[0]
        assert "from autogen import Agent, Assistant" == grouped_import
        # Agent should appear only once
        assert grouped_import.count("Agent") == 1


class TestEnsureNpImport:
    """Test ensure_np_import function."""

    def test_empty_list(self) -> None:
        """Test with empty list."""
        result = ensure_np_import([])
        assert "import numpy as np" in result

    def test_already_has_numpy(self) -> None:
        """Test when numpy is already imported."""
        imports = ["import pandas", "import numpy as np", "import matplotlib"]
        result = ensure_np_import(imports)

        # Should not add duplicate
        numpy_count = sum(1 for imp in result if "import numpy as np" in imp)
        assert numpy_count == 1

    def test_adds_numpy_when_missing(self) -> None:
        """Test adds numpy when missing."""
        imports = ["import pandas", "import matplotlib"]
        result = ensure_np_import(imports)

        assert "import numpy as np" in result
        assert len(result) == 3


class TestGetTheImportsString:
    """Test get_the_imports_string function."""

    def test_basic_imports_string(self) -> None:
        """Test basic imports string generation."""
        imports = [
            ("import os", ImportPosition.BUILTINS),
            ("import requests", ImportPosition.THIRD_PARTY),
        ]
        result = get_the_imports_string(imports, is_async=False)

        assert "import os" in result
        assert "import requests" in result
        assert "import numpy as np" in result  # Always added
        assert result.count("\n\n") >= 2  # Proper spacing

    def test_async_imports(self) -> None:
        """Test async imports addition."""
        imports = [("import os", ImportPosition.BUILTINS)]
        result = get_the_imports_string(imports, is_async=True)

        assert "import aiofiles" in result
        assert "import aiosqlite" in result
        assert "import anyio" in result
        assert "import nest_asyncio" in result
        assert "from aiocsv import AsyncDictWriter" in result
        assert "nest_asyncio.apply()" in result

    def test_import_autogen_flag(self) -> None:
        """Test import autogen flag handling."""
        imports = [("import autogen", ImportPosition.THIRD_PARTY)]
        result = get_the_imports_string(imports, is_async=False)

        assert "import autogen  # type: ignore" in result

    def test_proper_spacing(self) -> None:
        """Test proper spacing between sections."""
        imports = [
            ("import os", ImportPosition.BUILTINS),
            ("import requests", ImportPosition.THIRD_PARTY),
            ("from .utils import helper", ImportPosition.LOCAL),
        ]
        result = get_the_imports_string(imports, is_async=False)

        # Should not have triple newlines
        assert "\n\n\n" not in result
        # Should have double newlines for section separation
        assert "\n\n" in result


class TestGatherImports:
    """Test gather_imports function."""

    def test_no_additional_imports(self) -> None:
        """Test with no additional imports."""
        result = gather_imports(
            model_imports=None,
            tool_imports=None,
            chat_imports=None,
            agent_imports=None,
        )

        # Should contain builtin imports
        builtin_count = sum(
            1 for _imp, pos in result if pos == ImportPosition.BUILTINS
        )
        assert builtin_count > 0

    def test_with_model_imports(self) -> None:
        """Test with model imports."""
        model_imports = [
            ("from transformers import AutoModel", ImportPosition.THIRD_PARTY)
        ]
        result = gather_imports(
            model_imports=model_imports,
            tool_imports=None,
            chat_imports=None,
            agent_imports=None,
        )

        assert (
            "from transformers import AutoModel",
            ImportPosition.THIRD_PARTY,
        ) in result

    def test_typing_imports_consolidation(self) -> None:
        """Test typing imports are consolidated."""
        agent_imports = [("from typing import Dict", ImportPosition.BUILTINS)]
        result = gather_imports(
            agent_imports=agent_imports,
            model_imports=None,
            tool_imports=None,
            chat_imports=None,
        )

        # Should consolidate typing imports
        typing_imports = [
            imp for imp, _pos in result if imp.startswith("from typing")
        ]
        assert len(typing_imports) == 1  # Should be consolidated into one

        consolidated_import = typing_imports[0]
        assert "Dict" in consolidated_import
        assert "List" in consolidated_import  # From default typing imports

    def test_all_import_types(self) -> None:
        """Test with all types of imports."""
        model_imports = [("import torch", ImportPosition.THIRD_PARTY)]
        tool_imports = [("import click", ImportPosition.THIRD_PARTY)]
        chat_imports = [("from .chat import ChatManager", ImportPosition.LOCAL)]
        agent_imports = [
            ("from .agents import CustomAgent", ImportPosition.LOCAL)
        ]

        result = gather_imports(
            model_imports=model_imports,
            tool_imports=tool_imports,
            chat_imports=chat_imports,
            agent_imports=agent_imports,
        )

        # Check all imports are present
        import_strings = [imp for imp, _ in result]
        assert "import torch" in import_strings
        assert "import click" in import_strings
        assert "from .chat import ChatManager" in import_strings
        assert "from .agents import CustomAgent" in import_strings

    def test_duplicate_removal(self) -> None:
        """Test duplicate imports are removed."""
        model_imports = [("import torch", ImportPosition.THIRD_PARTY)]
        tool_imports = [
            ("import torch", ImportPosition.THIRD_PARTY)
        ]  # Duplicate

        result = gather_imports(
            model_imports=model_imports,
            tool_imports=tool_imports,
            chat_imports=None,
            agent_imports=None,
        )

        # Should not have duplicates
        torch_imports = [imp for imp, _pos in result if imp == "import torch"]
        assert len(torch_imports) == 1


class TestIntegration:
    """Integration tests combining multiple functions."""

    def test_full_pipeline_sync(self) -> None:
        """Test full pipeline for synchronous flow."""
        model_imports = [("import torch", ImportPosition.THIRD_PARTY)]
        agent_imports = [
            ("from typing import Optional", ImportPosition.BUILTINS)
        ]

        gathered = gather_imports(
            model_imports=model_imports,
            agent_imports=agent_imports,
            chat_imports=None,
            tool_imports=None,
        )

        result = get_the_imports_string(gathered, is_async=False)

        # Should contain all expected sections
        assert "import torch" in result
        assert "import numpy as np" in result
        assert "from typing import" in result
        assert "Optional" in result
        # Should not contain async imports
        assert "aiofiles" not in result

    def test_full_pipeline_async(self) -> None:
        """Test full pipeline for asynchronous flow."""
        chat_imports = [
            ("from autogen import Assistant", ImportPosition.THIRD_PARTY)
        ]

        gathered = gather_imports(
            chat_imports=chat_imports,
            model_imports=None,
            tool_imports=None,
            agent_imports=None,
        )
        result = get_the_imports_string(gathered, is_async=True)

        # Should contain async imports
        assert "import aiofiles" in result
        assert "nest_asyncio.apply()" in result
        assert "from autogen import Agent" in result

    def test_complex_autogen_scenario(self) -> None:
        """Test complex scenario with various autogen imports."""
        imports = [
            ("import autogen", ImportPosition.THIRD_PARTY),
            ("from autogen import Agent", ImportPosition.THIRD_PARTY),
            ("from autogen import Assistant", ImportPosition.THIRD_PARTY),
            (
                "from autogen.agents import UserProxy",
                ImportPosition.THIRD_PARTY,
            ),
            (
                "from autogen.agents import GroupChatManager",
                ImportPosition.THIRD_PARTY,
            ),
        ]

        result = get_the_imports_string(imports, is_async=False)

        # Should properly handle autogen imports
        assert "import autogen  # type: ignore" in result
        # The function groups autogen imports, so we expect grouped statements
        assert "from autogen import" in result
        # Should contain both Agent and Assistant in the same grouped import
        assert any(
            "Agent" in line and "Assistant" in line
            for line in result.split("\n")
        )
        assert "from autogen.agents import" in result
