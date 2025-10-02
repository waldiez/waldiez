# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught
# pyright: reportUnknownVariableType=false,reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false

"""Waldiez run results module."""

import json
from pathlib import Path
from typing import Any, TypedDict

import aiofiles


class WaldiezRunResults(TypedDict):
    """Results of the Waldiez run."""

    results: list[dict[str, Any]]
    exception: BaseException | None
    completed: bool


class ResultsMixin:
    """Results related static methods."""

    @staticmethod
    def ensure_results_json(
        output_dir: Path,
        results: list[dict[str, Any]],
    ) -> None:
        """Ensure results.json exists in the output.

        Parameters
        ----------
        output_dir : Path
            The directory with the outputs.
        results : list[dict[str, Any]]
            The returned results.
        """
        from_json = _get_results_from_json(output_dir)
        if from_json:
            _store_full_results(output_dir)
            return
        _remove_results_json(output_dir)
        results_json = output_dir / "results.json"
        try:
            with open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                file.write(json.dumps({"results": results}))
        except BaseException:
            return
        _store_full_results(output_dir)

    @staticmethod
    def get_results(
        results: list[dict[str, Any]],
        output_dir: Path,
    ) -> list[dict[str, Any]]:
        """Gather the results.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The returned results from the module call.
        output_dir : Path
            The output directory to look for results.json

        Returns
        -------
        list[dict[str, Any]]
            The final results.
        """
        if (output_dir / "results.json").exists():
            return ResultsMixin.read_from_output(output_dir)
        return results

    @staticmethod
    async def a_get_results(
        results: list[dict[str, Any]],
        output_dir: Path,
    ) -> list[dict[str, Any]]:
        """Gather the results.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The returned results from the module call.
        output_dir : Path
            The output directory to look for results.json

        Returns
        -------
        list[dict[str, Any]]
            The final results.
        """
        if (output_dir / "results.json").exists():
            return await ResultsMixin.a_read_from_output(output_dir)
        return results

    @staticmethod
    async def a_read_from_output(
        output_dir: Path,
    ) -> list[dict[str, Any]]:
        """Read from output dir results.json or error.json.

        Parameters
        ----------
        output_dir : Path
            The output directory to check for results.json or error.json

        Return
        ------
        list[dict[str, Any]]
            The parsed results.
        """
        # pylint: disable=broad-exception-caught,too-many-try-statements
        error_json = output_dir / "error.json"
        results_json = output_dir / "results.json"
        try:
            if results_json.is_file():
                async with aiofiles.open(
                    results_json, "r", encoding="utf-8"
                ) as file:
                    results = await file.read()
                    return json.loads(results).get("results", [])
            if error_json.is_file():
                async with aiofiles.open(
                    error_json, "r", encoding="utf-8"
                ) as file:
                    results = await file.read()
                    reason = json.loads(results).get("error", "Flow failed")
                    return [{"error": reason}]
        except BaseException as e:
            return [{"error": str(e)}]
        return [{"error": "Could not gather result details."}]

    @staticmethod
    def read_from_output(
        output_dir: Path,
    ) -> list[dict[str, Any]]:
        """Read from output dir results.json or error.json.

        Parameters
        ----------
        output_dir : Path
            The output directory to check for results.json or error.json

        Return
        ------
        list[dict[str, Any]]
            The parsed results.
        """
        # pylint: disable=broad-exception-caught,too-many-try-statements
        error_json = output_dir / "error.json"
        results_json = output_dir / "results.json"
        try:
            if results_json.is_file():
                with open(results_json, "r", encoding="utf-8") as file:
                    results = file.read()
                    return json.loads(results).get("results", [])
            if error_json.is_file():
                with open(error_json, "r", encoding="utf-8") as file:
                    results = file.read()
                    reason = json.loads(results).get("error", "Flow failed")
                    return [{"error": reason}]
        except BaseException as e:
            return [{"error": str(e)}]
        return [{"error": "Could not gather result details."}]


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

        # Check in executed_function events
        if event_type == "executed_function":
            content = content_data.get("content", {})
            context_vars = content.get("context_variables", {})
            if context_vars and "data" in context_vars:
                return context_vars["data"]

        # Check in run_completion events
        if event_type == "run_completion":
            if "context_variables" in content_data:
                return content_data["context_variables"]

    return None


def _extract_last_speaker(events: list[dict[str, Any]]) -> str | None:
    """Extract the last speaker from run_completion or last text event."""
    # Look for run_completion events
    for event in reversed(events):
        event_type = event.get("type")
        content_data = event.get("content", {})

        if event_type == "run_completion":
            if "last_speaker" in content_data:
                return content_data["last_speaker"]
            # Or get from history
            if "history" in content_data:
                history = content_data["history"]
                if history and len(history) > 0:
                    last_msg = history[-1]
                    if isinstance(last_msg, dict) and "name" in last_msg:
                        return str(last_msg["name"])  # pyright: ignore

    # Fallback: get last text event sender
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

        # Handle text events
        if event_type == "text":
            content = content_data.get("content", "")
            sender = content_data.get("sender", "")
            # recipient = content_data.get("recipient", "")

            # Skip handoff messages and empty content
            if content.startswith("[Handing off"):
                continue
            if not content or content == "None":
                continue

            # Create unique key to avoid duplicates
            msg_key = f"{sender}:{content[:50]}"
            if msg_key in seen_messages:
                continue
            seen_messages.add(msg_key)

            # Determine role
            role = "user" if sender == "user" else "assistant"

            messages.append({"content": content, "role": role, "name": sender})

    return messages


def _extract_summary_from_events(events: list[dict[str, Any]]) -> str | None:
    """Extract summary from the last meaningful event.

    Looks for "run_completion" events or the last assistant message.
    """
    # Look for run_completion events
    for event in reversed(events):
        event_type = event.get("type")

        if event_type == "run_completion":
            content_data = event.get("content", {})
            # The summary might be in the content or history
            if "summary" in content_data:
                return content_data["summary"]
            if "history" in content_data:
                history = content_data["history"]
                if history and len(history) > 0:
                    last_msg = history[-1]
                    if isinstance(last_msg, dict) and "content" in last_msg:
                        return last_msg["content"]

    # Fallback: get last text message
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


def _get_results_from_json(output_dir: Path) -> list[dict[str, Any]]:
    """Get the results dumped in results.json if any."""
    results_json = output_dir / "results.json"
    if not results_json.is_file():
        return []
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


def _remove_results_json(output_dir: Path) -> None:
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            results_json.unlink(missing_ok=True)
        except BaseException:
            pass


def _fill_results_from_logs(run_dir: Path) -> dict[str, list[dict[str, Any]]]:
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
    chat_completions_path = logs_path / "chat_completions.json"

    # Load results.json
    with open(results_path, "r", encoding="utf-8") as f:
        results_data = json.load(f)

    # Load chat_completions for cost data
    chat_completions = []
    if chat_completions_path.exists():
        with open(chat_completions_path, "r", encoding="utf-8") as f:
            chat_completions = json.load(f)

    # Process each result
    for result in results_data.get("results", []):
        events = result.get("events", [])

        # Fill messages if empty
        if not result.get("messages"):
            result["messages"] = _extract_messages_from_events(events)

        # Fill summary if empty
        if not result.get("summary"):
            result["summary"] = _extract_summary_from_events(events)

        # Fill cost if empty/null
        if result.get("cost") is None:
            result["cost"] = _calculate_total_cost(chat_completions)

        # Fill context_variables if empty/null
        if result.get("context_variables") is None:
            result["context_variables"] = _extract_last_context_variables(
                events
            )

        # Fill last_speaker if empty/null
        if result.get("last_speaker") is None:
            result["last_speaker"] = _extract_last_speaker(events)

    return results_data


def _store_full_results(
    output_dir: Path,
) -> None:
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            filled = _fill_results_from_logs(output_dir)
            with open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                file.write(json.dumps(filled))
        except BaseException:
            pass
