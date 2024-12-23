"""Tests for the __main__ module of my_package."""

import sys

import pytest

from my_package.__main__ import app as main_app


def test_calling_my_package_as_module(
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Test calling my_package as a module.

    just to get full coverage

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        The capsys fixture.
    """
    with pytest.raises(SystemExit):
        sys.argv = ["my_package", "--version"]
        main_app()
    captured = capsys.readouterr()
    assert "my-package" in captured.out
