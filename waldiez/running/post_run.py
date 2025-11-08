# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,too-many-try-statements,unused-argument
# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false, reportUnusedParameter=false

"""Extra post-processing utils."""

import json
from pathlib import Path
from typing import Any

import aiofiles


# noinspection PyBroadException
def get_results_from_json(output_dir: Path) -> list[dict[str, Any]]:
    """Get the results dumped in results.json if any.

    Parameters
    ----------
    output_dir : Path
        The path to search for 'results.json'

    Returns
    -------
    list[dict[str, Any]]
        The loaded results.
    """
    results_json = output_dir / "results.json"
    if not results_json.is_file():
        return []
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        with open(results_json, "r", encoding="utf-8") as file:
            data = json.loads(file.read())
    except BaseException:
        return []
    if isinstance(data, dict):
        results = data.get("results", [])
    elif isinstance(data, list):
        results = data
    else:
        return []
    if _results_are_empty(results):
        return []
    return results


# noinspection PyBroadException
async def a_get_results_from_json(output_dir: Path) -> list[dict[str, Any]]:
    """Get the results dumped in results.json if any.

    Parameters
    ----------
    output_dir : Path
        The path to search for 'results.json'

    Returns
    -------
    list[dict[str, Any]]
        The loaded results.
    """
    results_json = output_dir / "results.json"
    if not results_json.is_file():
        return []
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        async with aiofiles.open(results_json, "r", encoding="utf-8") as file:
            file_data = await file.read()
            data = json.loads(file_data)
    except BaseException:
        return []
    if isinstance(data, dict):
        results = data.get("results", [])
    elif isinstance(data, list):
        results = data
    else:
        return []
    if _results_are_empty(results):
        return []
    return results


# noinspection PyBroadException
def remove_results_json(output_dir: Path) -> None:
    """Remove results.json if exists.

    Parameters
    ----------
    output_dir : Path
        The path to search for 'results.json'
    """
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            results_json.unlink(missing_ok=True)
        except BaseException:
            pass


def fill_results_from_logs(run_dir: Path) -> dict[str, list[dict[str, Any]]]:
    """Fill missing fields in results.json from log files.

    For each result entry:
    - If no messages: get from events array by parsing msgs from chat history
    - If no summary: get from last "run_completion" event
    - If no cost: get from logs/chat_completions.json
    - If no context_variables: get from LAST event that has context_variables
    - If no last_speaker: get from "run_completion" event

    Parameters
    ----------
    run_dir : Path
        Path to the run directory

    Returns
    -------
    dict[str, list[dict[str, Any]]]
        Updated results dictionary with filled fields
    """
    run_path = Path(run_dir)
    results_path = run_path / "results.json"
    logs_path = run_path / "logs"
    logs_path.mkdir(parents=True, exist_ok=True)
    chat_completions_path = logs_path / "chat_completions.json"
    with open(results_path, "r", encoding="utf-8") as f:
        results_data = json.load(f)

    chat_completions = []
    if chat_completions_path.exists():
        with open(chat_completions_path, "r", encoding="utf-8") as f:
            chat_completions = json.load(f)

    for result in results_data.get("results", []):
        events = result.get("events", [])

        if not result.get("messages"):
            result["messages"] = _extract_messages_from_events(events)

        if not result.get("summary"):
            result["summary"] = _extract_summary_from_events(events)

        if result.get("cost") is None:
            result["cost"] = _calculate_total_cost(chat_completions)

        if result.get("context_variables") is None:
            result["context_variables"] = _extract_last_context_variables(
                events
            )

        if result.get("last_speaker") is None:
            result["last_speaker"] = _extract_last_speaker(events)

    return results_data


def ensure_error_json(output_dir: Path, error: BaseException) -> None:
    """Ensure error.json exists in the output directory.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    error : BaseException
        The error to store.
    """
    existing = output_dir / "error.json"
    if not existing.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(existing, "w", encoding="utf-8", newline="\n") as file:
            file.write(
                json.dumps({"error": str(error) or "Execution interrupted"})
            )
    remove_results_json(output_dir)


async def a_ensure_error_json(output_dir: Path, error: BaseException) -> None:
    """Ensure error.json exists in the output directory.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    error : BaseException
        The error to store.
    """
    existing = output_dir / "error.json"
    if not existing.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(
            existing, "w", encoding="utf-8", newline="\n"
        ) as file:
            await file.write(
                json.dumps({"error": str(error) or "Execution interrupted"})
            )
    remove_results_json(output_dir)


# noinspection PyBroadException
def store_full_results(
    output_dir: Path,
) -> None:
    """Store the flow's results to output dir.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            with open(
                results_json, "r", encoding="utf-8", newline="\n"
            ) as file:
                results_data = json.loads(file.read())
                results_list = results_data.get("results", [])
        except BaseException as error:
            ensure_error_json(output_dir, error)
            return
        if not isinstance(results_list, list) or not results_list:
            ensure_error_json(output_dir, RuntimeError("No results generated"))
            return
        try:
            filled = fill_results_from_logs(output_dir)
            with open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                file.write(json.dumps(filled))
        except BaseException:
            pass


# noinspection PyBroadException
async def a_store_full_results(
    output_dir: Path,
) -> None:
    """Store the flow's results to output dir.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            async with aiofiles.open(
                results_json, "r", encoding="utf-8", newline="\n"
            ) as file:
                file_data = await file.read()
                results_data = json.loads(file_data)
                results_list = results_data.get("results", [])
        except BaseException as error:
            await a_ensure_error_json(output_dir, error)
            return
        if not isinstance(results_list, list) or not results_list:
            await a_ensure_error_json(
                output_dir, RuntimeError("No results generated")
            )
            return
        try:
            filled = fill_results_from_logs(output_dir)
            async with aiofiles.open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                await file.write(json.dumps(filled))
        except BaseException:
            pass


def _calculate_total_cost(
    chat_completions: list[dict[str, Any]],
) -> float | None:
    """Calculate total cost from all chat completions."""
    total_cost = 0.0

    for completion in chat_completions:
        cost = completion.get("cost")
        if cost is not None:
            total_cost += cost

    return total_cost if total_cost > 0 else None


def _extract_last_context_variables(
    events: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """Extract context_variables from the last event that contains them."""
    for event in reversed(events):
        event_type = event.get("type")
        content_data = event.get("content", {})
        if event_type == "executed_function":
            content = content_data.get("content", {})
            context_vars = content.get("context_variables", {})
            if context_vars and "data" in context_vars:
                return context_vars["data"]

        if event_type == "run_completion":
            if "context_variables" in content_data:
                return content_data["context_variables"]

    return None


def _extract_last_speaker(events: list[dict[str, Any]]) -> str | None:
    """Extract the last speaker from run_completion or last text event."""
    for event in reversed(events):
        event_type = event.get("type")
        content_data = event.get("content", {})

        if event_type == "run_completion":
            if "last_speaker" in content_data:
                return content_data["last_speaker"]
            if "history" in content_data:
                history = content_data["history"]
                if history and len(history) > 0:
                    last_msg = history[-1]
                    if isinstance(last_msg, dict) and "name" in last_msg:
                        return str(last_msg["name"])

    for event in reversed(events):
        if event.get("type") == "text":
            content_data = event.get("content", {})
            sender = content_data.get("sender", "")
            if sender and sender != "manager":
                return sender

    return None


def _extract_messages_from_events(
    events: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Extract conversation messages from events array.

    Looks for events with type 'text' or LLM responses
    and builds a message list.
    """
    messages = []
    seen_messages = set()

    for event in events:
        event_type = event.get("type")
        content_data = event.get("content", {})

        if event_type == "text":
            content = content_data.get("content", "")
            sender = content_data.get("sender", "")

            if content.startswith("[Handing off"):
                continue
            if not content or content == "None":
                continue

            msg_key = f"{sender}:{content[:50]}"
            if msg_key in seen_messages:
                continue
            seen_messages.add(msg_key)

            role = "user" if sender == "user" else "assistant"

            messages.append({"content": content, "role": role, "name": sender})

    return messages


def _extract_summary_from_events(events: list[dict[str, Any]]) -> str | None:
    """Extract summary from the last meaningful event.

    Looks for "run_completion" events or the last assistant message.
    """
    for event in reversed(events):
        event_type = event.get("type")

        if event_type == "run_completion":
            content_data = event.get("content", {})
            if "summary" in content_data:
                return content_data["summary"]
            if "history" in content_data:
                history = content_data["history"]
                if history and len(history) > 0:
                    last_msg = history[-1]
                    if isinstance(last_msg, dict) and "content" in last_msg:
                        return last_msg["content"]

    for event in reversed(events):
        if event.get("type") == "text":
            content_data = event.get("content", {})
            content = content_data.get("content", "")
            if (
                content
                and not content.startswith("[Handing off")
                and content != "None"
            ):
                return content

    return None


def _results_are_empty(results: Any) -> bool:
    """Check if the results are empty or not."""
    to_check = results if isinstance(results, list) else [results]
    for item in to_check:
        if not isinstance(item, dict):
            return True
        events = item.get("events", [])
        if isinstance(events, list) and len(events) > 0:
            return False
        messages = item.get("messages", [])
        if isinstance(messages, list) and len(messages) > 0:
            return False
    return True
