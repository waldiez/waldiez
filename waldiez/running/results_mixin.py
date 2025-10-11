# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,too-many-try-statements,unused-argument
# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false, reportUnusedParameter=false

"""Waldiez run results module."""

import csv
import datetime
import json
import shutil
import sqlite3
from pathlib import Path
from typing import Any, TypedDict

import aiofiles
import anyio.to_thread

from .gen_seq_diagram import generate_sequence_diagram
from .io_utils import get_printer
from .timeline_processor import TimelineProcessor


class WaldiezRunResults(TypedDict):
    """Results of the Waldiez run."""

    results: list[dict[str, Any]]
    exception: BaseException | None
    completed: bool


class ResultsMixin:
    """Results related static methods."""

    # noinspection PyUnusedLocal
    @staticmethod
    def post_run(
        results: list[dict[str, Any]],
        error: BaseException | None,
        temp_dir: Path,
        output_file: str | Path | None,
        flow_name: str,
        waldiez_file: Path,
        uploads_root: Path | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
    ) -> Path | None:
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The results of the flow run.
        error : BaseException | None
            Optional error during the run.
        temp_dir : Path
            The temporary directory.
        output_file : str | Path | None, optional
            The output file.
        flow_name : str
            The flow name.
        waldiez_file : Path
            The path of the waldiez file used (or dumped) for the run.
        uploads_root : Path | None, optional
            The runtime uploads root, by default None
        skip_mmd : bool, optional
            Whether to skip the mermaid sequence diagram generation,
            by default, False
        skip_timeline : bool, optional
            Whether to skip the timeline processing, by default False

        Returns
        -------
        Path | None
            The destination directory if output file, else None
        """
        if isinstance(output_file, str):
            output_file = Path(output_file)
        mmd_dir = output_file.parent if output_file else Path.cwd()
        ResultsMixin.ensure_db_outputs(temp_dir)
        if error is not None:
            ResultsMixin.ensure_error_json(temp_dir, error)
        else:
            ResultsMixin.ensure_results_json(temp_dir, results)
        if skip_mmd is False:
            _make_mermaid_diagram(
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=flow_name,
                mmd_dir=mmd_dir,
            )
        if skip_timeline is False:  # pragma: no branch
            _make_timeline_json(temp_dir)
        if output_file:
            destination_dir = output_file.parent
            destination_dir = (
                destination_dir
                / "waldiez_out"
                / datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            )
            destination_dir.mkdir(parents=True, exist_ok=True)
            # copy the contents of the temp dir to the destination dir
            print(f"Copying the results to {destination_dir}")
            _copy_results(
                temp_dir=temp_dir,
                output_file=output_file,
                destination_dir=destination_dir,
            )
            dst_waldiez = destination_dir / waldiez_file.name
            if not dst_waldiez.exists() and waldiez_file.is_file():
                shutil.copyfile(waldiez_file, dst_waldiez)
            return destination_dir
        shutil.rmtree(temp_dir)
        return None

    @staticmethod
    async def a_post_run(
        results: list[dict[str, Any]],
        error: BaseException | None,
        temp_dir: Path,
        output_file: str | Path | None,
        flow_name: str,
        waldiez_file: Path,
        uploads_root: Path | None = None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
    ) -> Path | None:
        """Actions to perform after running the flow.

        Parameters
        ----------
        results : list[dict[str, Any]]
            The results of the flow run.
        error : BaseException | None
            Optional error during the run.
        temp_dir : Path
            The temporary directory.
        output_file : output_file : str | Path | None, optional
            The output file.
        flow_name : str
            The flow name.
        waldiez_file : Path
            The path of the waldiez file used (or dumped) for the run.
        uploads_root :  Path | None, optional
            The runtime uploads root, by default None
        skip_mmd : bool, optional
            Whether to skip the mermaid sequence diagram generation,
            by default, False
        skip_timeline : bool, optional
            Whether to skip the timeline processing, by default False

        Returns
        -------
        Path | None
            The destination directory if output file, else None
        """
        return await anyio.to_thread.run_sync(
            ResultsMixin.post_run,
            results,
            error,
            temp_dir,
            output_file,
            flow_name,
            waldiez_file,
            uploads_root,
            skip_mmd,
            skip_timeline,
        )

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
    async def a_ensure_results_json(
        output_dir: Path, results: list[dict[str, Any]]
    ) -> None:
        """Ensure results.json exists in the output.

        Parameters
        ----------
        output_dir : Path
            The directory with the outputs.
        results : list[dict[str, Any]]
            The returned results.
        """
        from_json = await _a_get_results_from_json(output_dir)
        if from_json:
            await _a_store_full_results(output_dir)
            return
        _remove_results_json(output_dir)
        results_json = output_dir / "results.json"
        try:
            async with aiofiles.open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                await file.write(json.dumps({"results": results}))
        except BaseException:
            return
        await _a_store_full_results(output_dir)

    @staticmethod
    def ensure_error_json(output_dir: Path, error: BaseException) -> None:
        """Ensure an error.json exists in the output.

        Parameters
        ----------
        output_dir : Path
            The path of the output
        error : BaseException
            The error that happened.
        """
        _ensure_error_json(output_dir, error)

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
        if (output_dir / "error.json").exists():
            return ResultsMixin.read_results_error(output_dir / "error.json")
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
        if (output_dir / "error.json").exists():
            return await ResultsMixin.a_read_results_error(
                output_dir / "error.json"
            )
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

    @staticmethod
    def read_results_error(error_json: Path) -> list[dict[str, Any]]:
        """Read the error from error.json.

        Parameters
        ----------
        error_json : Path
            The path of error.json

        Returns
        -------
        list[dict[str, Any]]
            The parsed error details.
        """
        if not error_json.is_file():  # pragma: no cover
            return [{"error": "No results generated"}]
        try:
            with open(error_json, "r", encoding="utf-8") as error_file:
                error_content = error_file.read()
                error_details = json.loads(error_content)
                if isinstance(error_details, dict):
                    return [error_details]
                if isinstance(error_details, list):
                    return error_details
        except BaseException as error:
            return [{"error": str(error)}]
        return [{"error": "Failed to get error details"}]

    @staticmethod
    async def a_read_results_error(error_json: Path) -> list[dict[str, Any]]:
        """Read the error from error.json.

        Parameters
        ----------
        error_json : Path
            The path of error.json

        Returns
        -------
        list[dict[str, Any]]
            The parsed error details.
        """
        if not error_json.is_file():  # pragma: no cover
            return [{"error": "No results generated"}]
        try:
            async with aiofiles.open(
                error_json, "r", encoding="utf-8"
            ) as error_file:
                error_content = await error_file.read()
                error_details = json.loads(error_content)
                if isinstance(error_details, dict):
                    return [error_details]
                if isinstance(error_details, list):
                    return error_details
        except BaseException as error:
            return [{"error": str(error)}]
        return [{"error": "Failed to get error details"}]

    @staticmethod
    def ensure_db_outputs(output_dir: Path) -> None:
        """Ensure the csv and json files are generated if a flow.db exists.

        Parameters
        ----------
        output_dir : Path
            The output directory.
        """
        flow_db = output_dir / "flow.db"
        if not flow_db.is_file():
            return
        tables = [
            "chat_completions",
            "agents",
            "oai_wrappers",
            "oai_clients",
            "version",
            "events",
            "function_calls",
        ]
        dest = output_dir / "logs"
        dest.mkdir(parents=True, exist_ok=True)
        for table in tables:
            table_csv = dest / f"{table}.csv"
            table_json = dest / f"{table}.json"
            if not table_csv.exists() or not table_json.exists():
                _get_sqlite_out(str(flow_db), table, str(table_csv))


# noinspection PyBroadException
def _make_mermaid_diagram(
    temp_dir: Path,
    output_file: str | Path | None,
    flow_name: str,
    mmd_dir: Path,
) -> None:
    events_csv_path = temp_dir / "logs" / "events.csv"
    if events_csv_path.exists():
        print("Generating mermaid sequence diagram...")
        mmd_path = temp_dir / f"{flow_name}.mmd"
        generate_sequence_diagram(events_csv_path, mmd_path)
        if (
            not output_file
            and mmd_path.exists()
            and mmd_path != mmd_dir / f"{flow_name}.mmd"
        ):
            try:
                shutil.copyfile(mmd_path, mmd_dir / f"{flow_name}.mmd")
            except BaseException:
                pass


# noinspection PyBroadException
def _make_timeline_json(
    output_dir: Path,
) -> None:
    """Make the timeline JSON file."""
    events_csv_path = output_dir / "logs" / "events.csv"
    if events_csv_path.exists():
        log_files = TimelineProcessor.get_files(output_dir / "logs")
        if any(log_files.values()):  # pragma: no branch
            output_file = output_dir / "timeline.json"
            # pylint: disable=too-many-try-statements
            try:
                processor = TimelineProcessor()
                processor.load_csv_files(
                    agents_file=log_files["agents"],
                    chat_file=log_files["chat"],
                    events_file=log_files["events"],
                    functions_file=log_files["functions"],
                )
                results = processor.process_timeline()
                with open(
                    output_file, "w", encoding="utf-8", newline="\n"
                ) as f:
                    json.dump(results, f, indent=2, default=str)
                short_results = TimelineProcessor.get_short_results(results)
                printer = get_printer()
                printer(
                    json.dumps(
                        {"type": "timeline", "content": short_results},
                        default=str,
                    ),
                    flush=True,
                )
            except BaseException:
                pass


def _copy_results(
    temp_dir: Path,
    output_file: Path,
    destination_dir: Path,
) -> None:
    """Copy the results to the output directory."""
    temp_dir.mkdir(parents=True, exist_ok=True)
    output_dir = output_file.parent
    for item in temp_dir.iterdir():
        # skip cache files
        if (
            item.name.startswith("__pycache__")
            or item.name.endswith((".pyc", ".pyo", ".pyd"))
            or item.name == ".cache"
            or item.name == ".env"
        ):
            continue
        if item.is_file():
            # let's also copy the "tree of thoughts" image
            # to the output directory
            if item.name.endswith("tree_of_thoughts.png") or item.name.endswith(
                "reasoning_tree.json"
            ):
                shutil.copy(item, output_dir / item.name)
            shutil.copy(item, destination_dir)
        else:
            shutil.copytree(item, destination_dir / item.name)
    if output_file.is_file():
        if output_file.suffix == ".waldiez":
            output_file = output_file.with_suffix(".py")
        if output_file.suffix == ".py":  # pragma: no branch
            src = temp_dir / output_file.name
            if src.exists():
                dst = destination_dir / output_file.name
                if dst.exists():
                    dst.unlink()
                shutil.copyfile(src, output_dir / output_file.name)


def _get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    conn = sqlite3.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row, strict=True)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


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
                        return str(last_msg["name"])

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


async def _a_get_results_from_json(output_dir: Path) -> list[dict[str, Any]]:
    """Get the results dumped in results.json if any."""
    results_json = output_dir / "results.json"
    if not results_json.is_file():
        return []
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


def _ensure_error_json(output_dir: Path, error: BaseException) -> None:
    existing = output_dir / "error.json"
    if not existing.exists():
        with open(existing, "w", encoding="utf-8", newline="\n") as file:
            file.write(json.dumps({"error": str(error)}))
    _remove_results_json(output_dir)


async def _a_ensure_error_json(output_dir: Path, error: BaseException) -> None:
    existing = output_dir / "error.json"
    if not existing.exists():
        async with aiofiles.open(
            existing, "w", encoding="utf-8", newline="\n"
        ) as file:
            await file.write(json.dumps({"error": str(error)}))
    _remove_results_json(output_dir)


def _store_full_results(
    output_dir: Path,
) -> None:
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            with open(
                results_json, "r", encoding="utf-8", newline="\n"
            ) as file:
                results_data = json.loads(file.read())
                results_list = results_data.get("results", [])
        except BaseException as error:
            _ensure_error_json(output_dir, error)
            return
        if not isinstance(results_list, list) or not results_list:
            _ensure_error_json(output_dir, RuntimeError("No results generated"))
            return
        try:
            filled = _fill_results_from_logs(output_dir)
            with open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                file.write(json.dumps(filled))
        except BaseException:
            pass


async def _a_store_full_results(
    output_dir: Path,
) -> None:
    results_json = output_dir / "results.json"
    if results_json.exists():
        try:
            async with aiofiles.open(
                results_json, "r", encoding="utf-8", newline="\n"
            ) as file:
                results_data = json.loads(await file.read())
                results_list = results_data.get("results", [])
        except BaseException as error:
            await _a_ensure_error_json(output_dir, error)
            return
        if not isinstance(results_list, list) or not results_list:
            await _a_ensure_error_json(
                output_dir, RuntimeError("No results generated")
            )
            return
        try:
            filled = _fill_results_from_logs(output_dir)
            async with aiofiles.open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                await file.write(json.dumps(filled))
        except BaseException:
            pass
