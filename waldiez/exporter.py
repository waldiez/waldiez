# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportMissingTypeStubs=false,reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false,reportAny=false
# pyright: reportUnusedCallResult=false
"""
Waldiez exporter class.

The role of the exporter is to export the model's data
to an autogen's flow with one or more chats.

The resulting file(s): a `flow.py` file with one `main()` function
to trigger the chat(s).
"""

import shutil
from pathlib import Path

import jupytext  # type: ignore[import-untyped]
from jupytext.config import (  # type: ignore[import-untyped]
    JupytextConfiguration,
)

from .exporting import FlowExtras, create_flow_exporter
from .models import Waldiez


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
        force: bool = False,
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
        force : bool, (optional)
            Override the output file if it already exists, by default False.
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
            self.to_waldiez(path, debug=debug)
        elif extension == ".py":
            self.to_py(
                path,
                structured_io=structured_io,
                uploads_root=uploads_root,
                debug=debug,
            )
        elif extension == ".ipynb":
            self.to_ipynb(
                path,
                structured_io=structured_io,
                uploads_root=uploads_root,
                debug=debug,
            )
        else:
            raise ValueError(f"Invalid extension: {extension}")

    def to_ipynb(
        self,
        path: str | Path,
        structured_io: bool = False,
        uploads_root: Path | None = None,
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
            debug=debug,
        )
        self.flow_extras = exporter.extras
        output = exporter.export()
        content = output.main_content
        if not content:
            raise RuntimeError("Could not generate python script")
        with open(path, "w", encoding="utf-8", newline="\n") as file:
            file.write(content)

    def to_waldiez(self, file_path: Path, debug: bool = False) -> None:
        """Export the Waldiez instance.

        Parameters
        ----------
        file_path : Path
            The file path.
        debug : bool, optional
            Whether to enable debug mode, by default False.
        """
        with open(file_path, "w", encoding="utf-8", newline="\n") as file:
            file.write(self.waldiez.model_dump_json())
        if debug:
            print(self.waldiez.model_dump_json(indent=2))
