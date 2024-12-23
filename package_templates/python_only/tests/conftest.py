"""Configuration for pytest."""

import re
from typing import Callable, Generator

import pytest


@pytest.fixture(autouse=True)
def escape_ansi() -> Callable[[str], str]:
    """Remove ANSI escape sequences from a string.

    Returns
    -------
    Callable[[str], str]
        The escape_ansi function.
    """

    def _escape_ansi(text: str) -> str:
        """Remove ANSI escape sequences from a string.

        Parameters
        ----------
        text : str
            The text to remove ANSI escape sequences from.

        Returns
        -------
        str
            The text with ANSI escape sequences removed.
        """
        if not text:
            return text
        ansi_escape = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
        return ansi_escape.sub("", text)

    return _escape_ansi


def _before() -> None:
    """Run before all tests."""
    # tricky if xdist is used


def _after() -> None:
    """Run after all tests."""
    # tricky if xdist is used


# pylint: disable=unused-argument
@pytest.fixture(scope="session", autouse=True)
def before_and_after_tests(
    request: pytest.FixtureRequest,
) -> Generator[None, None, None]:
    """Fixture to run before and after all tests.

    Parameters
    ----------
    request : pytest.FixtureRequest
        The request object.

    Yields
    ------
    Generator[None, None, None]
        The generator.
    """
    _before()
    yield
    _after()
