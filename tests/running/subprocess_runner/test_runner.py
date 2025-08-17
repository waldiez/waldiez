# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc, missing-return-doc,missing-yield-doc
# pylint: disable=protected-access, duplicate-code,no-self-use
# pyright: reportPrivateUsage=false
"""Tests for WaldiezSubprocessRunner."""

from pathlib import Path
from typing import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.logger import get_logger
from waldiez.models import Waldiez
from waldiez.running.subprocess_runner import WaldiezSubprocessRunner


@pytest.fixture(name="mock_waldiez")
def mock_waldiez_fixture() -> Waldiez:
    """Mock Waldiez instance."""
    waldiez = MagicMock(spec=Waldiez)
    waldiez.name = "test_flow"
    waldiez.model_dump_json.return_value = '{"name": "test_flow"}'
    waldiez.is_async = False
    return waldiez


@pytest.fixture(name="runner")
def runner_fixture(
    mock_waldiez: Waldiez, tmp_path: Path
) -> Generator[WaldiezSubprocessRunner, None, None]:
    """Create WaldiezSubprocessRunner instance."""
    tmp_flow = tmp_path / "test_flow.waldiez"
    with open(tmp_flow, "wb") as f:
        f.write(b'{"name": "test_flow"}')

    yield WaldiezSubprocessRunner(
        waldiez=mock_waldiez,
        waldiez_file=tmp_flow,
        logger=get_logger(level="debug"),
        mode="debug",
    )
    if tmp_flow.exists():
        try:
            tmp_flow.unlink()
        except (OSError, FileNotFoundError, PermissionError):
            pass


def test_init_defaults(mock_waldiez: Waldiez) -> None:
    """Test initialization with default values."""
    runner = WaldiezSubprocessRunner(waldiez=mock_waldiez)

    assert runner.waldiez == mock_waldiez
    assert runner.sync_on_output is not None
    assert runner.sync_on_input_request is not None
    assert runner.async_on_output is not None
    assert runner.async_on_input_request is not None
    assert runner.input_timeout == 120.0
    assert runner.async_runner is None
    assert runner.sync_runner is None
    assert runner.mode == "run"


def test_init_with_params(mock_waldiez: Waldiez) -> None:
    """Test initialization with custom parameters."""
    mock_output = MagicMock()
    mock_input = MagicMock()
    mock_async_output = AsyncMock()
    mock_async_input = AsyncMock()

    runner = WaldiezSubprocessRunner(
        waldiez=mock_waldiez,
        on_output=mock_output,
        on_input_request=mock_input,
        on_async_output=mock_async_output,
        on_async_input_request=mock_async_input,
        input_timeout=60.0,
        mode="debug",
    )

    assert runner.sync_on_output == mock_output
    assert runner.sync_on_input_request == mock_input
    assert runner.async_on_output == mock_async_output
    assert runner.async_on_input_request == mock_async_input
    assert runner.input_timeout == 60.0
    assert runner.mode == "debug"


def test_init_invalid_mode(mock_waldiez: Waldiez) -> None:
    """Test initialization with invalid mode."""
    with pytest.raises(ValueError, match="Invalid mode: invalid"):
        WaldiezSubprocessRunner(waldiez=mock_waldiez, mode="invalid")


def test_ensure_waldiez_file_existing(
    mock_waldiez: Waldiez, tmp_path: Path
) -> None:
    """Test ensuring waldiez file when file exists."""
    tmp_flow = tmp_path / "test_ensure_waldiez_file_existing.waldiez"
    with open(tmp_flow, "wb") as f:
        f.write(b'{"name": "test_flow"}')

    runner = WaldiezSubprocessRunner(
        waldiez=mock_waldiez, waldiez_file=tmp_flow
    )

    assert runner._waldiez_file == tmp_flow.resolve()
    if tmp_flow.exists():
        try:
            tmp_flow.unlink()
        except (OSError, FileNotFoundError, PermissionError):
            pass


def test_ensure_waldiez_file_nonexistent(mock_waldiez: Waldiez) -> None:
    """Test ensuring waldiez file when file doesn't exist."""
    runner = WaldiezSubprocessRunner(waldiez=mock_waldiez)

    # Should create a file based on waldiez.name
    assert runner._waldiez_file.exists()
    assert runner._waldiez_file.name.startswith("test_flow")


def test_default_sync_output(
    runner: WaldiezSubprocessRunner,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Test default sync output handler."""
    # Test regular output
    runner._default_sync_output({"type": "output", "data": "test message"})

    # Test error output
    runner._default_sync_output({"type": "error", "data": "error message"})
    captured = capsys.readouterr()
    assert "error message" in captured.out or "error message" in captured.err


@pytest.mark.asyncio
async def test_default_async_output(
    runner: WaldiezSubprocessRunner,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Test default async output handler."""
    await runner._default_async_output({"type": "output", "data": "test"})

    await runner._default_async_output(
        {"type": "error", "data": "error message"}
    )

    captured = capsys.readouterr()
    assert "error message" in captured.err or "error message" in captured.out


def test_create_async_subprocess_runner(
    runner: WaldiezSubprocessRunner,
) -> None:
    """Test creating async subprocess runner."""
    async_runner = runner._create_async_subprocess_runner()

    assert runner.async_runner is not None
    assert async_runner == runner.async_runner
    assert async_runner.on_output == runner.async_on_output
    assert async_runner.on_input_request == runner.async_on_input_request


def test_create_sync_subprocess_runner(runner: WaldiezSubprocessRunner) -> None:
    """Test creating sync subprocess runner."""
    sync_runner = runner._create_sync_subprocess_runner()

    assert runner.sync_runner is not None
    assert sync_runner == runner.sync_runner
    assert sync_runner.on_output == runner.sync_on_output
    assert sync_runner.on_input_request == runner.sync_on_input_request


def test_get_output_file_with_path(runner: WaldiezSubprocessRunner) -> None:
    """Test getting output file with provided path."""
    output_path = Path("custom_output.py")

    with patch("pathlib.Path.is_file", return_value=True):
        result = runner._get_output_file(output_path)
        assert result == output_path


def test_get_output_file_with_directory(
    runner: WaldiezSubprocessRunner, tmp_path: Path
) -> None:
    """Test getting output file with directory path."""
    output_dir = tmp_path / "output"

    with patch("pathlib.Path.is_file", return_value=False):
        with patch("pathlib.Path.is_dir", return_value=True):
            result = runner._get_output_file(output_dir)
            expected = output_dir / f"{runner._waldiez_file.stem}.py"
            assert result == expected


def test_get_output_file_fallback(runner: WaldiezSubprocessRunner) -> None:
    """Test getting output file with fallback."""
    with patch("pathlib.Path.is_file", return_value=False):
        with patch("pathlib.Path.is_dir", return_value=False):
            result = runner._get_output_file(None)
            expected = runner._waldiez_file.with_suffix(".py")
            assert result == expected


def test_run_success(runner: WaldiezSubprocessRunner) -> None:
    """Test successful run."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.run_subprocess.return_value = True

    with patch.object(
        runner,
        "_create_sync_subprocess_runner",
        return_value=mock_sync_runner,
    ):
        result = runner.run()

        assert len(result) == 1
        assert result[0]["success"] is True
        assert result[0]["runner"] == "sync_subprocess"
        assert result[0]["mode"] == "debug"


def test_run_failure(runner: WaldiezSubprocessRunner) -> None:
    """Test failed run."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.run_subprocess.return_value = False

    with patch.object(
        runner,
        "_create_sync_subprocess_runner",
        return_value=mock_sync_runner,
    ):
        result = runner.run()

        assert len(result) == 1
        assert result[0]["success"] is False


def test_run_exception(runner: WaldiezSubprocessRunner) -> None:
    """Test run with exception."""
    with patch.object(
        runner,
        "_create_sync_subprocess_runner",
        side_effect=Exception("Test error"),
    ):
        result = runner.run()

        assert len(result) == 1
        assert "error" in result[0]
        assert result[0]["error"] == "Test error"


@pytest.mark.asyncio
async def test_a_run_success(runner: WaldiezSubprocessRunner) -> None:
    """Test successful async run."""
    mock_async_runner = AsyncMock()
    mock_async_runner.run_subprocess.return_value = True

    with patch.object(
        runner,
        "_create_async_subprocess_runner",
        return_value=mock_async_runner,
    ):
        result = await runner.a_run()

        assert len(result) == 1
        assert result[0]["success"] is True
        assert result[0]["runner"] == "async_subprocess"
        assert result[0]["mode"] == "debug"


@pytest.mark.asyncio
async def test_a_run_failure(runner: WaldiezSubprocessRunner) -> None:
    """Test failed async run."""
    mock_async_runner = AsyncMock()
    mock_async_runner.run_subprocess.return_value = False

    with patch.object(
        runner,
        "_create_async_subprocess_runner",
        return_value=mock_async_runner,
    ):
        result = await runner.a_run()

        assert len(result) == 1
        assert result[0]["success"] is False


@pytest.mark.asyncio
async def test_a_run_exception(runner: WaldiezSubprocessRunner) -> None:
    """Test async run with exception."""
    with patch.object(
        runner,
        "_create_async_subprocess_runner",
        side_effect=Exception("Test error"),
    ):
        result = await runner.a_run()

        assert len(result) == 1
        assert "error" in result[0]
        assert result[0]["error"] == "Test error"


@pytest.mark.asyncio
async def test_provide_user_input_async_runner(
    runner: WaldiezSubprocessRunner,
) -> None:
    """Test providing user input to async runner."""
    mock_async_runner = MagicMock()
    mock_async_runner.is_running = MagicMock(return_value=True)
    mock_async_runner.provide_user_input = AsyncMock()
    runner.async_runner = mock_async_runner

    runner.provide_user_input("test input")
    mock_async_runner.provide_user_input.assert_called_once_with("test input")


def test_provide_user_input_sync_runner(
    runner: WaldiezSubprocessRunner,
) -> None:
    """Test providing user input to sync runner."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.is_running.return_value = True
    runner.sync_runner = mock_sync_runner

    runner.provide_user_input("test input")

    mock_sync_runner.provide_user_input.assert_called_once_with("test input")


@pytest.mark.asyncio
async def test_a_provide_user_input_async_runner(
    runner: WaldiezSubprocessRunner,
) -> None:
    """Test async providing user input to async runner."""
    mock_async_runner = MagicMock()
    mock_async_runner.is_running = MagicMock(return_value=True)
    mock_async_runner.provide_user_input = AsyncMock()
    runner.async_runner = mock_async_runner

    await runner.a_provide_user_input("test input")

    mock_async_runner.provide_user_input.assert_called_once_with("test input")


@pytest.mark.asyncio
async def test_a_provide_user_input_sync_runner(
    runner: WaldiezSubprocessRunner,
) -> None:
    """Test async providing user input to sync runner."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.is_running = MagicMock(return_value=True)
    runner.sync_runner = mock_sync_runner

    await runner.a_provide_user_input("test input")
    mock_sync_runner.provide_user_input.assert_called_once_with("test input")


@pytest.mark.asyncio
async def test_stop_async_runner(runner: WaldiezSubprocessRunner) -> None:
    """Test stopping the runner."""
    mock_async_runner = MagicMock()
    mock_async_runner.is_running = MagicMock(return_value=True)
    mock_async_runner.stop = AsyncMock()
    runner.async_runner = mock_async_runner
    runner.stop()
    mock_async_runner.stop.assert_called_once()


@pytest.mark.asyncio
async def test_a_stop_async_runner(runner: WaldiezSubprocessRunner) -> None:
    """Test async stopping the runner."""
    mock_async_runner = MagicMock()
    mock_async_runner.is_running = MagicMock(return_value=True)
    mock_async_runner.stop = AsyncMock()
    runner.async_runner = mock_async_runner

    await runner.a_stop()

    mock_async_runner.stop.assert_awaited_once()


def test_stop_sync_runner(runner: WaldiezSubprocessRunner) -> None:
    """Test stopping the sync runner."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.is_running = MagicMock(return_value=True)
    mock_sync_runner.stop = MagicMock()
    runner.sync_runner = mock_sync_runner

    runner.stop()

    mock_sync_runner.stop.assert_called_once()


@pytest.mark.asyncio
async def test_a_stop_sync_runner(runner: WaldiezSubprocessRunner) -> None:
    """Test async stopping the sync runner."""
    mock_sync_runner = MagicMock()
    mock_sync_runner.is_running = MagicMock(return_value=True)
    mock_sync_runner.stop = MagicMock()
    runner.sync_runner = mock_sync_runner

    await runner.a_stop()

    mock_sync_runner.stop.assert_called_once()


def test_is_subprocess_running(runner: WaldiezSubprocessRunner) -> None:
    """Test checking if subprocess is running."""
    # No runners
    assert runner.is_subprocess_running() is False

    # Async runner running
    mock_async_runner = MagicMock()
    mock_async_runner.is_running.return_value = True
    runner.async_runner = mock_async_runner
    assert runner.is_subprocess_running() is True

    # Sync runner running
    runner.async_runner = None
    mock_sync_runner = MagicMock()
    mock_sync_runner.is_running.return_value = True
    runner.sync_runner = mock_sync_runner
    assert runner.is_subprocess_running() is True


def test_get_subprocess_exit_code(runner: WaldiezSubprocessRunner) -> None:
    """Test getting subprocess exit code."""
    # No sync runner
    assert runner.get_subprocess_exit_code() is None

    # With sync runner
    mock_sync_runner = MagicMock()
    mock_sync_runner.get_exit_code.return_value = 0
    runner.sync_runner = mock_sync_runner
    assert runner.get_subprocess_exit_code() == 0


def test_runner_after_run(
    runner: WaldiezSubprocessRunner, tmp_path: Path
) -> None:
    """Test cleanup of subprocess runners."""
    runner.async_runner = MagicMock()
    runner.sync_runner = MagicMock()

    with patch("asyncio.create_task"):
        runner._after_run(
            results=[],
            output_file=Path("output.py"),
            uploads_root=None,
            temp_dir=tmp_path,
            skip_mmd=False,
            skip_timeline=False,
        )

    assert runner.async_runner is None
    assert runner.sync_runner is None


def test_runner_after_run_sync_running(
    runner: WaldiezSubprocessRunner, tmp_path: Path
) -> None:
    """Test cleanup of subprocess runners when sync runner is running."""
    runner.sync_runner = MagicMock()
    runner.sync_runner.is_running = MagicMock(return_value=True)
    mock_stop = MagicMock()
    runner.sync_runner.stop = mock_stop
    runner.async_runner = None

    with patch("asyncio.create_task"):
        runner._after_run(
            results=[],
            output_file=Path("output.py"),
            uploads_root=None,
            temp_dir=tmp_path,
            skip_mmd=False,
            skip_timeline=False,
        )

    assert runner.async_runner is None
    assert runner.sync_runner is None
    mock_stop.assert_called_once()


@pytest.mark.asyncio
async def test_a_runner_after_run_sync(
    runner: WaldiezSubprocessRunner, tmp_path: Path
) -> None:
    """Test cleanup of subprocess runners when sync runner is running."""
    runner.sync_runner = MagicMock()
    runner.sync_runner.is_running = MagicMock(return_value=True)
    mock_stop = MagicMock()
    runner.sync_runner.stop = mock_stop
    runner.async_runner = None

    with patch("asyncio.create_task"):
        await runner._a_after_run(
            results=[],
            output_file=Path("output.py"),
            uploads_root=None,
            temp_dir=tmp_path,
            skip_mmd=False,
            skip_timeline=False,
        )

    assert runner.async_runner is None
    assert runner.sync_runner is None
    mock_stop.assert_called_once()


@pytest.mark.asyncio
async def test_a_runner_after_run_async(
    runner: WaldiezSubprocessRunner, tmp_path: Path
) -> None:
    """Test cleanup of subprocess runners when async runner is running."""
    runner.async_runner = MagicMock()
    runner.async_runner.is_running = MagicMock(return_value=True)
    mock_stop = AsyncMock()
    runner.async_runner.stop = mock_stop
    runner.sync_runner = None

    await runner._a_after_run(
        results=[],
        output_file=Path("output.py"),
        uploads_root=None,
        temp_dir=tmp_path,
        skip_mmd=False,
        skip_timeline=False,
    )

    assert runner.async_runner is None
    assert runner.sync_runner is None
    mock_stop.assert_called_once()


@patch("waldiez.models.Waldiez.load")
def test_create_with_callbacks(
    mock_load: MagicMock, mock_waldiez: Waldiez
) -> None:
    """Test creating runner with callbacks."""
    mock_load.return_value = mock_waldiez
    mock_output = MagicMock()
    mock_input = MagicMock()

    runner = WaldiezSubprocessRunner.create_with_callbacks(
        "test.waldiez",
        on_output=mock_output,
        on_input_request=mock_input,
        mode="debug",
    )

    assert runner.sync_on_output == mock_output
    assert runner.sync_on_input_request == mock_input
    assert runner.mode == "debug"
    mock_load.assert_called_once_with("test.waldiez")
