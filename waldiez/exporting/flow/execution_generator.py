# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Generates the main() and call_main() functions."""

# pylint: disable=no-self-use,unused-argument

from ..core import get_comment
from .utils.common import main_doc_string


class ExecutionGenerator:
    """Generate the main function and its calling block for flow exporter."""

    @staticmethod
    def generate(
        content: str,
        is_async: bool,
        for_notebook: bool,
        cache_seed: int | None,
        after_run: str,
    ) -> str:
        """Generate the complete flow script content.

        Parameters
        ----------
        content : str
            The content of the chats to be included in the main function.
        is_async : bool
            Whether to generate async content.
        for_notebook : bool
            Whether the export is intended for a notebook environment.
        cache_seed : str | int | None
            The cache seed to use for flow chat if any.
        after_run : str, optional
            Additional content to add after the main chat execution,
            by default ""

        Returns
        -------
        str
            The complete flow script content.
        """
        main_function = ExecutionGenerator.generate_main_function(
            content=content,
            is_async=is_async,
            cache_seed=cache_seed,
            after_run=after_run,
            for_notebook=for_notebook,
        )
        call_main_function = ExecutionGenerator.generate_call_main_function(
            is_async=is_async,
            for_notebook=for_notebook,
        )
        if not for_notebook:
            execution_block = ExecutionGenerator.generate_execution_block(
                is_async=is_async,
            )
        else:
            execution_block = ""
        return (
            "\n".join([main_function, call_main_function, execution_block])
            + "\n"
        )

    @staticmethod
    def generate_main_function(
        content: str,
        is_async: bool,
        cache_seed: int | None,
        after_run: str,
        for_notebook: bool,
        skip_logging: bool = False,
    ) -> str:
        """Generate the main function for the flow script.

        Parameters
        ----------
        content : str
            The content of the chats to be included in the main function.
        is_async : bool
            Whether to generate async content
        cache_seed : str | int | None
            The cache seed to use for flow chat if any
        after_run : str
            Additional content to add after the main chat execution.
        for_notebook : bool
            Whether the export is intended for a notebook environment.
        skip_logging : bool, optional
            Whether to skip logging setup, by default False

        Returns
        -------
        str
            The complete main function content.
        """
        if content.startswith("\n"):
            content = content[1:]
        flow_content = "\n\n"
        comment = get_comment(
            "Start chatting",
            for_notebook=for_notebook,
        )
        flow_content += f"{comment}\n"
        if is_async:
            flow_content += "async "
        on_event_arg = "on_event: Optional[Callable[[BaseEvent], bool]] = None"
        if is_async:
            on_event_arg = (
                "on_event: Optional["
                "Callable[[BaseEvent], Coroutine[None, None, bool]]"
                "] = None"
            )
        return_type_hint = (
            "AsyncRunResponseProtocol" if is_async else "RunResponseProtocol"
        )
        flow_content += f"def main({on_event_arg}) -> {return_type_hint}:\n"
        flow_content += f"    {main_doc_string(is_async=is_async)}\n"
        space = "    "
        if cache_seed is not None:
            flow_content += (
                f"    with Cache.disk(cache_seed={cache_seed}"
                ") as cache:  # pyright: ignore\n"
            )
            space = f"{space}    "
        flow_content += f"{content}" + "\n"
        if not skip_logging:
            if is_async:
                flow_content += f"{space}await stop_logging()"
            else:
                flow_content += f"{space}stop_logging()"
        flow_content += "\n"
        if after_run:
            flow_content += after_run + "\n"
        if cache_seed is not None:
            space = space[4:]
        flow_content += f"{space}return results\n"
        return flow_content

    @staticmethod
    def generate_call_main_function(is_async: bool, for_notebook: bool) -> str:
        """Generate the call_main function for the flow script.

        Parameters
        ----------
        is_async : bool
            Whether to generate async content
        for_notebook : bool
            Whether the export is intended for a notebook environment.

        Returns
        -------
        str
            The complete call_main function content.
        """
        content = "\n"
        if for_notebook:
            if is_async:
                return "# %%\nawait main()\n"
            return "# %%\nmain()\n"
        if is_async:
            content += "async def call_main() -> None:\n"
            return_type_hint = "list[AsyncRunResponseProtocol]"
        else:
            content += "def call_main() -> None:\n"
            return_type_hint = "list[RunResponseProtocol]"
        content += '    """Run the main function and print the results."""\n'
        content += f"    results: {return_type_hint} = "
        if is_async:
            content += "await "
        content += "main()\n"
        content += "    print('Results:', results)\n"
        content += "\n"
        return content

    @staticmethod
    def generate_execution_block(is_async: bool) -> str:
        """Generate the execution block for the main function.

        Parameters
        ----------
        is_async : bool
            Whether to generate async content

        Returns
        -------
        str
            The complete if __name__ == "__main__": block content
        """
        comment = get_comment(
            "Let's go!",
            for_notebook=False,
        )
        content = 'if __name__ == "__main__":\n'
        content += f"    {comment}"
        if is_async:
            content += "    anyio.run(call_main)\n"
        else:
            content += "    call_main()\n"
        return content
