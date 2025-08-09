# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc,missing-raises-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false
# pyright: reportArgumentType=false,reportUnknownLambdaType=false, reportUnknownArgumentType=false
"""Test waldiez.running.base_runner.*."""

import textwrap
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from waldiez.running.base_runner import WaldiezBaseRunner
from waldiez.running.exceptions import StopRunningException


class DummyRunner(WaldiezBaseRunner):
    """Minimal subclass implementing _run and _a_run to avoid NotImplementedError."""

    def __init__(self, *args: Any, **kwargs: Any):
        with patch(
            "waldiez.running.base_runner.WaldiezExporter", autospec=True
        ) as mock_exporter_class:
            mock_exporter_instance = MagicMock()
            mock_exporter_class.return_value = mock_exporter_instance
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


def test_load_module(tmp_path: Path) -> None:
    """Test loading a module."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    module = runner._load_module(output_file=file_path, temp_dir=tmp_path)
    assert hasattr(module, "main")


def test_load_module_raises_without_main(tmp_path: Path) -> None:
    """Test loading a module without a main function."""
    file_path = tmp_path / "no_main.py"
    file_path.write_text("x = 1")
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    with pytest.raises(ImportError):
        runner._load_module(output_file=file_path, temp_dir=tmp_path)


def test_run_sets_running_flag_and_returns_results(tmp_path: Path) -> None:
    """Test running flag and results."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    results = runner.run(output_path=str(file_path))
    assert results == [{"result": "sync"}]
    assert not runner.is_running()


@pytest.mark.asyncio
async def test_async_run_sets_running_flag_and_returns_results(
    tmp_path: Path,
) -> None:
    """Test async running flag and results."""
    file_path = create_dummy_module(tmp_path, async_main=True)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    results = await runner.a_run(output_path=str(file_path))
    assert results == [{"result": "async"}]
    assert not runner.is_running()


def test_run_raises_if_already_running(tmp_path: Path) -> None:
    """Test if run raises an error when already running."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    # Manually set running flag
    WaldiezBaseRunner._running = True
    with pytest.raises(RuntimeError, match="already running"):
        runner.run(output_path=str(file_path))


@pytest.mark.asyncio
async def test_async_run_raises_if_already_running(tmp_path: Path) -> None:
    """Test if async run raises an error when already running."""
    file_path = create_dummy_module(tmp_path)
    runner = DummyRunner(
        waldiez=MagicMock(is_async=True, get_flow_env_vars=lambda: {}),
        output_path=str(file_path),
        uploads_root=None,
        structured_io=False,
    )
    WaldiezBaseRunner._running = True
    with pytest.raises(RuntimeError, match="already running"):
        await runner.a_run(output_path=str(file_path))


def test_process_event_calls_send(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test if process_event calls the send method."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
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

    monkeypatch.setattr(WaldiezBaseRunner, "_send", staticmethod(fake_send))
    WaldiezBaseRunner.process_event(event)
    assert called.get("sent") is True


def test_process_event_input_request(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test if process_event handles input_request events."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    responded: str | None = None

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

    monkeypatch.setattr(
        WaldiezBaseRunner,
        "get_user_input",
        staticmethod(lambda prompt, password=False: "user_input"),
    )

    WaldiezBaseRunner.process_event(event)
    assert responded == "user_input"


@pytest.mark.asyncio
async def test_a_process_event_calls_send(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test if async process_event calls the send method."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
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

    monkeypatch.setattr(WaldiezBaseRunner, "_send", staticmethod(fake_send))
    await WaldiezBaseRunner.a_process_event(event)
    assert called.get("sent") is True


@pytest.mark.asyncio
async def test_a_process_event_input_request(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test if async process_event handles input_request events."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=True),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    async def fake_input(prompt: str, *, password: bool = False) -> str:
        """Fake input function."""
        return "user_input"

    responded: str | None = None

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

    monkeypatch.setattr(
        WaldiezBaseRunner,
        "a_get_user_input",
        staticmethod(fake_input),
    )

    await WaldiezBaseRunner.a_process_event(event)
    assert responded == "user_input"


def test_prepare_paths_and_before_run(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Test if _prepare_paths and _before_run work as expected."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    output_file, uploads_root_path = runner._prepare_paths(
        output_path=None, uploads_root=None
    )
    assert output_file.name == "waldiez_flow.py"
    assert uploads_root_path is None

    # Test before_run creates temp dir and copies .env if given
    dummy_env = tmp_path / ".env"
    dummy_env.write_text("TEST=1")

    runner._dot_env_path = dummy_env
    runner._exporter.export = MagicMock()  # type: ignore

    temp_dir = runner._before_run(
        output_file=tmp_path / "dummy.py", uploads_root=None
    )
    assert temp_dir.exists()
    # Check that .env was copied
    assert (temp_dir / ".env").exists()


def test_context_manager_stop_requested(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test if context manager handles stop_requested flag."""
    runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    runner._running = True
    with runner:
        pass
    assert not runner._stop_requested.is_set()

    runner._running = True
    with pytest.raises(StopRunningException):
        with runner:
            raise StopRunningException("stop")


def test_get_input_function_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test if get_input_function returns the correct input function."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )

    # Override _input with a custom function
    def fake_input(prompt: str, *, password: bool = False) -> str:
        """Fake input function."""
        return "custom input"

    WaldiezBaseRunner._input = fake_input
    input_func = WaldiezBaseRunner.get_input_function()
    assert input_func == fake_input  # pylint: disable=comparison-with-callable


def test_get_user_input_sync_and_async(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test if get_user_input works with sync and async functions."""
    _runner = DummyRunner(
        waldiez=MagicMock(is_async=False),
        output_path=None,
        uploads_root=None,
        structured_io=False,
    )
    WaldiezBaseRunner._input = lambda prompt, password=False: "sync_input"
    val = WaldiezBaseRunner.get_user_input("Prompt")
    assert val == "sync_input"

    async def async_input(prompt: str, *, password: bool = False) -> str:
        """Fake async input function."""
        return "async_input"

    WaldiezBaseRunner._input = async_input
    # Should run async input with sync call via syncify
    val = WaldiezBaseRunner.get_user_input("Prompt")
    assert val == "async_input"

    # Test a_get_user_input
    # val = pytest.r(asyncio.run(WaldiezBaseRunner.a_get_user_input("Prompt")))
    # We can only really test this if inside an async context or event loop


@pytest.mark.asyncio
async def test_async_get_user_input(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test if a_get_user_input works as expected."""

    async def async_input(prompt: str, *, password: bool = False) -> str:
        """Fake async input function."""
        return "async_input"

    WaldiezBaseRunner._input = async_input
    val = await WaldiezBaseRunner.a_get_user_input("Prompt")
    assert val == "async_input"
