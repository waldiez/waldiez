# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Test my_package.app.*."""
import pytest

from my_package.main import greet


def test_greet() -> None:
    """Test greet."""
    with pytest.raises(NotImplementedError):
        greet("Alice")


async def greet_async(name: str) -> None:
    """Greet async.

    Just a demo for async tests.

    Parameters
    ----------
    name : str
        The name to greet.
    """
    greet(name)


@pytest.mark.asyncio
async def test_greet_async() -> None:
    """Test greet async."""
    with pytest.raises(NotImplementedError):
        await greet_async("Alice")
