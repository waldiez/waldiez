# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Get the standard imports for the flow exporter."""

from typing import Optional

from waldiez.exporting.core import ImportPosition

BUILTIN_IMPORTS = [
    "import asyncio",
    "import csv",
    "import importlib",
    "import json",
    "import os",
    "import sqlite3",
    "import sys",
    "from dataclasses import asdict",
    "from pprint import pprint",
    "from types import ModuleType",
]
TYPING_IMPORT_NAMES = [
    "Annotated",
    "Any",
    "Callable",
    "Coroutine",
    "Dict",
    "List",
    "Optional",
    "Set",
    "Tuple",
    "Union",
]
# pylint: disable=inconsistent-quotes
TYPING_IMPORTS = [f"from typing import {', '.join(TYPING_IMPORT_NAMES)}"]
COMMON_AUTOGEN_IMPORTS = [
    "from autogen import Agent",
    "from autogen import Cache",
    "from autogen import ConversableAgent",
    "from autogen import ChatResult",
    "from autogen import GroupChat",
    "from autogen import runtime_logging",
    "from autogen.events import BaseEvent",
    "from autogen.io.run_response import RunResponseProtocol",
    "from autogen.io.run_response import AsyncRunResponseProtocol",
]


def get_sorted_imports(collected_imports: list[str]) -> list[str]:
    """Get the sorted imports.

    Parameters
    ----------
    collected_imports : list[str]
        The collected imports.

    Returns
    -------
    list[str]
        The sorted imports.
    """
    # Remove duplicates while preserving order by converting to dict
    unique_imports = list(dict.fromkeys(collected_imports))

    sorted_imports = sorted(
        [imp for imp in unique_imports if imp.startswith("import ")]
    ) + sorted([imp for imp in unique_imports if imp.startswith("from ")])
    return sorted_imports


def sort_imports(
    all_imports: list[tuple[str, ImportPosition]],
) -> tuple[list[str], list[str], list[str], list[str], bool]:
    """Sort the imports.

    Parameters
    ----------
    all_imports : list[tuple[str, ImportPosition]]
        All the imports.

    Returns
    -------
    tuple[list[str], list[str], list[str], list[str], bool]
        The sorted imports and a flag if we got `import autogen`.
    """
    builtin_imports: list[str] = BUILTIN_IMPORTS.copy() + TYPING_IMPORTS.copy()
    third_party_imports: list[str] = []
    local_imports: list[str] = []
    autogen_imports: list[str] = COMMON_AUTOGEN_IMPORTS.copy()
    got_import_autogen = False

    for import_string, position in all_imports:
        if "import autogen" in import_string:
            got_import_autogen = True
            continue
        if import_string.startswith("from autogen"):
            autogen_imports.append(import_string)
            continue
        if position == ImportPosition.BUILTINS:
            builtin_imports.append(import_string)
        elif position == ImportPosition.THIRD_PARTY:
            third_party_imports.append(import_string)
        elif position == ImportPosition.LOCAL:  # pragma: no branch
            local_imports.append(import_string)
    if "from dotenv import load_dotenv" not in third_party_imports:
        third_party_imports.append("from dotenv import load_dotenv")
    autogen_imports = clean_and_group_autogen_imports(autogen_imports)
    third_party_imports = ensure_np_import(third_party_imports)
    sorted_builtins = get_sorted_imports(builtin_imports)
    sorted_third_party = get_sorted_imports(third_party_imports)
    sorted_locals = get_sorted_imports(local_imports)

    return (
        sorted_builtins,
        sorted(autogen_imports),
        sorted_third_party,
        sorted_locals,
        got_import_autogen,
    )


def clean_and_group_autogen_imports(autogen_imports: list[str]) -> list[str]:
    """Cleanup and group autogen imports.

    Parameters
    ----------
    autogen_imports : list[str]
        List of autogen import statements

    Returns
    -------
    list[str]
        Cleaned and grouped autogen imports
    """
    # Group imports by module path
    import_groups: dict[str, set[str]] = {}
    direct_imports: set[str] = set()

    for imp in autogen_imports:
        imp = imp.strip()
        if not imp:
            continue

        if imp.startswith("import autogen"):
            direct_imports.add(imp)
            continue

        # Parse "from autogen.module import items"
        if imp.startswith("from autogen"):  # pragma: no branch
            parts = imp.split(" import ")
            if len(parts) == 2:  # pragma: no branch
                module_path = parts[0]  # "from autogen.module"
                items = parts[1].strip()

                if module_path not in import_groups:
                    import_groups[module_path] = set()

                # Handle multiple imports in one line
                for item in items.split(","):
                    import_groups[module_path].add(item.strip())

    # Build cleaned import list
    cleaned_imports: list[str] = []

    # Add direct imports first
    cleaned_imports.extend(sorted(direct_imports))

    # Add grouped imports, sorted by module path
    for module_path in sorted(import_groups.keys()):
        sorted_items = sorted(import_groups[module_path])
        items_str = ", ".join(sorted_items)
        import_statement = f"{module_path} import {items_str}"
        cleaned_imports.append(import_statement)

    return cleaned_imports


def get_the_imports_string(
    all_imports: list[tuple[str, ImportPosition]],
    is_async: bool,
) -> str:
    """Get the final imports string.

    Parameters
    ----------
    all_imports : list[tuple[str, ImportPosition]]
        All the imports.
    is_async : bool
        If the flow is async.

    Returns
    -------
    str
        The final imports string.
    """
    (
        builtin_imports,
        autogen_imports,
        third_party_imports,
        local_imports,
        got_import_autogen,
    ) = sort_imports(all_imports)

    # Get the final imports string.
    # Making sure that there are two lines
    # after each import section
    # (builtin, third party, local)
    final_string = "\n".join(builtin_imports) + "\n"
    while not final_string.endswith("\n\n"):
        final_string += "\n"

    if is_async:
        final_string += (
            "\nimport aiofiles"
            "\nimport aiosqlite"
            "\nimport anyio"
            "\nimport nest_asyncio"
            "\nfrom aiocsv import AsyncDictWriter\n"
        )

    if got_import_autogen:
        final_string += "\nimport autogen  # type: ignore\n"

    if autogen_imports:  # pragma: no branch
        final_string += "\n".join(autogen_imports) + "\n"

    if third_party_imports:  # pragma: no branch
        final_string += "\n".join(third_party_imports) + "\n"

    while not final_string.endswith("\n\n"):
        final_string += "\n"

    if local_imports:
        final_string += "\n".join(local_imports) + "\n"

    while not final_string.endswith("\n\n"):
        final_string += "\n"

    if is_async:
        final_string += (
            "# pylint: disable=broad-exception-caught\n"
            "try:\n"
            "    nest_asyncio.apply()  # pyright: ignore\n"
            "except BaseException:\n"
            "    pass  # maybe on uvloop?\n"
        )

    return final_string.replace("\n\n\n", "\n\n")  # avoid too many newlines


def ensure_np_import(third_party_imports: list[str]) -> list[str]:
    """Ensure numpy is imported.

    Parameters
    ----------
    third_party_imports : list[str]
        The third party imports.

    Returns
    -------
    list[str]
        The third party imports with numpy.
    """
    if (
        not third_party_imports
        or "import numpy as np" not in third_party_imports
    ):
        third_party_imports.append("import numpy as np")
    return third_party_imports


def gather_imports(
    model_imports: Optional[list[tuple[str, ImportPosition]]] = None,
    tool_imports: Optional[list[tuple[str, ImportPosition]]] = None,
    chat_imports: Optional[list[tuple[str, ImportPosition]]] = None,
    agent_imports: Optional[list[tuple[str, ImportPosition]]] = None,
) -> list[tuple[str, ImportPosition]]:
    """Gather all the imports.

    Parameters
    ----------
    model_imports : tuple[str, ImportPosition]
        The model imports.
    tool_imports : tuple[str, ImportPosition]
        The tool imports.
    chat_imports : tuple[str, ImportPosition]
        The chat imports.
    agent_imports : tuple[str, ImportPosition]
        The agent imports.

    Returns
    -------
    tuple[str, ImportPosition]
        The gathered imports.
    """
    all_imports: list[tuple[str, ImportPosition]] = []
    for import_statement in BUILTIN_IMPORTS:
        all_imports.append(
            (
                import_statement,
                ImportPosition.BUILTINS,
            )
        )
    if model_imports:
        all_imports.extend(model_imports)
    if tool_imports:
        all_imports.extend(tool_imports)
    if chat_imports:
        all_imports.extend(chat_imports)
    if agent_imports:
        all_imports.extend(agent_imports)
    all_imports = deduplicate_imports(all_imports)
    one_line_typing_imports: list[tuple[str, ImportPosition]] = []
    final_imports: list[tuple[str, ImportPosition]] = []
    for import_tuple in all_imports:
        if import_tuple[0].startswith("from typing import "):
            one_line_typing_imports.append(import_tuple)
        else:
            final_imports.append(import_tuple)
    final_typing_imports = get_the_typing_imports(one_line_typing_imports)
    final_imports.insert(1, (final_typing_imports, ImportPosition.BUILTINS))
    return final_imports


def get_the_typing_imports(
    one_line_typing_imports: list[tuple[str, ImportPosition]],
) -> str:
    """Get the typing imports as a single line.

    Parameters
    ----------
    one_line_typing_imports : list[tuple[str, ImportPosition]]
        The one line typing imports.

    Returns
    -------
    str
        The final typing imports string.
    """
    # merge the ones found in the imports
    # with the default ones
    typing_imports: set[str] = set(TYPING_IMPORT_NAMES)
    for import_tuple in one_line_typing_imports:
        if import_tuple[0].startswith(
            "from typing import "
        ):  # pragma: no branch
            # extract the names from the import statement
            names = import_tuple[0].split("from typing import ")[1]
            for name in names.split(","):
                typing_imports.add(name.strip())
    # create the final import statement
    final_typing_imports = (
        f"from typing import {', '.join(sorted(typing_imports))}"
    )
    return final_typing_imports.strip()


def deduplicate_imports(
    imports: list[tuple[str, ImportPosition]],
) -> list[tuple[str, ImportPosition]]:
    """Deduplicate imports while preserving order.

    Parameters
    ----------
    imports : list[tuple[str, ImportPosition]]
        The imports to deduplicate.

    Returns
    -------
    list[tuple[str, ImportPosition]]
        The deduplicated imports.
    """
    # Remove duplicates while preserving order
    seen: set[tuple[str, ImportPosition]] = set()
    deduplicated_imports: list[tuple[str, ImportPosition]] = []
    for import_tuple in imports:
        if import_tuple not in seen:
            seen.add(import_tuple)
            deduplicated_imports.append(import_tuple)
    return deduplicated_imports
