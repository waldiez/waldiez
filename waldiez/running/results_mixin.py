# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,too-many-try-statements,too-many-locals
# pylint: disable=too-many-positional-arguments,too-many-arguments
# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false, reportUnusedParameter=false

"""Waldiez run results module."""

import json
import re
import shutil
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TypedDict

import aiofiles
import anyio.to_thread

from waldiez.storage import StorageManager

from .db_utils import a_get_sqlite_out, get_sqlite_out
from .gen_seq_diagram import generate_sequence_diagram
from .io_utils import get_printer
from .post_run import (
    a_get_results_from_json,
    a_store_full_results,
    ensure_error_json as _ensure_error_json,
    get_results_from_json,
    remove_results_json,
    store_full_results,
)
from .timeline_processor import TimelineProcessor


class WaldiezRunResults(TypedDict):
    """Results of the Waldiez run."""

    results: list[dict[str, Any]]
    exception: BaseException | None
    completed: bool


class ResultsMixin:
    """Results related static methods."""

    # pylint: disable=unused-argument
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
        storage_manager: StorageManager | None = None,
        metadata: dict[str, Any] | None = None,
        copy_artifacts_into: str | None = None,
        keep_tmp: bool = False,
        link_latest: bool = True,
        promote_to_output: Iterable[str] = (
            "tree_of_thoughts.png",
            "reasoning_tree.json",
        ),
        ignore_names: Iterable[str] = (".cache", ".env"),
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
        storage_manager: StorageManager | None
            The storage manager for copying results and generating symlinks.
        metadata : dict[str, Any] | None
            Optional metadata to store in the checkpoint.
        link_latest : bool
            Whether to update a `latest` link under link_root/session_name.
            Defaults to True.
        keep_tmp : bool
            If False, delete the tmp_dir after copying. Defaults to False.
        copy_artifacts_into : str | None
            If set, copy artifacts into
            checkpoint/<copy_into_subdir> instead of the root.
        promote_to_output : Iterable[str]
            File names (exact matches) to also copy into output_dir.
        ignore_names : Iterable[str]
            Directory/file names to skip entirely.

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
        if not skip_mmd:
            ResultsMixin.make_mermaid_diagram(
                temp_dir=temp_dir,
                output_file=output_file,
                flow_name=flow_name,
                mmd_dir=mmd_dir,
            )
        if not skip_timeline:  # pragma: no branch
            ResultsMixin.make_timeline_json(temp_dir)
        if storage_manager is None:
            storage_manager = StorageManager()
        link_root = (
            (output_file.parent / "waldiez_out")
            if output_file
            else (waldiez_file.parent / "waldiez_out")
        )
        output_hint = output_file or Path.cwd() / waldiez_file.name
        session_name = ResultsMixin.safe_name(flow_name)
        _checkpoint_path, public_link_path = storage_manager.finalize(
            session_name=session_name,
            output_file=output_hint,
            tmp_dir=temp_dir,
            metadata=metadata or {},
            timestamp=datetime.now(timezone.utc),
            link_root=link_root,
            link_latest=link_latest,
            keep_tmp=keep_tmp,
            copy_into_subdir=copy_artifacts_into,
            promote_to_output=promote_to_output,
            ignore_names=ignore_names,
        )
        try:
            dst_waldiez = public_link_path / waldiez_file.name
            if not dst_waldiez.exists() and waldiez_file.is_file():
                shutil.copyfile(waldiez_file, dst_waldiez)
        except Exception:
            pass
        return public_link_path if output_file else None

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
        storage_manager: StorageManager | None = None,
        metadata: dict[str, Any] | None = None,
        copy_artifacts_into: str | None = None,
        keep_tmp: bool = False,
        link_latest: bool = True,
        promote_to_output: Iterable[str] = (
            "tree_of_thoughts.png",
            "reasoning_tree.json",
        ),
        ignore_names: Iterable[str] = (".cache", ".env"),
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
        storage_manager: StorageManager | None
            The storage manager for copying results and generating symlinks.
        metadata : dict[str, Any] | None
            Optional metadata to store in the checkpoint.
        link_latest : bool
            Whether to update a `latest` link under link_root/session_name.
            Defaults to True.
        keep_tmp : bool
            If False, delete the tmp_dir after copying. Defaults to False.
        copy_artifacts_into : str | None
            If set, copy artifacts into
            checkpoint/<copy_into_subdir> instead of the root.
        promote_to_output : Iterable[str]
            File names (exact matches) to also copy into output_dir.
        ignore_names : Iterable[str]
            Directory/file names to skip entirely.

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
            storage_manager,
            metadata,
            copy_artifacts_into,
            keep_tmp,
            link_latest,
            promote_to_output,
            ignore_names,
        )

    @staticmethod
    def make_mermaid_diagram(
        temp_dir: Path,
        output_file: str | Path | None,
        flow_name: str,
        mmd_dir: Path,
    ) -> None:
        """Generate mermaid diagram.

        Parameters
        ----------
        temp_dir : Path
            The directory to look for logs.
        output_file : str | Path | None
            The optional destination python file.
        flow_name : str
            The name of the flow.
        mmd_dir : Path
            The path to save the mmd file to.
        """
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

    @staticmethod
    def make_timeline_json(
        output_dir: Path,
    ) -> None:
        """Make the timeline JSON file.

        Parameters
        ----------
        output_dir : Path
            The path to search the events csv.
        """
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
        from_json = get_results_from_json(output_dir)
        if from_json:
            store_full_results(output_dir)
            return
        remove_results_json(output_dir)
        results_json = output_dir / "results.json"
        try:
            with open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                file.write(json.dumps({"results": results}))
        except BaseException:
            return
        store_full_results(output_dir)

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
        from_json = await a_get_results_from_json(output_dir)
        if from_json:
            await a_store_full_results(output_dir)
            return
        remove_results_json(output_dir)
        results_json = output_dir / "results.json"
        try:
            async with aiofiles.open(
                results_json, "w", encoding="utf-8", newline="\n"
            ) as file:
                await file.write(json.dumps({"results": results}))
        except BaseException:
            return
        await a_store_full_results(output_dir)

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
                get_sqlite_out(str(flow_db), table, str(table_csv))

    @staticmethod
    async def a_ensure_db_outputs(output_dir: Path) -> None:
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
                await a_get_sqlite_out(str(flow_db), table, str(table_csv))

    @staticmethod
    def safe_name(
        name: str, max_length: int = 255, fallback: str = "invalid_name"
    ) -> str:
        """Return a filesystem-safe version of a name.

        Parameters
        ----------
        name : str
            The original name.
        max_length : int
            The new name's max length.
        fallback : str
            A fallback name to use.

        Returns
        -------
        str
            The safe version of the name
        """
        safe = name.strip()

        if not safe:
            return fallback
        safe = re.sub(r"[^a-zA-Z0-9_.-]+", "_", safe)
        safe = re.sub(r"_+", "_", safe)
        safe = re.sub(r"\.{2,}", "_", safe)
        safe = safe.strip("._")
        safe = safe[:max_length].rstrip("._")
        return safe or fallback
