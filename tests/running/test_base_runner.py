# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument,missing-yield-doc
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false
# pyright: reportArgumentType=false,reportUnknownLambdaType=false, reportUnknownArgumentType=false
"""Test waldiez.running.base_runner.*."""

import textwrap
import uuid
from collections.abc import Generator
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.models.flow.flow import WaldiezFlow
from waldiez.models.waldiez import Waldiez
from waldiez.running.base_runner import WaldiezBaseRunner


@pytest.fixture(name="waldiez_file")
def waldiez_file_fixture(tmp_path: Path) -> Generator[Path, None, None]:
    """Get a dummy waldiez file."""
    tmp_name = uuid.uuid4().hex
    tmp_file = tmp_path / f"{tmp_name}.waldiez"
    tmp_file.touch()
    yield tmp_file
    try:
        tmp_file.unlink()
    except BaseException:  # pylint: disable=broad-exception-caught
        pass


class DummyRunner(WaldiezBaseRunner):
    """Minimal subclass implementing _run and _a_run to avoid NotImplementedError."""

    def __init__(self, *args: Any, **kwargs: Any):
        with patch(
            "waldiez.running.base_runner.WaldiezExporter", autospec=True
        ) as mock_exporter_class:
            mock_exporter_instance = MagicMock()
            mock_exporter_class.return_value = mock_exporter_instance
            waldiez = kwargs.pop("waldiez", None)
            if not waldiez:
                waldiez = MagicMock()
            waldiez.name = "dummy_flow"
            kwargs["waldiez"] = waldiez
            # Call parent init within patch context so self._exporter is mocked
            super().__init__(*args, **kwargs)
            # Optionally, store the mock if you want to assert calls later
            self._mock_exporter = mock_exporter_instance

    def _run(self, *args: Any, **kwargs: Any) -> list[dict[str, Any]]:
        return [{"result": "sync"}]

    async def _a_run(self, *args: Any, **kwargs: Any) -> list[dict[str, Any]]:
        return [{"result": "async"}]


def create_dummy_module(tmp_path: Path, async_main: bool = False) -> Path:
    """Create a dummy module for testing."""
    file_path = tmp_path / "dummy_flow.py"
    if async_main:
        content = textwrap.dedent(
            """
            async def main(on_event=None):
                return [{"ok": True}]
            """
        )
    else:
        content = textwrap.dedent(
            """
            def main(on_event=None):
                return [{"ok": True}]
            """
        )
    file_path.write_text(content)
    return file_path


def test_load_module(tmp_path: Path, waldiez_file: Path) -> None:
    """Test loading a module."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, name="test-flow"),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    module = runner._load_module(output_file=file_path, temp_dir=tmp_path)
    assert hasattr(module, "main")


def test_load_module_raises_without_main(
    tmp_path: Path, waldiez_file: Path
) -> None:
    """Test loading a module without a main function."""
    file_path = tmp_path / "no_main.py"
    file_path.write_text("x = 1")
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    with pytest.raises(ImportError):
        runner._load_module(output_file=file_path, temp_dir=tmp_path)


def test_run_sets_running_flag_and_returns_results(
    tmp_path: Path, waldiez_file: Path
) -> None:
    """Test running flag and results."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    results = runner.run(output_path=str(file_path))
    assert results[0].get("result") == "sync"
    assert not runner.is_running()


@pytest.mark.asyncio
async def test_async_run_sets_running_flag_and_returns_results(
    tmp_path: Path,
    waldiez_file: Path,
) -> None:
    """Test async running flag and results."""
    file_path = create_dummy_module(tmp_path, async_main=True)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    results = await runner.a_run(output_path=str(file_path))
    assert results[0].get("result") == "async"
    assert not runner.is_running()


def test_run_raises_if_already_running(
    tmp_path: Path, waldiez_file: Path
) -> None:
    """Test if run raises an error when already running."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    # Manually set running flag
    runner._running = True
    with pytest.raises(RuntimeError, match="already running"):
        runner.run(output_path=str(file_path))


@pytest.mark.asyncio
async def test_async_run_raises_if_already_running(
    tmp_path: Path, waldiez_file: Path
) -> None:
    """Test if async run raises an error when already running."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        waldiez_file=waldiez_file,
        uploads_root=None,
        structured_io=False,
    )
    runner._running = True
    with pytest.raises(RuntimeError, match="already running"):
        await runner.a_run(output_path=str(file_path))


def test_process_event_calls_send(tmp_path: Path, waldiez_file: Path) -> None:
    """Test if process_event calls the send method."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    event = MagicMock()
    event.type = "other_event"
    called = {}

    def fake_send(e: Any) -> None:
        """Fake send method."""
        called["sent"] = True
        assert e == event

    runner.set_send_function(fake_send)
    runner.process_event(event, [], tmp_path)
    assert called.get("sent") is True


def test_process_event_input_request(
    tmp_path: Path, waldiez_file: Path
) -> None:
    """Test if process_event handles input_request events."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    responded: str | None = None

    # noinspection PyMethodMayBeStatic
    class DummyContent:
        """Dummy content class."""

        # pylint: disable=no-self-use
        def respond(self, val: Any) -> None:
            """Fake respond method."""
            nonlocal responded
            responded = val

    event = MagicMock()
    event.type = "input_request"
    event.prompt = "Enter:"
    event.password = False
    event.content = DummyContent()
    runner.set_input_function(lambda prompt, password=False: "user_input")

    runner.process_event(event, [], tmp_path)
    assert responded == "user_input"


@pytest.mark.asyncio
async def test_a_process_event_calls_send(
    waldiez_file: Path,
    tmp_path: Path,
) -> None:
    """Test if async process_event calls the send method."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    event = MagicMock()
    event.type = "other_event"
    called = {}

    def fake_send(e: Any) -> None:
        """Fake send method."""
        called["sent"] = True
        assert e == event

    runner.set_send_function(fake_send)
    await runner.a_process_event(event, [], tmp_path)
    assert called.get("sent") is True


@pytest.mark.asyncio
async def test_a_process_event_input_request(
    waldiez_file: Path,
    tmp_path: Path,
) -> None:
    """Test if async process_event handles input_request events."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # noinspection PyUnusedLocal
    async def fake_input(prompt: str, *, password: bool = False) -> str:
        """Fake input function."""
        return "user_input"

    responded: str | None = None

    # noinspection PyMethodMayBeStatic
    class DummyContent:
        """Dummy content class."""

        # pylint: disable=no-self-use
        async def respond(self, val: Any) -> None:
            """Fake respond method."""
            nonlocal responded
            responded = val

    event = MagicMock()
    event.type = "input_request"
    event.prompt = "Enter:"
    event.password = False
    event.content = DummyContent()

    runner.set_input_function(fake_input)
    await runner.a_process_event(event, [], tmp_path)
    assert responded == "user_input"


def test_prepare_paths_and_before_run(
    tmp_path: Path,
    waldiez_file: Path,
) -> None:
    """Test if _prepare_paths and _before_run work as expected."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    output_file, uploads_root_path = runner._prepare_paths(
        output_path=None, uploads_root=None
    )
    assert output_file.name == "dummy_flow.py"
    assert uploads_root_path is None

    # Test before_run creates temp dir and copies .env if given
    dummy_env = tmp_path / ".env"
    dummy_env.write_text("TEST=1")

    runner._dot_env_path = dummy_env
    runner._exporter.export = MagicMock()  # type: ignore

    temp_dir = runner._before_run(
        output_file=tmp_path / "dummy.py",
        uploads_root=None,
        message=None,
    )
    assert temp_dir.exists()
    # Check that .env was copied
    assert (temp_dir / ".env").exists()


def test_get_user_input_sync_and_async(waldiez_file: Path) -> None:
    """Test if get_user_input works with sync and async functions."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    runner._input = lambda prompt, password=False: "sync_input"
    val = runner.get_user_input("Prompt")
    assert val == "sync_input"

    # noinspection PyUnusedLocal
    async def async_input(prompt: str, *, password: bool = False) -> str:
        """Fake async input function."""
        return "async_input"

    runner._input = async_input
    # Should run async input with sync call via syncify
    val = runner.get_user_input("Prompt")
    assert val == "async_input"


def test_stop_method_sets_flags(waldiez_file: Path) -> None:
    """Test if stop() method sets the correct flags."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, name="test_flow"),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Initially, stop should not be requested
    assert not runner.is_stop_requested()
    assert not runner._stop_requested.is_set()

    # Call stop
    runner.stop()

    # Now flags should be set
    assert runner.is_stop_requested()
    assert runner._stop_requested.is_set()


def test_stop_method_with_running_workflow(waldiez_file: Path) -> None:
    """Test stop() method behavior when workflow is running."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Simulate a running workflow
    runner._running = True
    assert runner.is_running()

    # Call stop
    runner.stop()

    # Stop flags should be set even when running
    assert runner.is_stop_requested()
    assert runner._stop_requested.is_set()

    # Clean up
    runner._running = False
    assert not runner.is_running()


def test_context_manager_enter_exit(waldiez_file: Path) -> None:
    """Test context manager __enter__ and __exit__ methods."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Test __enter__ returns self
    with runner as context_runner:
        assert context_runner is runner


def test_context_manager_exit_when_running(waldiez_file: Path) -> None:
    """Test __exit__ sets stop flag when runner is running."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Set runner to running state
    runner._running = True

    # Use context manager - __exit__ should set stop flag
    with runner:
        assert not runner.is_stop_requested()  # Initially not set

    # After exiting context, stop should be requested since runner was running
    assert runner.is_stop_requested()

    # Clean up
    runner._running = False


def test_context_manager_exit_when_not_running(waldiez_file: Path) -> None:
    """Test __exit__ doesn't set stop flag when runner is not running."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Ensure runner is not running
    runner._running = False

    # Use context manager
    with runner:
        assert not runner.is_stop_requested()

    # After exiting context, stop should still not be requested
    assert not runner.is_stop_requested()


@pytest.mark.asyncio
async def test_async_context_manager_aenter_aexit(waldiez_file: Path) -> None:
    """Test async context manager __aenter__ and __aexit__ methods."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Test __aenter__ returns self
    async with runner as context_runner:
        assert context_runner is runner


@pytest.mark.asyncio
async def test_async_context_manager_aexit_when_running(
    waldiez_file: Path,
) -> None:
    """Test __aexit__ sets stop flag when runner is running."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Set runner to running state
    runner._running = True

    # Use async context manager - __aexit__ should set stop flag
    async with runner:
        assert not runner.is_stop_requested()  # Initially not set

    # After exiting context, stop should be requested since runner was running
    assert runner.is_stop_requested()

    # Clean up
    runner._running = False


@pytest.mark.asyncio
async def test_async_context_manager_aexit_when_not_running(
    waldiez_file: Path,
) -> None:
    """Test __aexit__ doesn't set stop flag when runner is not running."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Ensure runner is not running
    runner._running = False

    # Use async context manager
    async with runner:
        assert not runner.is_stop_requested()

    # After exiting context, stop should still not be requested
    assert not runner.is_stop_requested()


def test_base_runner_properties(waldiez_file: Path) -> None:
    """Test base runner properties."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        waldiez_file=waldiez_file,
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    assert runner.waldiez is not None
    assert runner.output_path is None
    assert runner.uploads_root is None
    assert not runner.running
    assert not runner.structured_io


def test_base_runner_load(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test base runner load."""
    waldiez = Waldiez.from_dict(data=waldiez_flow.model_dump(by_alias=True))
    dump_path = tmp_path / "test_runner_load.waldiez"
    with open(dump_path, "w", encoding="utf-8") as f:
        f.write(waldiez.model_dump_json(by_alias=True, indent=2))
    runner = WaldiezBaseRunner.load(
        waldiez_file=dump_path,
        name="TestRunner",
        description="A test runner",
        tags=["test"],
        requirements=["waldiez"],
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    assert runner is not None
    assert runner.waldiez is not None
    assert runner.output_path is None
    assert runner.uploads_root is None
    assert not runner.running
    assert not runner.structured_io
