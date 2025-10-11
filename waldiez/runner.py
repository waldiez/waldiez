# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=protected-access,too-many-arguments
# pylint: disable=too-many-positional-arguments
"""Run a waldiez flow.

The flow is first converted to an ag2 flow with agents, chats, and tools.
We then chown to temporary directory,
    import and call the flow's `main(on_event)` method.
The `on_event` method is called with the event emitter,
    which emits events during the flow execution.
The flow is run in a temporary directory,
    and the results are saved to the output file's directory.
The uploads root directory is used to store any uploaded files
during the flow execution.

"""

from pathlib import Path
from typing import Any

from typing_extensions import Literal, override

from .models.waldiez import Waldiez
from .running import (
    WaldiezBaseRunner,
    WaldiezStandardRunner,
    WaldiezStepByStepRunner,
    WaldiezSubprocessRunner,
)


def create_runner(
    waldiez: Waldiez,
    mode: Literal["standard", "debug", "subprocess"] = "standard",
    output_path: str | Path | None = None,
    uploads_root: str | Path | None = None,
    structured_io: bool = False,
    dot_env: str | Path | None = None,
    **kwargs: Any,
) -> WaldiezBaseRunner:
    """Create a Waldiez runner of the specified type.

    Parameters
    ----------
    waldiez : Waldiez
        The waldiez flow to run.
    mode : Literal["standard", "debug"], optional
        Runner mode: "standard", "debug", by default "standard"
    output_path : str | Path | None, optional
        Output path for results, by default None
    uploads_root : str | Path | None, optional
        Uploads root directory, by default None
    structured_io : bool, optional
        Use structured I/O, by default False
    dot_env : str | Path | None, optional
        Path to a .env file for environment variables, by default None
    **kwargs
        Additional arguments for specific runner types

    Returns
    -------
    WaldiezBaseRunner
        The configured runner instance

    Raises
    ------
    ValueError
        If unknown runner mode is specified
    """
    runners: dict[str, type[WaldiezBaseRunner]] = {
        "standard": WaldiezStandardRunner,
        "debug": WaldiezStepByStepRunner,
        "subprocess": WaldiezSubprocessRunner,
    }

    if mode not in runners:  # pragma: no cover
        available = ", ".join(runners.keys())
        raise ValueError(
            f"Unknown runner mode '{mode}'. Available: {available}"
        )

    runner_cls = runners[mode]
    if mode == "subprocess":
        subprocess_mode = kwargs.pop("subprocess_mode", "run")
        if subprocess_mode not in ["run", "debug"]:
            subprocess_mode = "run"
        return runner_cls(
            waldiez=waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            dot_env=dot_env,
            mode=subprocess_mode,
            **kwargs,
        )
    if mode != "debug" and "breakpoints" in kwargs:  # pragma: no cover
        kwargs.pop("breakpoints", None)
    return runner_cls(
        waldiez=waldiez,
        output_path=output_path,
        uploads_root=uploads_root,
        structured_io=structured_io,
        dot_env=dot_env,
        mode=mode,
        **kwargs,
    )


class WaldiezRunner(WaldiezBaseRunner):
    """Factory class for creating Waldiez runners."""

    # pylint: disable=super-init-not-called
    # noinspection PyMissingConstructor
    def __init__(  # pyright: ignore[reportMissingSuperCall]
        self,
        waldiez: Waldiez,
        mode: Literal["standard", "debug"] = "standard",
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ):
        """Create a runner instance.

        Parameters
        ----------
        waldiez : Waldiez
            The waldiez flow to run.
        mode : Literal["standard", "debug"], optional
            Runner mode: "standard", "debug", by default "standard"
        output_path : str | Path | None, optional
            Output path for results, by default None
        uploads_root : str | Path | None, optional
            Uploads root directory, by default None
        structured_io : bool, optional
            Use structured I/O, by default False
        dot_env : str | Path | None, optional
            Path to a .env file for environment variables, by default None
        **kwargs
            Additional arguments for specific runner types
        """
        self._runner = create_runner(
            waldiez=waldiez,
            mode=mode,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            dot_env=dot_env,
            **kwargs,
        )

    @override
    def __repr__(self) -> str:  # pragma: no cover
        """Get the string representation of the runner.

        Returns
        -------
        str
            A string representation of the WaldiezRunner instance.
        """
        return f"WaldiezRunner({type(self._runner).__name__})"

    def __getattr__(self, name: str) -> Any:
        """Delegate attribute access to the underlying runner.

        Parameters
        ----------
        name : str
            The name of the attribute to access.

        Returns
        -------
        Any
            The value of the attribute from the underlying runner.
        """
        if hasattr(self._runner, name):
            return getattr(self._runner, name)
        raise AttributeError(
            f"{type(self).__name__} has no attribute '{name}'"
        )  # pragma: no cover

    @override
    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        return self._runner._run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            **kwargs,
        )

    @override
    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        return await self._runner._a_run(
            temp_dir=temp_dir,
            output_file=output_file,
            uploads_root=uploads_root,
            skip_mmd=skip_mmd,
            skip_timeline=skip_timeline,
            dot_env=dot_env,
            **kwargs,
        )

    @override
    @classmethod
    def load(
        cls,
        waldiez_file: str | Path,
        name: str | None = None,
        description: str | None = None,
        tags: list[str] | None = None,
        requirements: list[str] | None = None,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> "WaldiezRunner":
        """Load a waldiez flow and create a runner.

        Parameters
        ----------
        waldiez_file : str | Path
            Path to the waldiez flow file.
        name : str | None, optional
            Name of the flow, by default None
        description : str | None, optional
            Description of the flow, by default None
        tags : list[str] | None, optional
            Tags for the flow, by default None
        requirements : list[str] | None, optional
            Requirements for the flow, by default None
        output_path : str | Path | None, optional
            Output path for results, by default None
        uploads_root : str | Path | None, optional
            Uploads root directory, by default None
        structured_io : bool, optional
            Use structured I/O, by default False
        dot_env : str | Path | None, optional
            Path to a .env file for environment variables, by default None
        **kwargs
            Additional arguments for specific runner types

        Returns
        -------
        WaldiezRunner
            The configured runner instance
        """
        waldiez = Waldiez.load(
            waldiez_file,
            name=name,
            description=description,
            tags=tags,
            requirements=requirements,
        )
        mode = kwargs.pop("mode", "standard")
        # Ensure mode is set correctly, defaulting to "standard" if not provided
        if not mode or mode not in ["standard", "debug"]:
            # Default to "standard" if mode is not specified or invalid
            # This ensures backward compatibility and avoids errors
            mode = "standard"
        return cls(
            waldiez=waldiez,
            mode=mode,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            dot_env=dot_env,
            waldiez_file=waldiez_file,
            **kwargs,
        )
