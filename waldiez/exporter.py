# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""
Waldiez exporter class.

The role of the exporter is to export the model's data
to an autogen's flow with one or more chats.

The resulting file(s): a `flow.py` file with one `main()` function
to trigger the chat(s).
"""

from pathlib import Path
from typing import Union

import jupytext  # type: ignore[import-untyped]

from .exporting import FlowExporter
from .models import Waldiez


class WaldiezExporter:
    """Waldiez exporter.

    Attributes
    ----------
        waldiez (Waldiez): The Waldiez instance.
    """

    def __init__(self, waldiez: Waldiez) -> None:
        """Initialize the Waldiez exporter.

        Parameters
        ----------
            waldiez (Waldiez): The Waldiez instance.
        """
        self.waldiez = waldiez
        # self._initialize()

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

    def export(self, path: Union[str, Path], force: bool = False) -> None:
        """Export the Waldiez instance.

        Parameters
        ----------
        path : Union[str, Path]
            The path to export to.
        force : bool, optional
            Override the output file if it already exists, by default False.

        Raises
        ------
        FileExistsError
            If the file already exists and force is False.
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
            if force is False:
                raise FileExistsError(f"File already exists: {path}")
            path.unlink(missing_ok=True)
        path.parent.mkdir(parents=True, exist_ok=True)
        extension = path.suffix
        if extension == ".waldiez":
            self.to_waldiez(path)
        elif extension == ".py":
            self.to_py(path)
        elif extension == ".ipynb":
            self.to_ipynb(path)
        else:
            raise ValueError(f"Invalid extension: {extension}")

    def to_ipynb(self, path: Path) -> None:
        """Export flow to jupyter notebook.

        Parameters
        ----------
        path : Path
            The path to export to.

        Raises
        ------
        RuntimeError
            If the notebook could not be generated.
        """
        # we first create a .py file with the content
        # and then convert it to a notebook using jupytext
        exporter = FlowExporter(
            waldiez=self.waldiez,
            output_dir=path.parent,
            for_notebook=True,
        )
        output = exporter.export()
        content = output["content"]
        if not content:
            raise RuntimeError("Could not generate notebook")
        py_path = path.with_suffix(".tmp.py")
        with open(py_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        with open(py_path, "r", encoding="utf-8") as py_out:
            content = jupytext.read(py_out, fmt="py:light")
        ipynb_path = str(py_path).replace(".tmp.py", ".tmp.ipynb")
        jupytext.write(content, ipynb_path, fmt="ipynb")
        Path(ipynb_path).rename(ipynb_path.replace(".tmp.ipynb", ".ipynb"))
        py_path.unlink(missing_ok=True)

    def to_py(self, path: Path) -> None:
        """Export waldiez flow to python script.

        Parameters
        ----------
        path : Path
            The path to export to.

        Raises
        ------
        RuntimeError
            If the python script could not be generated.
        """
        exporter = FlowExporter(
            waldiez=self.waldiez,
            output_dir=path.parent,
            for_notebook=False,
        )
        output = exporter.export()
        content = output["content"]
        if not content:
            raise RuntimeError("Could not generate python script")
        with open(path, "w", encoding="utf-8", newline="\n") as file:
            file.write(content)

    def to_waldiez(self, file_path: Path) -> None:
        """Export the Waldiez instance.

        Parameters
        ----------
        file_path : Path
            The file path.
        """
        with open(file_path, "w", encoding="utf-8", newline="\n") as file:
            file.write(self.waldiez.model_dump_json())
