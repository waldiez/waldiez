# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportMissingTypeStubs=false,reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false,reportAny=false
# pyright: reportUnusedCallResult=false,reportUnknownArgumentType=false
# cspell: disable
"""
Waldiez exporter class.

The role of the exporter is to export the model's data
to an autogen's flow with one or more chats.

The resulting file(s): a `flow.py` file with one `main()` function
to trigger the chat(s).
"""

import json
import shutil
from pathlib import Path
from typing import Any

import jupytext  # type: ignore[import-untyped]
from jupytext.config import (  # type: ignore[import-untyped]
    JupytextConfiguration,
)

from .exporting import FlowExtras, create_flow_exporter
from .models import Waldiez

REDACTED = "REPLACE_ME"


class WaldiezExporter:
    """Waldiez exporter.

    Attributes
    ----------
        waldiez (Waldiez): The Waldiez instance.
    """

    flow_extras: FlowExtras | None
    waldiez: Waldiez

    def __init__(self, waldiez: Waldiez) -> None:
        """Initialize the Waldiez exporter.

        Parameters
        ----------
        waldiez: Waldiez
            The Waldiez instance.
        """
        self.waldiez = waldiez
        self.flow_extras = None

    @classmethod
    def load(cls, file_path: Path) -> "WaldiezExporter":
        """Load the Waldiez instance from a file.

        Parameters
        ----------
        file_path : Path
            The file path.

        Returns
        -------
        WaldiezExporter
            The Waldiez exporter.
        """
        waldiez = Waldiez.load(file_path)
        return cls(waldiez)

    def export(
        self,
        path: str | Path,
        structured_io: bool = False,
        uploads_root: Path | None = None,
        message: str | None = None,
        force: bool = False,
        skip_secrets: bool = False,
        debug: bool = False,
    ) -> None:
        """Export the Waldiez instance.

        Parameters
        ----------
        path : str | Path
            The path to export to.
        structured_io : bool, (optional)
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        uploads_root : str | Path | None, (optional)
            The uploads root, to get user-uploaded files, by default None.
        message : str | None
            Optional initial message to pass (override flow's message if needed)
        force : bool, (optional)
            Override the output file if it already exists, by default False.
        skip_secrets : bool, optional
            If exporting to waldiez, whether to replace any api keys or secrets.
        debug : bool, (optional)
            Whether to enable debug mode, by default False.

        Raises
        ------
        FileExistsError
            If the file already exists, and force is False.
        IsADirectoryError
            If the output is a directory.
        ValueError
            If the file extension is invalid.
        """
        if not isinstance(path, Path):
            path = Path(path)
        path = path.resolve()
        if path.is_dir():
            raise IsADirectoryError(f"Output is a directory: {path}")
        if path.exists():
            if not force:
                raise FileExistsError(f"File already exists: {path}")
            path.unlink(missing_ok=True)
        path.parent.mkdir(parents=True, exist_ok=True)
        if (path.parent / ".cache").is_dir():
            shutil.rmtree(str(path.parent / ".cache"), ignore_errors=True)
        extension = path.suffix
        if extension == ".waldiez":
            self.to_waldiez(path, skip_secrets=skip_secrets, debug=debug)
        elif extension == ".py":
            self.to_py(
                path,
                structured_io=structured_io,
                uploads_root=uploads_root,
                message=message,
                debug=debug,
            )
        elif extension == ".ipynb":
            self.to_ipynb(
                path,
                structured_io=structured_io,
                uploads_root=uploads_root,
                message=message,
                debug=debug,
            )
        else:
            raise ValueError(f"Invalid extension: {extension}")

    def to_ipynb(
        self,
        path: str | Path,
        structured_io: bool = False,
        uploads_root: Path | None = None,
        message: str | None = None,
        debug: bool = False,
    ) -> None:
        """Export flow to jupyter notebook.

        Parameters
        ----------
        path : str | Path
            The path to export to.
        structured_io : bool, optional
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        uploads_root : Path | None, optional
            The uploads root, to get user-uploaded files, by default None.
        message : str | None
            Optional initial message to pass (override flow's message if needed)
        debug : bool, optional
            Whether to enable debug mode, by default False.

        Raises
        ------
        RuntimeError
            If the notebook could not be generated.
        """
        # we first create a .py file with the content
        # and then convert it to a notebook using jupytext
        if not isinstance(path, Path):
            path = Path(path)
        exporter = create_flow_exporter(
            waldiez=self.waldiez,
            output_dir=path.parent,
            uploads_root=uploads_root,
            structured_io=structured_io,
            message=message,
            for_notebook=True,
            debug=debug,
        )
        self.flow_extras = exporter.extras
        output = exporter.export()
        content_str = output.main_content
        if not content_str:
            raise RuntimeError("Could not generate notebook")
        py_path = path.with_suffix(".tmp.py")
        with open(py_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content_str)
        config = JupytextConfiguration(
            comment_magics=False,
            hide_notebook_metadata=True,
            cell_metadata_filter="-all",
        )
        with open(py_path, "r", encoding="utf-8") as py_out:
            jp_content = jupytext.read(
                py_out,
                fmt="py:percent",
                config=config,
            )
        ipynb_path = str(py_path).replace(".tmp.py", ".tmp.ipynb")
        jupytext.write(
            jp_content,
            ipynb_path,
            fmt="ipynb",
            config=config,
        )
        Path(ipynb_path).rename(ipynb_path.replace(".tmp.ipynb", ".ipynb"))
        py_path.unlink(missing_ok=True)

    def to_py(
        self,
        path: str | Path,
        structured_io: bool = False,
        uploads_root: Path | None = None,
        message: str | None = None,
        debug: bool = False,
    ) -> None:
        """Export waldiez flow to a python script.

        Parameters
        ----------
        path : str | Path
            The path to export to.
        structured_io : bool, optional
            Whether to use structured IO instead of the default 'input/print',
            by default False.
        uploads_root : Path | None, optional
            The uploads root, to get user-uploaded files, by default None.
        message : str | None
            Optional initial message to pass (override flow's message if needed)
        debug : bool, optional
            Whether to enable debug mode, by default False.

        Raises
        ------
        RuntimeError
            If the python script could not be generated.
        """
        if not isinstance(path, Path):
            path = Path(path)
        exporter = create_flow_exporter(
            waldiez=self.waldiez,
            output_dir=path.parent,
            for_notebook=False,
            uploads_root=uploads_root,
            structured_io=structured_io,
            message=message,
            debug=debug,
        )
        self.flow_extras = exporter.extras
        output = exporter.export()
        content = output.main_content
        if not content:
            raise RuntimeError("Could not generate python script")
        with open(path, "w", encoding="utf-8", newline="\n") as file:
            file.write(content)

    def to_waldiez(
        self, file_path: Path, skip_secrets: bool = False, debug: bool = False
    ) -> None:
        """Export the Waldiez instance.

        Parameters
        ----------
        file_path : Path
            The file path.
        skip_secrets : bool, optional
            Whether to replace any api keys or secrets, by default False.
        debug : bool, optional
            Whether to enable debug mode, by default False.
        """
        dump = self.waldiez.model_dump_json(indent=2)
        if skip_secrets:
            dump = _replace_secrets(dump)
        with open(file_path, "w", encoding="utf-8", newline="\n") as file:
            file.write(dump)
        if debug:
            print(dump)


def _replace_secrets(json_dump: str, *, deep: bool = False) -> str:
    """Return a redacted JSON dump (does not mutate the input string)."""
    parsed = json.loads(json_dump)

    _redact_models(parsed)
    _redact_tools(parsed)

    if deep:
        _redact_by_key_name(parsed)

    return json.dumps(parsed, indent=2, ensure_ascii=False)


# pylint: disable=too-complex,too-many-branches
def _redact_models(root: dict[str, Any]) -> None:  # noqa: C901
    data = root.get("data")
    if not isinstance(data, dict):
        return

    models = data.get("models")
    if not isinstance(models, list):
        return

    for model in models:
        if not isinstance(model, dict):
            continue
        mdata = model.get("data")
        if not isinstance(mdata, dict):
            continue

        if isinstance(mdata.get("apiKey"), str) and mdata["apiKey"].strip():
            mdata["apiKey"] = REDACTED

        aws = mdata.get("aws")
        if isinstance(aws, dict):
            for k in (
                "accessKey",
                "secretKey",
                "sessionToken",
                "profileName",
                "region",
            ):
                if isinstance(aws.get(k), str) and aws[k].strip():
                    aws[k] = REDACTED

        headers = mdata.get("defaultHeaders")
        if isinstance(headers, dict):
            for hk in list(headers.keys()):
                if not isinstance(hk, str):
                    continue
                if hk.lower() in {
                    "authorization",
                    "x-api-key",
                    "api-key",
                    "x-auth-token",
                }:
                    if isinstance(headers.get(hk), str) and headers[hk].strip():
                        headers[hk] = REDACTED


def _redact_tools(root: dict[str, Any]) -> None:
    data = root.get("data")
    if not isinstance(data, dict):
        return

    tools = data.get("tools")
    if not isinstance(tools, list):
        return

    for tool in tools:
        if not isinstance(tool, dict):
            continue
        tdata = tool.get("data")
        if not isinstance(tdata, dict):
            continue

        # data.tools[*].data.secrets is an object (additionalProperties: {})
        secrets = tdata.get("secrets")
        if isinstance(secrets, dict):
            for k, v in list(secrets.items()):
                if isinstance(v, str) and v.strip():
                    secrets[k] = REDACTED
                elif v is not None:
                    # If someone stored nested structures, still redact it
                    secrets[k] = REDACTED


def _redact_by_key_name(node: Any) -> None:
    """Deep-walk and redact values by suspicious key names in the tree."""
    secret_keys = {
        "apikey",
        "api_key",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "secretkey",
        "secret_key",
        "password",
        "passphrase",
        "private_key",
        "client_secret",
        "sessiontoken",
        "session_token",
        "authorization",
    }

    if isinstance(node, dict):
        for k, v in list(node.items()):
            if isinstance(k, str) and k.lower() in secret_keys:
                node[k] = REDACTED
            else:
                _redact_by_key_name(v)
    elif isinstance(node, list):
        for item in node:
            _redact_by_key_name(item)
