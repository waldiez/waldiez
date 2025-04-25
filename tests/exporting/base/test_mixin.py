# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test ExporterMixin."""

from waldiez.exporting.base import ExporterMixin


def test_get_valid_instance_name() -> None:
    """Test get_valid_instance_name."""
    instance = ("1", "name")
    current_names = {"1": "name"}
    prefix = "w"
    assert ExporterMixin.get_valid_instance_name(
        instance=instance, current_names=current_names, prefix=prefix
    ) == {"1": "name"}


def test_get_item_string() -> None:
    """Test get_item_string."""
    item = {"key": "value"}
    assert ExporterMixin.serializer(item, tabs=0) == '{\n    "key": "value"\n}'


def test_comment() -> None:
    """Test comment."""
    assert ExporterMixin.comment(False) == "# "


def test_get_comment() -> None:
    """Test get_comment."""
    assert ExporterMixin.get_comment("logging", False) == "\n# Start Logging\n"


def test_string_escape() -> None:
    """Test get_escaped_string."""
    # pylint: disable=line-too-long
    assert (
        ExporterMixin.string_escape('string "with" quotes')
        == 'string \\"with\\" quotes'
    )  # noqa: E501
    assert (
        ExporterMixin.string_escape("string\nwith\nnewlines")
        == "string\\nwith\\nnewlines"
    )  # noqa: E501
    assert ExporterMixin.string_escape(
        "string\nwith\nquotes\nand\nnewlines"
    ) == ("string\\nwith\\nquotes\\nand\\nnewlines")
