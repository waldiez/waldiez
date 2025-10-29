# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false, reportMissingTypeStubs=false
# pyright: reportDeprecated=false, reportUninitializedInstanceVariable=false
# pyright: reportGeneralTypeIssues=false, reportUnknownVariableType=false
# pyright: reportUnusedParameter=false,reportUnnecessaryIsInstance=false
# pyright: reportUnreachable=false

"""Workflow events mixin."""

import inspect
import json
from collections.abc import Coroutine
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Optional, Union

import aiofiles

from waldiez.storage import WaldiezCheckpoint
from waldiez.storage.storage_manager import StorageManager

from .async_utils import is_async_callable, syncify
from .io_utils import input_async, input_sync

if TYPE_CHECKING:
    from autogen.agentchat import ConversableAgent  # type: ignore
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


class EventsMixin:
    """Event processing mixin."""

    _input: Callable[..., str] | Callable[..., Coroutine[Any, Any, str]]
    _print: Callable[..., None]
    _send: Union[Callable[["BaseMessage"], None], Callable[["BaseEvent"], None]]
    _is_async: bool

    @staticmethod
    def set_input_function(
        input_fn: Callable[..., str] | Callable[..., Coroutine[Any, Any, str]],
    ) -> None:
        """Set the input function.

        Parameters
        ----------
        input_fn: Callable[..., str] | Callable[..., Coroutine[Any, Any, str]],
            The function that handles input.
        """
        EventsMixin._input = input_fn

    @staticmethod
    def set_print_function(print_fn: Callable[..., None]) -> None:
        """Set the print function.

        Parameters
        ----------
        print_fn: Callable[..., None]
            The function that handles printing messages.
        """
        EventsMixin._print = print_fn

    @staticmethod
    def set_send_function(
        send_fn: Union[
            Callable[["BaseMessage"], None], Callable[["BaseEvent"], None]
        ],
    ) -> None:
        """Set the send function.

        Parameters
        ----------
        send_fn: Callable[[Union["BaseEvent", "BaseMessage"]], None],
            The function to use for sending events and messages.
        """
        EventsMixin._send = send_fn

    @staticmethod
    def set_async(value: bool) -> None:
        """Set the _is_async flag.

        Parameters
        ----------
        value : bool
            The value to set.
        """
        EventsMixin._is_async = value

    @staticmethod
    def do_print(*args: Any, **kwargs: Any) -> None:
        """Print a message to the output stream.

        Parameters
        ----------
        *args : Any
            Positional arguments to print.
        **kwargs : Any
            Keyword arguments to print.
        """
        EventsMixin._print(*args, **kwargs)

    @staticmethod
    def get_input_function() -> (
        Callable[..., str] | Callable[..., Coroutine[Any, Any, str]]
    ):
        """Get the input function for user interaction.

        Returns
        -------
        Callable[[str, bool], str]
            A function that takes a prompt and a password flag,
            returning user input.
        """
        if hasattr(EventsMixin, "_input") and callable(EventsMixin._input):
            return EventsMixin._input
        if EventsMixin._is_async:
            return input_async
        return input_sync

    @staticmethod
    async def a_get_user_input(
        prompt: str, *, password: bool = False, **kwargs: Any
    ) -> str:
        """Get user input with an optional password prompt.

        Parameters
        ----------
        prompt : str
            The prompt to display to the user.
        password : bool, optional
            If True, the input will be hidden (default is False).
        **kwargs : Any
            Additional keyword arguments to pass to the input function.

        Returns
        -------
        str
            The user input.
        """
        input_function = EventsMixin.get_input_function()
        if is_async_callable(input_function):
            try:
                result = await input_function(  # type: ignore
                    prompt,
                    password=password,
                    **kwargs,
                )
            except TypeError:
                result = await input_function(prompt)  # type: ignore
        else:
            try:
                result = input_function(prompt, password=password, **kwargs)
            except TypeError:
                result = input_function(prompt)
        return result  # pyright: ignore[reportReturnType]

    @staticmethod
    def get_user_input(
        prompt: str,
        *,
        password: bool = False,
        **kwargs: Any,
    ) -> str:
        """Get user input with an optional password prompt.

        Parameters
        ----------
        prompt : str
            The prompt to display to the user.
        password : bool, optional
            If True, the input will be hidden (default is False).
        **kwargs : Any
            Additional keyword arguments to pass to the input function.

        Returns
        -------
        str
            The user input.
        """
        input_function = EventsMixin.get_input_function()
        if inspect.iscoroutinefunction(input_function):
            try:
                return syncify(input_function)(
                    prompt, password=password, **kwargs
                )
            except TypeError:
                return syncify(input_function)(prompt)
        try:
            return str(input_function(prompt, password=password, **kwargs))
        except TypeError:
            return str(input_function(prompt))

    @staticmethod
    async def a_save_state(
        manager: "ConversableAgent", output_dir: Path
    ) -> None:
        """Save the current state.

        Parameters
        ----------
        manager : ConversableAgent
            The group chat manager
        output_dir : Path
            The output directory to save the state.
        """
        group_chat = getattr(manager, "_groupchat", None)
        state: dict[str, Any] = {"messages": [], "context_variables": {}}
        if group_chat:
            messages = getattr(group_chat, "messages", [])
            if isinstance(messages, list):
                state["messages"] = messages
        context_variables: dict[str, Any] = {}
        for key, value in manager.context_variables.items():
            context_variables[key] = value
        state["context_variables"] = context_variables
        if state["context_variables"] or state["messages"]:
            async with aiofiles.open(
                output_dir / "state.json", "w", encoding="utf-8"
            ) as f:
                await f.write(json.dumps(state, default=str, indent=2))

    @staticmethod
    async def a_save_metadata(
        manager: "ConversableAgent", output_dir: Path
    ) -> None:
        """Save metadata.

        Parameters
        ----------
        manager : ConversableAgent
            The group chat manager
        output_dir : Path
            The output directory to save the state.
        """
        metadata_dict = {
            "type": "group",
            "group": {
                "manager": getattr(manager, "_name", manager.name),
                "pattern": "",
            },
        }
        async with aiofiles.open(
            output_dir / "metadata.json", "w", encoding="utf-8"
        ) as f:
            await f.write(json.dumps(metadata_dict, default=str, indent=2))

    @staticmethod
    async def a_save_history(output_dir: Path) -> None:
        """Append the current state and metadata to history.json (async).

        Reads the latest `state.json` and `metadata.json` (if present) and
        appends them to a list in `history.json`. Each entry includes a UTC
        ISO timestamp. Missing or malformed files are handled gracefully.

        Parameters
        ----------
        output_dir : Path
            The output directory where the files are stored.
        """
        state_file = output_dir / "state.json"
        metadata_file = output_dir / "metadata.json"
        history_file = output_dir / "history.json"

        # If either state or metadata is missing, there's nothing to record.
        if not state_file.exists() or not metadata_file.exists():
            return

        async def _read_json(path: Path) -> dict[str, Any] | list[Any] | None:
            # pylint: disable=broad-exception-caught
            try:
                async with aiofiles.open(path, "r", encoding="utf-8") as f:
                    text = await f.read()
                return json.loads(text)
            except Exception:
                return None

        state_data = await _read_json(state_file)
        metadata_data = await _read_json(metadata_file)

        if state_data is None or metadata_data is None:
            # If either is unreadable, skip appending
            return

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "state": state_data,
            "metadata": metadata_data,
        }

        # Load existing history (if present)
        history: list[dict[str, Any]] = []
        if history_file.exists():
            existing = await _read_json(history_file)
            if isinstance(existing, list):
                history = existing
            elif existing is not None:
                # If someone wrote a non-list, wrap it to preserve data
                history = [existing]

        history.append(entry)

        # Write back updated history
        async with aiofiles.open(history_file, "w", encoding="utf-8") as f:
            await f.write(json.dumps(history, default=str, indent=2))

    @staticmethod
    async def a_process_event(
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
        output_dir: Path,
        skip_send: bool = False,
    ) -> None:
        """Process an event or message asynchronously.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event or message to process.
        agents : list["ConversableAgent"]
            The known agents in the flow.
        output_dir : Path
            The output directory to save the state.
        skip_send : bool
            Skip sending the event.
        """
        group_manager = EventsMixin._find_group_manager(agents)
        if group_manager:
            await EventsMixin.a_save_state(group_manager, output_dir=output_dir)
            await EventsMixin.a_save_metadata(
                group_manager, output_dir=output_dir
            )
            await EventsMixin.a_save_history(output_dir=output_dir)
        if hasattr(event, "type"):  # pragma: no branch
            if getattr(event, "type", "") == "input_request":
                prompt = getattr(
                    event, "prompt", getattr(event.content, "prompt", "> ")
                )
                password = getattr(
                    event,
                    "password",
                    getattr(event.content, "password", False),
                )
                user_input = await EventsMixin.a_get_user_input(
                    prompt, password=password
                )
                await event.content.respond(user_input)
            elif not skip_send:
                EventsMixin._send(event)  # pyright: ignore[reportArgumentType]

    @staticmethod
    def save_state(manager: "ConversableAgent", output_dir: Path) -> None:
        """Save the current state.

        Parameters
        ----------
        manager : ConversableAgent
            The group chat manager
        output_dir : Path
            The output directory to save the state.
        """
        group_chat = getattr(manager, "_groupchat", None)
        state: dict[str, Any] = {"messages": [], "context_variables": {}}
        if group_chat:
            messages = getattr(group_chat, "messages", [])
            if isinstance(messages, list):
                state["messages"] = messages
        context_variables: dict[str, Any] = {}
        for key, value in manager.context_variables.items():
            context_variables[key] = value
        state["context_variables"] = context_variables
        if state["context_variables"] or state["messages"]:
            with open(output_dir / "state.json", "w", encoding="utf-8") as f:
                f.write(json.dumps(state, default=str, indent=2))

    @staticmethod
    def save_metadata(manager: "ConversableAgent", output_dir: Path) -> None:
        """Save metadata.

        Parameters
        ----------
        manager : ConversableAgent
            The group chat manager
        output_dir : Path
            The output directory to save the state.
        """
        metadata_dict = {
            "type": "group",
            "group": {
                "manager": getattr(manager, "_name", manager.name),
                "pattern": "",
            },
        }
        with open(output_dir / "metadata.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(metadata_dict, default=str, indent=2))

    @staticmethod
    def save_history(output_dir: Path) -> None:
        """Append the current state and metadata to history.json.

        Reads the latest `state.json` and `metadata.json` (if present) and
        appends them to a list in `history.json`. Each entry includes a UTC
        ISO timestamp.

        Parameters
        ----------
        output_dir : Path
            The output directory where the files are stored.
        """
        state_file = output_dir / "state.json"
        metadata_file = output_dir / "metadata.json"
        history_file = output_dir / "history.json"
        # pylint: disable=broad-exception-caught
        state = StorageManager.load_dict(state_file)
        metadata = StorageManager.load_dict(metadata_file)
        if not state:  # pragma: no cover
            return
        history = StorageManager.load_list(history_file, "history")
        # Compose the new history entry
        entry = {
            "timestamp": WaldiezCheckpoint.format_timestamp(
                datetime.now(timezone.utc)
            ),
            "state": state,
        }
        # Append new entry and write back
        history.append(entry)
        with open(history_file, "w", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {"history": history, "metadata": metadata},
                    default=str,
                    indent=2,
                )
            )

    @staticmethod
    def process_event(
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
        output_dir: Path,
        skip_send: bool = False,
    ) -> None:
        """Process an event or message synchronously.

        Parameters
        ----------
        event : Union[BaseEvent, BaseMessage]
            The event or message to process.
        agents : list["ConversableAgent"]
            The known agents in the flow.
        output_dir : Path
            The output directory to save the state.
        skip_send : bool
            Skip sending the event.
        """
        group_manager = EventsMixin._find_group_manager(agents)
        if group_manager:
            EventsMixin.save_state(group_manager, output_dir=output_dir)
            EventsMixin.save_metadata(group_manager, output_dir=output_dir)
            EventsMixin.save_history(output_dir=output_dir)
        if hasattr(event, "type"):  # pragma: no branch
            if event.type == "input_request":
                prompt = getattr(
                    event, "prompt", getattr(event.content, "prompt", "> ")
                )
                password = getattr(
                    event,
                    "password",
                    getattr(event.content, "password", False),
                )
                user_input = EventsMixin.get_user_input(
                    prompt, password=password
                )
                event.content.respond(user_input)
            elif not skip_send:
                EventsMixin._send(event)  # pyright: ignore[reportArgumentType]

    @staticmethod
    def _find_group_manager(
        agents: list["ConversableAgent"],
    ) -> Optional["ConversableAgent"]:
        for agent in agents:
            manager = getattr(agent, "_group_manager", None)
            if not manager:
                continue

            groupchat = getattr(manager, "_groupchat", None)
            if groupchat is None:
                continue

            cls_name = (
                groupchat.__name__
                if inspect.isclass(groupchat)
                else getattr(groupchat.__class__, "__name__", None)
            )

            if cls_name == "GroupChat":
                return manager

        return None
