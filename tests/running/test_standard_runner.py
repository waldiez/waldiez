# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long,missing-param-doc,missing-return-doc
# pylint: disable=protected-access,too-few-public-methods,unused-argument
# flake8: noqa: E501
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false, reportPrivateUsage=false, reportArgumentType=false
"""Test waldiez.running.standard_runner.*."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from waldiez.models.flow.info import WaldiezFlowInfo
from waldiez.running.standard_runner import WaldiezStandardRunner

BASE_RUNNER = "waldiez.running.base_runner.WaldiezBaseRunner"


@pytest.fixture(name="runner")
def runner_fixture() -> WaldiezStandardRunner:
    """Fixture for WaldiezStandardRunner."""
    waldiez = MagicMock()
    waldiez.info = WaldiezFlowInfo(participants=[])
    return WaldiezStandardRunner(waldiez=waldiez)


def test_run_success_and_failure(runner: WaldiezStandardRunner) -> None:
    """Test successful and failed runs."""
    mock_module = MagicMock()
    mock_module.main.return_value = [{"result": "ok"}]

    with patch.object(runner, "_load_module", return_value=mock_module):
        results = runner._run(
            temp_dir=MagicMock(),
            output_file=MagicMock(),
            uploads_root=None,
            skip_mmd=False,
            skip_timeline=False,
        )
        assert results == [{"result": "ok"}]

    # Simulate _stop_requested set before run starts
    with patch.object(runner, "_load_module", return_value=mock_module):
        runner._stop_requested.set()
        results = runner._run(
            temp_dir=MagicMock(),
            output_file=MagicMock(),
            uploads_root=None,
            skip_mmd=False,
            skip_timeline=False,
        )
        assert results == []


def test_on_event_processing_and_stop(runner: WaldiezStandardRunner) -> None:
    """Test event processing and stopping behavior."""
    event = MagicMock()
    event.type = "normal"

    with patch(f"{BASE_RUNNER}.process_event") as mock_process:
        result = runner._on_event(event)
        assert result is True
        mock_process.assert_called_once_with(event)

    # Set stop_requested before event processing
    runner._stop_requested.set()
    result = runner._on_event(event)
    assert result is False
    runner._stop_requested.clear()

    # Raise exception in process_event
    with patch(f"{BASE_RUNNER}.process_event", side_effect=Exception("fail")):
        with pytest.raises(RuntimeError):
            runner._on_event(event)


@pytest.mark.asyncio
async def test_async_on_event_processing_and_stop(
    runner: WaldiezStandardRunner,
) -> None:
    """Test event processing and stopping behavior."""
    event = MagicMock()
    event.type = "normal"

    with patch(
        f"{BASE_RUNNER}.a_process_event", new_callable=AsyncMock
    ) as mock_process:
        result = await runner._a_on_event(event)
        assert result is True
        mock_process.assert_called_once_with(event)

    runner._stop_requested.set()
    result = await runner._a_on_event(event)
    assert result is False
    runner._stop_requested.clear()

    with patch(f"{BASE_RUNNER}.a_process_event", side_effect=Exception("fail")):
        with pytest.raises(RuntimeError):
            await runner._a_on_event(event)


@pytest.mark.asyncio
async def test_async_run_cancellation_and_success(
    runner: WaldiezStandardRunner,
) -> None:
    """Test async run cancellation and success behavior."""
    mock_module = MagicMock()
    mock_module.main = AsyncMock(return_value=[{"ok": True}])

    with patch.object(runner, "_load_module", return_value=mock_module):
        # Test normal async run returns expected result
        results = await runner._a_run(
            temp_dir=MagicMock(),
            output_file=MagicMock(),
            uploads_root=None,
        )
        assert results == [{"ok": True}]

    # Test cancellation handling
    with patch.object(runner, "_load_module", return_value=mock_module):
        runner._stop_requested.set()
        # Because stop requested is set, the async run cancels early and returns []
        results = await runner._a_run(
            temp_dir=MagicMock(),
            output_file=MagicMock(),
            uploads_root=None,
        )
        assert results == []


def test_print_calls_base_runner_print(runner: WaldiezStandardRunner) -> None:
    """Test print calls to base runner."""
    with patch(f"{BASE_RUNNER}._print") as mock_print:
        runner.print("hello")
        mock_print.assert_called_once_with("hello")


def test_printing_using_structured_io(runner: WaldiezStandardRunner) -> None:
    """Test printing using structured I/O."""
    # start running first (to get the structured I/O context)
    # runner.run(structured_io=True)
    mock_module = MagicMock()
    mock_module.main.return_value = [{"result": "ok"}]

    with patch.object(runner, "_load_module", return_value=mock_module):
        with patch("builtins.print") as mock_print:
            with patch(f"{BASE_RUNNER}._structured_io", return_value=True):
                runner._run(
                    temp_dir=MagicMock(),
                    output_file=MagicMock(),
                    uploads_root=None,
                    skip_mmd=False,
                    skip_timeline=False,
                )
            assert mock_print.call_count == 3
            # 1 for the start message, 1 for the result, and 1 for the end message
            first_call = mock_print.call_args_list[0]
            parsed = json.loads(first_call[0][0])
            assert parsed["type"] == "print"
            assert parsed["data"] == "<Waldiez> - Starting workflow..."


@pytest.mark.asyncio
async def test_async_printing_using_structured_io(
    runner: WaldiezStandardRunner,
) -> None:
    """Test async printing using structured I/O."""
    mock_module = MagicMock()
    mock_module.main = AsyncMock(return_value=[{"result": "ok"}])

    with patch.object(runner, "_load_module", return_value=mock_module):
        with patch("builtins.print") as mock_print:
            with patch(f"{BASE_RUNNER}._structured_io", return_value=True):
                await runner._a_run(
                    temp_dir=MagicMock(),
                    output_file=MagicMock(),
                    uploads_root=None,
                    skip_mmd=False,
                    skip_timeline=False,
                )
            assert mock_print.call_count == 3
            # 1 for the start message, 1 for the result, and 1 for the end message
            first_call = mock_print.call_args_list[0]
            parsed = json.loads(first_call[0][0])
            assert parsed["type"] == "print"
            assert parsed["data"] == "<Waldiez> - Starting workflow..."
