# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.flow.utils.flow_content."""

from waldiez.exporting.flow.utils.comments import (
    PYLINT_RULES,
    PYRIGHT_RULES,
    get_pylint_ignore_comment,
    get_pyright_ignore_comment,
)


def test_get_pylint_ignore_comment() -> None:
    """Test get_pylint_ignore_comment."""
    no_rules_string = ",".join(PYLINT_RULES)
    assert (
        get_pylint_ignore_comment(False)
        == f"# pylint: disable={no_rules_string}" + "\n"
    )
    assert (
        get_pylint_ignore_comment(True)
        == "\n" + f"# pylint: disable={no_rules_string}" + "\n"
    )
    assert get_pylint_ignore_comment(
        True, ["invalid-name", "line-too-long"]
    ) == ("\n# pylint: disable=invalid-name,line-too-long\n")
    assert get_pylint_ignore_comment(False, ["invalid-name"]) == (
        "# pylint: disable=invalid-name\n"
    )
    assert get_pylint_ignore_comment(True, ["line-too-long"]) == (
        "\n# pylint: disable=line-too-long\n"
    )
    assert get_pylint_ignore_comment(
        False, ["invalid-name", "line-too-long"]
    ) == ("# pylint: disable=invalid-name,line-too-long\n")
    assert get_pylint_ignore_comment(True, ["invalid-name"]) == (
        "\n# pylint: disable=invalid-name\n"
    )
    assert get_pylint_ignore_comment(False, ["line-too-long"]) == (
        "# pylint: disable=line-too-long\n"
    )


def test_get_pyright_ignore_comment() -> None:
    """Test get_pyright_ignore_comment."""
    no_rules_string = ",".join([f"{rule}=false" for rule in PYRIGHT_RULES])
    assert (
        get_pyright_ignore_comment() == f"# pyright: {no_rules_string}" + "\n"
    )
    assert get_pyright_ignore_comment(
        ["reportUnusedImport", "reportUnknownArgumentType"]
    ) == (
        "# pyright: reportUnusedImport=false,reportUnknownArgumentType=false\n"
    )
    assert get_pyright_ignore_comment(["reportUnusedImport"]) == (
        "# pyright: reportUnusedImport=false\n"
    )
