# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.flow.utils.def_main."""

from waldiez.exporting.flow.utils.def_main import get_def_main


def test_get_def_main() -> None:
    """Test get_def_main."""
    flow_chats = "flow chats content"
    after_run = "after run content"
    cache_seed = 42
    is_async = True
    result = get_def_main(flow_chats, after_run, is_async, cache_seed)
    assert isinstance(result, str)
    assert "async def main()" in result
    assert "flow chats content" in result
    assert "stop_logging()" in result
    assert "after run content" in result
    assert "return results" in result
    assert 'if __name__ == "__main__":' in result
    assert "anyio.run" in result

    is_async = False
    result = get_def_main(flow_chats, after_run, is_async, cache_seed)
    assert isinstance(result, str)
    assert "async def main()" not in result
    assert "def main()" in result
    assert "flow chats content" in result
    assert "after run content" in result
    assert "return results" in result
    assert 'if __name__ == "__main__":' in result
    assert "anyio.run" not in result
    assert "main()" in result
