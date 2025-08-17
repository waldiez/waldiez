# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test WaldiezRunner."""
# pylint: disable=protected-access,no-self-use,unused-argument

import shutil
from pathlib import Path
from typing import Any

import pytest
from autogen.io import IOStream  # type: ignore

from waldiez.models import Waldiez, WaldiezFlow
from waldiez.runner import WaldiezRunner
from waldiez.running.utils import get_printer


# noinspection PyMethodMayBeStatic,PyUnusedLocal
class CustomIOStream(IOStream):
    """Custom IOStream class."""

    def print(
        self,
        *objects: Any,
        sep: str = " ",
        end: str = "\n",
        flush: bool = False,
    ) -> None:
        """Print objects.

        Parameters
        ----------
        objects : Any
            Objects to print.
        sep : str, optional
            Separator, by default " ".
        end : str, optional
            End, by default 'eol'.
        flush : bool, optional
            Whether to flush, by default False.
        """
        print(*objects, sep=sep, end=end, flush=flush)

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Get user input.

        Parameters
        ----------
        prompt : str, optional
            Prompt, by default "".
        password : bool, optional
            Whether to read a password, by default False.

        Returns
        -------
        str
            User input.
        """
        return "User Input"

    def send(self, message: Any) -> None:
        """Send data.

        Parameters
        ----------
        message : Any
            Message to send.
        """
        self.print(str(message))


def test_waldiez_runner(
    waldiez_flow: WaldiezFlow,
    tmp_path: Path,
) -> None:
    """Test WaldiezRunner.

    Parameters
    ----------
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    tmp_path : Path
        Pytest fixture to create temporary directory.
    """
    waldiez = Waldiez.from_dict(data=waldiez_flow.model_dump(by_alias=True))
    output_path = tmp_path / "output.py"
    runner = WaldiezRunner(waldiez)
    with IOStream.set_default(CustomIOStream()):
        runner.run(output_path=output_path, skip_mmd=True)
    assert (tmp_path / "waldiez_out").exists()
    shutil.rmtree(tmp_path / "waldiez_out")


@pytest.mark.timeout(600)
def test_waldiez_runner_requirements_with_captain_agent(
    waldiez_flow_with_captain_agent: WaldiezFlow,
) -> None:
    """Test WaldiezRunner with requirements when captain agent is present.

    Parameters
    ----------
    waldiez_flow_with_captain_agent : WaldiezFlow
    """
    waldiez = Waldiez.from_dict(
        data=waldiez_flow_with_captain_agent.model_dump(by_alias=True)
    )
    runner = WaldiezRunner(waldiez)
    with IOStream.set_default(CustomIOStream()):
        runner.install_requirements()


def test_waldiez_with_invalid_requirement(
    capsys: pytest.CaptureFixture[str],
    waldiez_flow: WaldiezFlow,
) -> None:
    """Test Waldiez with invalid requirement.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    flow_dict = waldiez_flow.model_dump(by_alias=True)
    # add an invalid requirement
    flow_dict["requirements"] = ["invalid_requirement"]
    with IOStream.set_default(CustomIOStream()):
        # create a Waldiez instance with invalid requirement
        waldiez = Waldiez.from_dict(data=flow_dict)
        runner = WaldiezRunner(waldiez)
        runner.install_requirements()
        std_err = capsys.readouterr().out
        assert (
            "ERROR: No matching distribution found for invalid_requirement"
            in std_err
        )


class BadIOStream(CustomIOStream):
    """Bad IOStream class."""

    def print(
        self,
        *objects: Any,
        sep: str = " ",
        end: str = "\n",
        flush: bool = False,
    ) -> None:
        """Print objects.

        Parameters
        ----------
        objects : Any
            Objects to print.
        sep : str, optional
            Separator, by default " ".
        end : str, optional
            End, by default 'eol'.
        flush : bool, optional
            Whether to flush, by default False.

        Raises
        ------
        UnicodeEncodeError
            If the string is invalid
        """
        raise UnicodeEncodeError("utf-8", "", 0, 1, "invalid string")


def test_get_printer(capsys: pytest.CaptureFixture[str]) -> None:
    """Test get_printer.

    Parameters
    ----------
    capsys : pytest.CaptureFixture[str]
        Pytest fixture to capture stdout and stderr.
    """
    printer = get_printer()
    invalid_str = "This is an invalid string: 🤯"
    printer(invalid_str)
    assert "This is an invalid string: " in capsys.readouterr().out
    invalid_encoded = "This is an invalid encoded string".encode("cp1252")
    printer(invalid_encoded)
    assert "This is an invalid encoded string" in capsys.readouterr().out
    with IOStream.set_default(BadIOStream()):
        printer1 = get_printer()
        printer1(invalid_str)


def test_runner_load(
    waldiez_flow: WaldiezFlow,
    tmp_path: Path,
) -> None:
    """Test WaldiezRunner.load.

    Parameters
    ----------
    tmp_path : Path
        Pytest fixture to create temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    # Test loading a valid flow
    waldiez = Waldiez.from_dict(data=waldiez_flow.model_dump(by_alias=True))
    dump_path = tmp_path / "test_runner_load.waldiez"
    with open(dump_path, "w", encoding="utf-8") as f:
        f.write(waldiez.model_dump_json(by_alias=True, indent=2))
    runner = WaldiezRunner.load(dump_path)
    assert runner is not None
    if dump_path.exists():
        try:
            dump_path.unlink()
        except (OSError, PermissionError):
            pass
