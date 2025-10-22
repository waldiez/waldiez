# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Generates the main() and call_main() functions."""

# pylint: disable=no-self-use,unused-argument,line-too-long
# flake8: noqa: E501

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
        skip_logging: bool,
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
        skip_logging : bool, optional
            Whether to skip logging setup, by default False

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
            skip_logging=skip_logging,
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
    def generate_store_results(is_async: bool) -> str:
        """Generate the part that writes the results to results.json.

        Parameters
        ----------
        is_async : bool
            Whether the flow is async or not.

        Returns
        -------
        str
            The part that generates the code to store the results.
        """
        content: str = "async " if is_async else ""
        tab = "    "
        content += (
            "def store_results(result_dicts: list[dict[str, Any]]) -> None:\n"
        )
        content += f'{tab}"""Store the results to results.json.\n'
        content += f"{tab}Parameters\n"
        content += f"{tab}----------\n"
        content += f"{tab}result_dicts : list[dict[str, Any]]\n"
        content += f"{tab}{tab}The list of the results.\n"
        content += f'{tab}"""\n'
        if is_async:
            content += f'{tab}async with aiofiles.open("results.json", "w", encoding="utf-8", newline="\\n") as file:\n'
            content += f"{tab}{tab}await file.write(json.dumps({{'results': result_dicts}}, indent=4, ensure_ascii=False))\n"
        else:
            content += f'{tab}with open("results.json", "w", encoding="utf-8", newline="\\n") as file:\n'
            content += f"{tab}{tab}file.write(json.dumps({{'results': result_dicts}}, indent=4, ensure_ascii=False))\n"
        return content

    @staticmethod
    def generate_store_error(is_async: bool) -> str:
        """Generate the part that writes an error to error.json.

        Parameters
        ----------
        is_async : bool
            Whether the flow is async or not.

        Returns
        -------
        str
            The content for writing the error to file.
        """
        content = "\nasync " if is_async else "\n"
        content += '''def store_error(exc: BaseException | None = None) -> None:
    """Store the error in error.json.

    Parameters
    ----------
    exc : BaseException | None
        The exception we got if any.
    """
    reason = "Event handler stopped processing" if not exc else traceback.format_exc()
    try:'''
        if is_async:
            content += """
        async with aiofiles.open("error.json", "w", encoding="utf-8", newline="\\n") as file:
            await file.write(json.dumps({"error": reason}))"""
        else:
            content += """
        with open("error.json", "w", encoding="utf-8", newline="\\n") as file:
            file.write(json.dumps({"error": reason}))"""
        content += """
    except BaseException: # pylint: disable=broad-exception-caught
        pass
"""

        return content

    @staticmethod
    def generate_main_function(
        content: str,
        is_async: bool,
        cache_seed: int | None,
        after_run: str,
        for_notebook: bool,
        skip_logging: bool,
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
        on_event_arg = "on_event: Callable[[BaseEvent, list[ConversableAgent]], bool] | None = None"
        if is_async:
            on_event_arg = (
                "on_event: "
                "Callable[[BaseEvent, list[ConversableAgent]], Coroutine[None, None, bool]]"
                " | None = None"
            )
        resume_arg = "state_json : str | Path | None = None"
        return_type_hint = "list[dict[str, Any]]"
        flow_content += (
            "def main(\n"
            f"    {on_event_arg},"
            "\n"
            f"    {resume_arg}"
            "\n"
            f") -> {return_type_hint}:"
            "\n"
        )
        flow_content += f"    {main_doc_string()}\n"
        flow_content += "    if state_json:\n"
        flow_content += '        print("prepare resuming from state")\n'
        if not is_async:
            flow_content += "    results: list[RunResponseProtocol] | RunResponseProtocol = []\n"
        else:
            flow_content += "    results: list[AsyncRunResponseProtocol] | AsyncRunResponseProtocol = []\n"
        flow_content += "    result_dicts: list[dict[str, Any]] = []\n"
        space = "    "
        if cache_seed is not None:
            # noinspection SqlDialectInspection
            flow_content += (
                f"    with Cache.disk(cache_seed={cache_seed}) as cache:\n"
            )
            space = f"{space}    "
        flow_content += f"{content}" + "\n"
        if not skip_logging:
            flow_content += ExecutionGenerator._get_stop_logging_call(
                space, is_async
            )
        flow_content += "\n"
        if after_run:
            flow_content += after_run + "\n"
        if cache_seed is not None:
            space = space[4:]
        flow_content += ExecutionGenerator._get_store_results_call(
            space, is_async
        )
        flow_content += f"{space}return result_dicts\n"
        return flow_content

    @staticmethod
    def _get_stop_logging_call(space: str, is_async: bool) -> str:
        """Get stop logging call."""
        if is_async:
            return f"{space}await stop_logging()"
        return f"{space}stop_logging()"

    @staticmethod
    def _get_store_results_call(space: str, is_async: bool) -> str:
        """Get store results call."""
        if is_async:
            return f"{space}await store_results(result_dicts)\n"
        return f"{space}store_results(result_dicts)\n"

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
        tab = "    "
        if for_notebook:
            if is_async:
                return "# %%\nawait main()\n"
            return "# %%\nmain()\n"
        return_type_hint = "list[dict[str, Any]]"
        if is_async:
            content += "async def call_main() -> None:\n"
        else:
            content += "def call_main() -> None:\n"
        content += f'{tab}"""Run the main function and print the results."""\n'
        content += f"{tab}state_json: str | Path | None = None\n"
        content += f'{tab}if "--state" in sys.argv:\n'
        content += f'{tab}{tab}entry_index = sys.argv.index("--state")\n'
        content += f"{tab}{tab}if entry_index + 1 < len(sys.argv):\n"
        content += (
            f"{tab}{tab}{tab}state_location = Path(sys.argv[entry_index + 1])\n"
        )
        content += f"{tab}{tab}{tab}if state_location.resolve().exists():\n"
        content += f"{tab}{tab}{tab}{tab}state_json = state_location\n"
        content += f"{tab}results: {return_type_hint} = "
        if is_async:
            content += "await "
        content += "main(None, state_json=state_json)\n"
        content += f"{tab}print(json.dumps(results, default=str, indent=2, ensure_ascii=False))\n"
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


def get_result_dicts_string(space: str, is_async: bool) -> str:
    """Get the result dicts string.

    Parameters
    ----------
    space : str
        The space string to use for indentation.
    is_async : bool
        Whether the function is asynchronous.

    Returns
    -------
    str
        The result dicts string.
    """
    flow_content = f"{space}for index, result in enumerate(results):\n"
    if not is_async:
        flow_content += f"{space}    result_dict = {{\n"
        flow_content += f"{space}        'index': index,\n"
        flow_content += f"{space}        'messages': result.messages,\n"
        flow_content += f"{space}        'summary': result.summary,\n"
        flow_content += f"{space}        'cost': result.cost.model_dump(mode='json', fallback=str) if result.cost else None,\n"
        flow_content += f"{space}        'context_variables': result.context_variables.model_dump(mode='json', fallback=str) if result.context_variables else None,\n"
        flow_content += f"{space}        'last_speaker': result.last_speaker,\n"
        flow_content += f"{space}        'uuid': str(result.uuid),\n"
        flow_content += f"{space}    }}\n"
    else:
        flow_content += f"{space}    result_dict = {{\n"
        flow_content += f"{space}        'index': index,\n"
        flow_content += f"{space}        'messages': await result.messages,\n"
        flow_content += f"{space}        'summary': await result.summary,\n"
        flow_content += f"{space}        'cost': (await result.cost).model_dump(mode='json', fallback=str) if await result.cost else None,\n"
        flow_content += f"{space}        'context_variables': (await result.context_variables).model_dump(mode='json', fallback=str) if await result.context_variables else None,\n"
        flow_content += (
            f"{space}        'last_speaker': await result.last_speaker,\n"
        )
        flow_content += f"{space}        'uuid': str(result.uuid),\n"
        flow_content += f"{space}    }}\n"
    flow_content += f"{space}    result_dicts.append(result_dict)\n"
    return flow_content
