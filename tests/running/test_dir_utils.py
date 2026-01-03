# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc

"""Test waldiez.running.dir_utils.*."""

from pathlib import Path

import pytest

from waldiez.running import dir_utils


def test_chdir_context(tmp_path: Path) -> None:
    """Test the chdir context manager."""
    orig_cwd = Path.cwd()
    with dir_utils.chdir(tmp_path):
        assert Path.cwd() == tmp_path
    assert Path.cwd() == orig_cwd


@pytest.mark.asyncio
async def test_a_chdir_context(tmp_path: Path) -> None:
    """Test the async chdir context manager."""
    orig_cwd = Path.cwd()
    async with dir_utils.a_chdir(tmp_path):
        assert Path.cwd() == tmp_path
    assert Path.cwd() == orig_cwd
