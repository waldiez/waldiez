# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.flow.utils.linting.*."""

from waldiez.exporting.flow.utils.linting import (
    FLAKE8_RULES,
    PYLINT_RULES,
    PYRIGHT_RULES,
    get_flake8_ignore_comment,
    get_mypy_ignore_comment,
    get_pylint_ignore_comment,
    get_pyright_ignore_comment,
    split_linter_comment,
)


def test_split_linter_comment_single_line() -> None:
    """Test splitting linter comment into a single line."""
    result = split_linter_comment(
        "# pylint: disable=", ["rule1", "rule2"], max_lines=1
    )
    assert result == "# pylint: disable=rule1,rule2\n"


def test_split_linter_comment_multiple_lines() -> None:
    """Test splitting linter comment into multiple lines."""
    rules = ["r1", "r2", "r3", "r4", "r5", "r6"]
    result = split_linter_comment("# test: ", rules, max_lines=3)
    lines = result.strip().splitlines()
    assert len(lines) == 3
    assert all(line.startswith("# test: ") for line in lines)


def test_get_flake8_ignore_comment_default() -> None:
    """Test getting the default flake8 ignore comment."""
    result = get_flake8_ignore_comment()
    assert result.startswith("# flake8: noqa:")
    assert all(rule in result for rule in FLAKE8_RULES)
    assert result.endswith("\n")


def test_get_flake8_ignore_comment_custom() -> None:
    """Test getting a custom flake8 ignore comment."""
    result = get_flake8_ignore_comment(["E123", "F456"])
    assert result == "# flake8: noqa: E123, F456\n"


def test_get_pylint_ignore_comment_default() -> None:
    """Test getting the default pylint ignore comment."""
    result = get_pylint_ignore_comment()
    lines = result.strip().splitlines()
    assert len(lines) <= 3
    assert all(line.startswith("# pylint: disable=") for line in lines)
    for rule in PYLINT_RULES:
        assert rule in result


def test_get_pylint_ignore_comment_custom() -> None:
    """Test getting a custom pylint ignore comment."""
    rules = ["no-member", "line-too-long"]
    result = get_pylint_ignore_comment(rules)
    assert (
        "# pylint: disable=no-member# pylint: disable=line-too-long"
        in result.replace("\n", "")
    )


def test_get_pyright_ignore_comment_default() -> None:
    """Test getting the default pyright ignore comment."""
    result = get_pyright_ignore_comment()
    lines = result.strip().splitlines()
    assert len(lines) <= 3
    assert all(line.startswith("# pyright: ") for line in lines)
    for rule in PYRIGHT_RULES:
        assert f"{rule}=false" in result


def test_get_pyright_ignore_comment_custom() -> None:
    """Test getting a custom pyright ignore comment."""
    rules = ["reportUnknownType", "reportSomethingElse"]
    result = get_pyright_ignore_comment(rules)
    assert (
        "# pyright: reportUnknownType=false"
        "# pyright: reportSomethingElse=false" in result.replace("\n", "")
    )


def test_flake8_default() -> None:
    """Test getting the default flake8 ignore comment."""
    assert get_flake8_ignore_comment([]) == "# flake8: noqa: E501\n"


def test_split_linter_comment_empty_rules() -> None:
    """Test splitting linter comment with empty rules."""
    assert split_linter_comment("# test: ", [], max_lines=3) == "\n"


def test_get_mypy_ignore_comment_default() -> None:
    """Test getting the default mypy ignore comment."""
    result = get_mypy_ignore_comment()
    assert result.startswith("# mypy: disable-error-code")
    assert all(rule in result for rule in ["import-untyped", "no-redef"])
    assert result.endswith("\n")


def test_get_mypy_ignore_comment_custom() -> None:
    """Test getting a custom mypy ignore comment."""
    rules = ["attr-defined", "no-redef"]
    result = get_mypy_ignore_comment(rules)
    assert result == '# mypy: disable-error-code="attr-defined, no-redef"\n'
