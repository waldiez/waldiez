# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""LLM config argument utility functions for Waldiez agents."""

from waldiez.models import WaldiezAgent, WaldiezModel


def get_agent_llm_config_arg(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
    model_names: dict[str, str],
    cache_seed: int | None,
    as_dict: bool = False,
    tabs: int = 1,
) -> str:
    """Get the string representation of the agent's llm config argument.

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    all_models : list[WaldiezModel]
        All the models in the flow.
    model_names : dict[str, str]
        A mapping of model ids to model names.
    cache_seed : Optional[int]
        The cache seed.
    as_dict : bool, optional
        Whether to return the argument as a dictionary, by default False.
    tabs : int, optional
        The number of tabs for indentation, by default 1.

    Returns
    -------
    str
        The agent's llm config argument to use.
    """
    if as_dict is False:
        return _get_agent_llm_config_arg_as_arg(
            agent,
            all_models,
            model_names,
            cache_seed,
            tabs=tabs,
        )
    return _get_agent_llm_config_arg_as_dict(
        agent,
        all_models,
        model_names,
        cache_seed,
        tabs=tabs + 1,
    )


# noinspection DuplicatedCode
def _get_agent_llm_config_arg_as_arg(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
    model_names: dict[str, str],
    cache_seed: int | None,
    tabs: int = 1,
    tab_length: int = 4,
) -> str:
    tab = " " * tab_length * tabs if tabs > 0 else ""
    # tab = "    " * tabs if tabs > 0 else ""
    if not agent.data.model_ids:
        return f"{tab}llm_config=False," + "\n"
    content = f"{tab}llm_config=autogen.LLMConfig(" + "\n"
    content += f"{tab}    config_list=["
    got_at_least_one_model = False
    temperature: float | None = None
    for model_id in agent.data.model_ids:
        model = next((m for m in all_models if m.id == model_id), None)
        if model is not None:
            temperature = model.data.temperature
            model_name = model_names[model_id]
            content += "\n" + f"{tab}        {model_name}_llm_config,"
            got_at_least_one_model = True
    if not got_at_least_one_model:  # pragma: no cover
        return f"{tab}llm_config=False," + "\n"
    content += "\n" + f"{tab}    ]," + "\n"
    content += f"{tab}    cache_seed={cache_seed}," + "\n"
    if temperature is not None:
        content += f"{tab}    temperature={temperature}," + "\n"
    content += tab + "),\n"
    return content


# noinspection DuplicatedCode
def _get_agent_llm_config_arg_as_dict(
    agent: WaldiezAgent,
    all_models: list[WaldiezModel],
    model_names: dict[str, str],
    cache_seed: int | None,
    tabs: int = 1,
    tab_leng: int = 4,
) -> str:
    tab = " " * tab_leng * tabs if tabs > 0 else ""
    if not agent.data.model_ids:
        return f'{tab}"llm_config": False,' + "\n"
    content = f'{tab}"llm_config": autogen.LLMConfig(' + "\n"
    content += f"{tab}    config_list=["
    got_at_least_one_model = False
    temperature: float | None = None
    for model_id in agent.data.model_ids:
        model = next((m for m in all_models if m.id == model_id), None)
        if model is not None:  # pragma: no branch
            temperature = model.data.temperature
            model_name = model_names[model_id]
            content += "\n" + f"{tab}        {model_name}_llm_config,"
            got_at_least_one_model = True
    if not got_at_least_one_model:  # pragma: no cover
        return f'{tab}"llm_config": False,' + "\n"
    content += "\n" + f"{tab}    ]," + "\n"
    content += f"{tab}    cache_seed={cache_seed}," + "\n"
    if temperature is not None:
        content += f"{tab}    temperature={temperature}," + "\n"
    content += tab + "),\n"
    return content
