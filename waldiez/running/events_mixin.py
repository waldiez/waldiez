# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportUnknownArgumentType=false, reportMissingTypeStubs=false
# pyright: reportDeprecated=false, reportUninitializedInstanceVariable=false
# pyright: reportGeneralTypeIssues=false, reportUnknownVariableType=false
# pyright: reportUnusedParameter=false
"""Workflow events mixin."""

import inspect
import json
from collections.abc import Coroutine
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Optional, Union

import aiofiles

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
