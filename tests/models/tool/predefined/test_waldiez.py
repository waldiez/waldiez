# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=too-many-try-statements,no-self-use,protected-access

"""Test waldiez.models.tool.predefined._waldiez."""

import json
import os
import tempfile
from pathlib import Path

import pytest

# noinspection PyProtectedMember
from waldiez.models.tool.predefined._waldiez import (
    WaldiezFlowConfig,
    WaldiezFlowToolImpl,
    _strip_wrapping_quotes,
    extract_raw_string_content,
    resolve_path,
)


class TestWaldiezFlowToolImpl:
    """Test WaldiezFlowToolImpl class."""

    def test_basic_properties(self) -> None:
        """Test WaldiezFlowToolImpl basic properties."""
        tool = WaldiezFlowToolImpl()
        assert tool.name == "waldiez_flow"
        assert tool.description == "Run a complete waldiez flow as tool."
        assert tool.requirements == ["waldiez"]
        assert tool.tags == ["waldiez"]
        assert tool.tool_imports == ["from waldiez import WaldiezRunner"]
        assert not tool.required_secrets
        assert tool.required_kwargs == {
            "flow": str,
            "name": str,
            "description": str,
            "skip_deps": bool,
        }
        assert tool._kwargs["skip_logging"] is True

    def test_default_kwargs(self) -> None:
        """Test default kwargs values."""
        tool = WaldiezFlowToolImpl()
        assert tool.kwargs["skip_logging"] is True
        assert tool.kwargs["skip_deps"] is False
        assert tool.kwargs["return_option"] == "all"
        assert tool.kwargs["dot_env"] is None

    def test_validate_secrets_always_empty(self) -> None:
        """Test that validate_secrets always returns empty list."""
        tool = WaldiezFlowToolImpl()
        assert not tool.validate_secrets({})
        assert not tool.validate_secrets({"SOME_KEY": "value"})

    def test_validate_kwargs_missing_required(self) -> None:
        """Test validate_kwargs with missing required kwargs."""
        tool = WaldiezFlowToolImpl()
        missing = tool.validate_kwargs({})
        assert "flow" in missing
        assert "name" in missing
        assert "description" in missing
        assert "skip_deps" in missing

    def test_validate_kwargs_with_valid_flow_path(self) -> None:
        """Test validate_kwargs with a valid local flow path."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            missing = tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test_flow",
                    "description": "A test flow",
                    "skip_deps": True,
                    "skip_logging": True,
                }
            )
            assert not missing
            assert tool.kwargs["flow"] == str(Path(temp_path).resolve())
            assert tool.kwargs["name"] == "test_flow"
            assert tool.kwargs["description"] == "A test flow"
            assert tool.kwargs["skip_deps"] is True
        finally:
            os.unlink(temp_path)

    def test_validate_kwargs_with_http_url(self) -> None:
        """Test validate_kwargs with an HTTP URL."""
        tool = WaldiezFlowToolImpl()
        missing = tool.validate_kwargs(
            {
                "flow": "https://example.com/flow.waldiez",
                "name": "remote_flow",
                "description": "A remote flow",
                "skip_deps": False,
                "skip_logging": False,
            }
        )
        assert not missing
        assert tool.kwargs["flow"] == "https://example.com/flow.waldiez"

    def test_validate_kwargs_return_option(self) -> None:
        """Test validate_kwargs handles return_option correctly."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            # Valid return options
            for option in ["all", "messages", "summary", "last"]:
                tool.validate_kwargs(
                    {
                        "flow": temp_path,
                        "name": "test",
                        "description": "test",
                        "skip_deps": False,
                        "return_option": option,
                    }
                )
                assert tool.kwargs["return_option"] == option

            # Invalid return option defaults to "all"
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "return_option": "invalid",
                }
            )
            assert tool.kwargs["return_option"] == "all"
        finally:
            os.unlink(temp_path)

    def test_validate_kwargs_dot_env(self) -> None:
        """Test validate_kwargs handles dot_env correctly."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "dot_env": "/path/to/.env",
                }
            )
            assert tool.kwargs["dot_env"] == "/path/to/.env"
        finally:
            os.unlink(temp_path)

    def test_return_type_property(self) -> None:
        """Test return_type property."""
        tool = WaldiezFlowToolImpl()
        assert tool.return_type == "all"

        tool._kwargs["return_option"] = "messages"
        assert tool.return_type == "messages"

        tool._kwargs["return_option"] = "invalid"
        assert tool.return_type == "all"

    def test_get_content_sync(self) -> None:
        """Test get_content generates sync function."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "my_test_flow",
                    "description": "Test flow description",
                    "skip_deps": False,
                }
            )
            content = tool.get_content({}, runtime_kwargs={"is_async": "False"})
            assert "def my_test_flow(" in content
            assert "async def" not in content
            assert "runner.run(" in content
            assert "Test flow description" in content
        finally:
            os.unlink(temp_path)

    def test_get_content_async(self) -> None:
        """Test get_content generates async function."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "my_async_flow",
                    "description": "Async flow",
                    "skip_deps": True,
                }
            )
            content = tool.get_content({}, runtime_kwargs={"is_async": "True"})
            assert "async def my_async_flow(" in content
            assert "await runner.a_run(" in content
            assert "skip_deps = True" in content
        finally:
            os.unlink(temp_path)

    def test_get_content_return_options(self) -> None:
        """Test get_content generates correct return for each option."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            # Test "messages" return option
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "return_option": "messages",
                }
            )
            content = tool.get_content({})
            assert 'result.get("messages"' in content

            # Test "last" return option
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "return_option": "last",
                }
            )
            content = tool.get_content({})
            assert "last_message = messages[-1]" in content

            # Test "summary" return option
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "return_option": "summary",
                }
            )
            content = tool.get_content({})
            assert 'result.get("summary"' in content

            # Test "all" return option (default)
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "return_option": "all",
                }
            )
            content = tool.get_content({})
            assert "json.dumps(result, default=str)" in content
        finally:
            os.unlink(temp_path)

    def test_get_content_with_dot_env(self) -> None:
        """Test get_content includes dot_env when provided and exists."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        with tempfile.NamedTemporaryFile(suffix=".env", delete=False) as env_f:
            env_path = env_f.name
        try:
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "dot_env": env_path,
                }
            )
            content = tool.get_content({})
            assert f"dot_env={json.dumps(env_path)}" in content
        finally:
            os.unlink(temp_path)
            os.unlink(env_path)

    def test_get_content_dot_env_nonexistent(self) -> None:
        """Test get_content uses None for non-existent dot_env."""
        tool = WaldiezFlowToolImpl()
        with tempfile.NamedTemporaryFile(suffix=".waldiez", delete=False) as f:
            temp_path = f.name
        try:
            tool.validate_kwargs(
                {
                    "flow": temp_path,
                    "name": "test",
                    "description": "test",
                    "skip_deps": False,
                    "dot_env": "/nonexistent/.env",
                }
            )
            content = tool.get_content({})
            assert "dot_env=None" in content
        finally:
            os.unlink(temp_path)


class TestExtractRawStringContent:
    """Test extract_raw_string_content function."""

    def test_no_raw_wrapper(self) -> None:
        """Test string without raw wrapper is returned as-is."""
        assert extract_raw_string_content("hello") == "hello"
        assert extract_raw_string_content("/path/to/file") == "/path/to/file"

    def test_raw_double_quote(self) -> None:
        """Test 'r'" wrapper removal."""
        assert extract_raw_string_content('r"/path/to/file"') == "/path/to/file"
        assert extract_raw_string_content('R"/path/to/file"') == "/path/to/file"

    def test_raw_single_quote(self) -> None:
        """Test r'...' wrapper removal."""
        assert extract_raw_string_content("r'/path/to/file'") == "/path/to/file"
        assert extract_raw_string_content("R'/path/to/file'") == "/path/to/file"

    def test_raw_with_backslashes(self) -> None:
        """Test raw string with backslashes."""
        assert (
            extract_raw_string_content(r'r"C:\Users\test"') == r"C:\Users\test"
        )

    def test_malformed_raw_string(self) -> None:
        """Test malformed raw string (no closing quote)."""
        assert extract_raw_string_content('r"/path/to/file') == "/path/to/file"

    def test_whitespace_stripped(self) -> None:
        """Test whitespace is stripped."""
        assert extract_raw_string_content('  r"/path"  ') == "/path"


class TestStripWrappingQuotes:
    """Test _strip_wrapping_quotes function."""

    def test_no_quotes(self) -> None:
        """Test string without quotes is returned as-is."""
        assert _strip_wrapping_quotes("hello") == "hello"

    def test_double_quotes(self) -> None:
        """Test double quote removal."""
        assert _strip_wrapping_quotes('"hello"') == "hello"

    def test_single_quotes(self) -> None:
        """Test single quote removal."""
        assert _strip_wrapping_quotes("'hello'") == "hello"

    def test_mismatched_quotes(self) -> None:
        """Test mismatched quotes are not removed."""
        assert _strip_wrapping_quotes("\"hello'") == "\"hello'"

    def test_whitespace_stripped(self) -> None:
        """Test whitespace is stripped."""
        assert _strip_wrapping_quotes('  "hello"  ') == "hello"


class TestResolvePath:
    """Test resolve_path function."""

    def test_http_url_passthrough(self) -> None:
        """Test HTTP URLs are passed through unchanged."""
        url = "http://example.com/flow.waldiez"
        assert resolve_path(url) == url

    def test_https_url_passthrough(self) -> None:
        """Test HTTPS URLs are passed through unchanged."""
        url = "https://example.com/flow.waldiez"
        assert resolve_path(url) == url

    def test_valid_local_path(self) -> None:
        """Test valid local path is resolved."""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            temp_path = f.name
        try:
            resolved = resolve_path(temp_path)
            assert resolved == str(Path(temp_path).resolve())
        finally:
            os.unlink(temp_path)

    def test_nonexistent_path_raises(self) -> None:
        """Test nonexistent path raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Path does not exist"):
            resolve_path("/nonexistent/path/to/file.waldiez")

    def test_path_with_raw_wrapper(self) -> None:
        """Test path with raw string wrapper."""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            temp_path = f.name
        try:
            resolved = resolve_path(f'r"{temp_path}"')
            assert resolved == str(Path(temp_path).resolve())
        finally:
            os.unlink(temp_path)

    def test_path_with_quotes(self) -> None:
        """Test path with wrapping quotes."""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            temp_path = f.name
        try:
            resolved = resolve_path(f'"{temp_path}"')
            assert resolved == str(Path(temp_path).resolve())
        finally:
            os.unlink(temp_path)

    def test_path_with_tilde_expansion(self) -> None:
        """Test path with tilde is expanded."""
        # Create a temp file in home directory
        home = Path.home()
        with tempfile.NamedTemporaryFile(dir=home, delete=False) as f:
            temp_path = f.name
            relative_path = "~/" + os.path.basename(temp_path)
        try:
            resolved = resolve_path(relative_path)
            assert resolved == str(Path(temp_path).resolve())
        finally:
            os.unlink(temp_path)


# pylint: disable=too-few-public-methods
class TestWaldiezFlowConfig:
    """Test WaldiezFlowConfig instance."""

    def test_config_attributes(self) -> None:
        """Test WaldiezFlowConfig has correct attributes."""
        assert WaldiezFlowConfig.name == "waldiez_flow"
        assert (
            WaldiezFlowConfig.description
            == "Run a complete waldiez flow as tool."
        )
        assert not WaldiezFlowConfig.required_secrets
        assert WaldiezFlowConfig.required_kwargs == {
            "flow": str,
            "name": str,
            "description": str,
            "skip_deps": bool,
        }
        assert WaldiezFlowConfig.requirements == ["waldiez"]
        assert WaldiezFlowConfig.tags == ["waldiez"]
        assert WaldiezFlowConfig.implementation is not None
