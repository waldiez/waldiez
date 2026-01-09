# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
# pylint: disable=too-few-public-methods,too-many-public-methods
# pylint: disable=protected-access,comparison-with-callable
# pylint: disable=unused-argument,attribute-defined-outside-init
# pyright: reportUnknownArgumentType=false,reportUnknownLambdaType=false
# pyright: reportAttributeAccessIssue=false

"""Tests for events_mixin module."""

import asyncio
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, Mock, patch

from waldiez.running.events_mixin import EventsMixin
from waldiez.running.io_utils import input_async, input_sync


class MockMessage:
    """Mock message for testing."""

    def __init__(self, content: str) -> None:
        self.content = content


class MockInputContent:
    """Mock input content with respond method."""

    response: str | None

    def __init__(self, prompt: str = "> ", password: bool = False) -> None:
        self.prompt = prompt
        self.password = password
        self.response = None
        self.respond = AsyncMock(side_effect=self._respond)
        self.sync_respond = Mock(side_effect=self._respond)

    def _respond(self, value: str) -> None:
        """Store the response."""
        self.response = value


class MockEvent:
    """Mock event for testing."""

    def __init__(
        self, event_type: str, content: Any | dict[str, Any] | None = None
    ) -> None:
        self.type = event_type
        self.content = content or {}
        self.prompt = (
            content.prompt if isinstance(content, MockInputContent) else ""
        )
        self.password = (
            content.password if isinstance(content, MockInputContent) else False
        )


class TestEventsMixin:
    """Tests for EventsMixin class."""

    def setup_method(self) -> None:
        """Set up for each test method."""
        # Reset EventsMixin state
        if hasattr(EventsMixin, "_input"):
            delattr(EventsMixin, "_input")
        if hasattr(EventsMixin, "_print"):
            delattr(EventsMixin, "_print")
        if hasattr(EventsMixin, "_send"):
            delattr(EventsMixin, "_send")
        EventsMixin._is_async = False

    def test_set_input_function(self) -> None:
        """Test setting the input function."""

        def mock_input(prompt: str) -> str:
            return f"Response to: {prompt}"

        EventsMixin.set_input_function(mock_input)
        assert EventsMixin._input == mock_input

    def test_set_print_function(self) -> None:
        """Test setting the print function."""
        mock_print = Mock()
        EventsMixin.set_print_function(mock_print)
        assert EventsMixin._print == mock_print

    def test_set_send_function(self) -> None:
        """Test setting the send function."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)
        assert EventsMixin._send == mock_send

    def test_set_async(self) -> None:
        """Test setting the async flag."""
        EventsMixin.set_async(True)
        assert EventsMixin._is_async is True

        EventsMixin.set_async(False)
        assert EventsMixin._is_async is False

    def test_do_print(self) -> None:
        """Test do_print method."""
        mock_print = Mock()
        EventsMixin.set_print_function(mock_print)

        EventsMixin.do_print("Hello", "World", sep=" ", end="\n")
        mock_print.assert_called_once_with("Hello", "World", sep=" ", end="\n")

    def test_get_input_function_default_sync(self) -> None:
        """Test getting default sync input function."""
        EventsMixin.set_async(False)
        input_fn = EventsMixin.get_input_function()

        assert input_fn == input_sync

    def test_get_input_function_default_async(self) -> None:
        """Test getting default async input function."""
        EventsMixin.set_async(True)
        input_fn = EventsMixin.get_input_function()

        assert input_fn == input_async

    def test_get_input_function_custom(self) -> None:
        """Test getting custom input function."""
        mock_input = Mock()
        EventsMixin.set_input_function(mock_input)

        input_fn = EventsMixin.get_input_function()
        assert input_fn == mock_input

    def test_get_user_input_sync(self) -> None:
        """Test synchronous user input."""

        def mock_input(prompt: str, password: bool = False) -> str:
            return f"Input for {prompt} (password={password})"

        EventsMixin.set_input_function(mock_input)

        result = EventsMixin.get_user_input("Enter name:", password=False)
        assert result == "Input for Enter name: (password=False)"

        result = EventsMixin.get_user_input("Enter password:", password=True)
        assert result == "Input for Enter password: (password=True)"

    def test_get_user_input_sync_without_password_param(self) -> None:
        """Test sync input with function that doesn't accept password."""

        def simple_input(prompt: str) -> str:
            return f"Simple: {prompt}"

        EventsMixin.set_input_function(simple_input)

        # Should handle TypeError and call without password parameter
        result = EventsMixin.get_user_input("Test prompt", password=True)
        assert result == "Simple: Test prompt"

    def test_get_user_input_with_async_function(self) -> None:
        """Test sync get_user_input with async function."""

        async def async_input(prompt: str, password: bool = False) -> str:
            return f"Async: {prompt} (password={password})"

        EventsMixin.set_input_function(async_input)

        # Should use syncify to convert async to sync
        result = EventsMixin.get_user_input("Test", password=True)
        assert result == "Async: Test (password=True)"

    async def test_a_get_user_input_async(self) -> None:
        """Test async user input."""

        async def async_input(prompt: str, password: bool = False) -> str:
            await asyncio.sleep(0.01)  # Simulate async operation
            return f"Async input: {prompt} (pwd={password})"

        EventsMixin.set_input_function(async_input)

        result = await EventsMixin.a_get_user_input(
            "Enter data:", password=False
        )
        assert result == "Async input: Enter data: (pwd=False)"

    async def test_a_get_user_input_sync_function(self) -> None:
        """Test async get_user_input with sync function."""

        def sync_input(prompt: str, password: bool = False) -> str:
            return f"Sync: {prompt} (password={password})"

        EventsMixin.set_input_function(sync_input)

        result = await EventsMixin.a_get_user_input("Test", password=True)
        assert result == "Sync: Test (password=True)"

    async def test_a_get_user_input_without_password_param(self) -> None:
        """Test async input with function that doesn't accept parameter."""

        async def simple_async_input(prompt: str) -> str:
            return f"Simple async: {prompt}"

        EventsMixin.set_input_function(simple_async_input)

        # Should handle TypeError and call without password parameter
        result = await EventsMixin.a_get_user_input(
            "Test prompt", password=True
        )
        assert result == "Simple async: Test prompt"

    async def test_a_process_event_input_request(self, tmp_path: Path) -> None:
        """Test async processing of input_request event."""

        # Setup
        async def mock_input(prompt: str, password: bool = False) -> str:
            return f"User typed: {prompt}"

        EventsMixin.set_input_function(mock_input)
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        # Create input request event
        content = MockInputContent("Enter value: ", password=False)
        event = MockEvent("input_request", content)

        # Process event
        await EventsMixin.a_process_event(event, [], tmp_path)

        # Verify respond was called with user input
        content.respond.assert_called_once_with("User typed: Enter value: ")
        # Send should not be called for input_request
        mock_send.assert_not_called()

    async def test_a_process_event_input_request_with_password(
        self, tmp_path: Path
    ) -> None:
        """Test async processing of input_request with password."""
        # Mock input that tracks password parameter
        input_calls: list[Any] = []

        async def tracking_input(prompt: str, password: bool = False) -> str:
            input_calls.append((prompt, password))
            return "secret123"

        EventsMixin.set_input_function(tracking_input)

        # Create password input request
        content = MockInputContent("Password: ", password=True)
        event = MockEvent("input_request", content)

        # Process event
        await EventsMixin.a_process_event(event, [], tmp_path)

        # Verify password flag was passed
        assert input_calls == [("Password: ", True)]
        content.respond.assert_called_once_with("secret123")

    async def test_a_process_event_regular_event(self, tmp_path: Path) -> None:
        """Test async processing of regular event."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        event = MockEvent("regular_event", {"data": "test"})

        await EventsMixin.a_process_event(event, [], tmp_path)

        # Regular events should be sent
        mock_send.assert_called_once_with(event)

    async def test_a_process_event_skip_send(self, tmp_path: Path) -> None:
        """Test async processing with skip_send flag."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        event = MockEvent("some_event")

        await EventsMixin.a_process_event(event, [], tmp_path, skip_send=True)

        # Should not send when skip_send is True
        mock_send.assert_not_called()

    def test_process_event_input_request(self, tmp_path: Path) -> None:
        """Test sync processing of input_request event."""

        # Setup
        def mock_input(prompt: str, password: bool = False) -> str:
            return f"Sync input: {prompt}"

        EventsMixin.set_input_function(mock_input)
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        # Create input request event
        content = MockInputContent("Enter data: ", password=False)
        content.respond = content.sync_respond  # Use sync version
        event = MockEvent("input_request", content)

        # Process event
        EventsMixin.process_event(event, [], tmp_path)

        # Verify respond was called
        content.sync_respond.assert_called_once_with("Sync input: Enter data: ")
        mock_send.assert_not_called()

    def test_process_event_regular_event(self, tmp_path: Path) -> None:
        """Test sync processing of regular event."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        event = MockEvent("text_event", {"message": "Hello"})

        EventsMixin.process_event(event, [], tmp_path)

        mock_send.assert_called_once_with(event)

    def test_process_event_skip_send(self, tmp_path: Path) -> None:
        """Test sync processing with skip_send flag."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        event = MockEvent("some_event")

        EventsMixin.process_event(event, [], tmp_path, skip_send=True)

        mock_send.assert_not_called()

    async def test_a_process_event_prompt_fallback(
        self, tmp_path: Path
    ) -> None:
        """Test async event processing with prompt fallback logic."""
        EventsMixin.set_input_function(lambda p: f"Got: {p}")

        # Test with prompt in event
        content = MockInputContent()
        event = MockEvent("input_request", content)
        event.prompt = "Event prompt: "

        await EventsMixin.a_process_event(event, [], tmp_path)
        content.respond.assert_called_with("Got: Event prompt: ")

        # Test with prompt in content only
        content2 = MockInputContent("Content prompt: ")
        event2 = MockEvent("input_request", content2)

        await EventsMixin.a_process_event(event2, [], tmp_path)
        content2.respond.assert_called_with("Got: Content prompt: ")

    def test_process_event_password_fallback(self, tmp_path: Path) -> None:
        """Test sync event processing with password fallback logic."""
        # Track password parameter
        calls: list[Any] = []

        def tracking_input(prompt: str, password: bool = False) -> str:
            calls.append((prompt, password))
            return "response"

        EventsMixin.set_input_function(tracking_input)

        # Test with password in event
        content = MockInputContent()
        content.respond = content.sync_respond
        event = MockEvent("input_request", content)
        event.password = True
        event.prompt = "pwd: "

        EventsMixin.process_event(event, [], tmp_path)
        assert calls == [("pwd: ", True)]

        # Test with password in content only
        calls.clear()
        content2 = MockInputContent("prompt", password=True)
        content2.respond = content2.sync_respond
        event2 = MockEvent("input_request", content2)

        EventsMixin.process_event(event2, [], tmp_path)
        assert calls == [("prompt", True)]

    async def test_a_get_user_input_with_kwargs(self) -> None:
        """Test async get_user_input with additional kwargs."""

        async def custom_input(
            prompt: str, password: bool = False, timeout: int = 30
        ) -> str:
            return f"{prompt} (timeout={timeout})"

        EventsMixin.set_input_function(custom_input)

        result = await EventsMixin.a_get_user_input(
            "Test", password=False, timeout=60
        )
        assert result == "Test (timeout=60)"

    def test_get_user_input_with_kwargs(self) -> None:
        """Test sync get_user_input with additional kwargs."""

        def custom_input(
            prompt: str, password: bool = False, echo: bool = True
        ) -> str:
            return f"{prompt} (echo={echo})"

        EventsMixin.set_input_function(custom_input)

        result = EventsMixin.get_user_input("Test", password=False, echo=False)
        assert result == "Test (echo=False)"

    async def test_concurrent_event_processing(self, tmp_path: Path) -> None:
        """Test concurrent async event processing."""
        EventsMixin.set_input_function(lambda p: f"Response: {p}")
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        # Create multiple events
        events: list[Any] = []
        for i in range(5):
            if i % 2 == 0:
                content = MockInputContent(f"Prompt {i}")
                events.append(MockEvent("input_request", content))
            else:
                events.append(MockEvent(f"event_{i}"))

        # Process concurrently
        tasks = [
            EventsMixin.a_process_event(event, [], tmp_path) for event in events
        ]
        await asyncio.gather(*tasks)

        # Verify input requests were processed
        assert events[0].content.respond.call_count == 1
        assert events[2].content.respond.call_count == 1
        assert events[4].content.respond.call_count == 1

        # Verify regular events were sent
        assert mock_send.call_count == 2  # events 1 and 3

    @patch("waldiez.running.events_mixin.is_async_callable")
    async def test_a_get_user_input_callable_detection(
        self, mock_is_async: Any
    ) -> None:
        """Test async user input with callable detection."""
        # Test with detected async function
        mock_is_async.return_value = True
        async_fn = AsyncMock(return_value="async result")
        EventsMixin.set_input_function(async_fn)

        result = await EventsMixin.a_get_user_input("Test")
        assert result == "async result"
        async_fn.assert_called_once()

        # Test with detected sync function
        mock_is_async.return_value = False
        sync_fn = Mock(return_value="sync result")
        EventsMixin.set_input_function(sync_fn)

        result = await EventsMixin.a_get_user_input("Test")
        assert result == "sync result"
        sync_fn.assert_called_once()

    def test_agents_parameter_unused(self, tmp_path: Path) -> None:
        """Test that agents parameter is properly ignored."""
        mock_send = Mock()
        EventsMixin.set_send_function(mock_send)

        event = MockEvent("test_event")
        mock_agents = [Mock(), Mock()]  # Mock agents

        # Should work the same with or without agents
        EventsMixin.process_event(event, mock_agents, tmp_path)
        EventsMixin.process_event(event, [], tmp_path)

        assert mock_send.call_count == 2
