#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=broad-exception-caught,f-string-without-interpolation,invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,line-too-long,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,no-member,pointless-string-statement,too-complex,too-many-arguments,too-many-locals,too-many-try-statements
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,unknown-option-value,unused-argument,unused-import,unused-variable

# type: ignore

# pyright: reportArgumentType=false,reportAttributeAccessIssue=false,reportCallInDefaultInitializer=false,reportConstantRedefinition=false,reportDeprecated=false,reportDuplicateImport=false,reportMissingTypeStubs=false
# pyright: reportOperatorIssue=false,reportOptionalMemberAccess=false,reportPossiblyUnboundVariable=false,reportUnreachable=false,reportUnusedImport=false,reportUnknownArgumentType=false,reportUnknownMemberType=false
# pyright: reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false,reportUnusedParameter=false,reportUnusedVariable=false,reportUnknownVariableType=false

"""Hierarchical_Pattern.

A waldiez flow for the AG2 example on hierarchical pattern: https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/pattern-cookbook/hierarchical/
The Hierarchical, or Tree, Orchestration Pattern is a powerful approach to organizing multi-agent workflows, inspired by traditional organizational structures where work and information flow through a well-defined chain of command. This pattern creates a tree-structured arrangement of agents with clear levels of responsibility, specialization, and reporting relationships.

Requirements: ag2[openai]==0.10.3
Tags:
🧩 generated with ❤️ by Waldiez.
"""


# Imports

import asyncio
import csv
import importlib
import json
import os
import shutil
import sqlite3
import sys
import threading
import traceback
from dataclasses import asdict
from pathlib import Path
from pprint import pprint
from types import ModuleType
from typing import (
    Annotated,
    Any,
    Callable,
    Coroutine,
    Dict,
    List,
    Optional,
    Set,
    Tuple,
    TypedDict,
    Union,
)

import autogen  # type: ignore
from autogen import (
    Agent,
    Cache,
    ChatResult,
    ConversableAgent,
    GroupChat,
    UserProxyAgent,
    register_function,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, ReplyResult, run_group_chat
from autogen.agentchat.group import (
    AgentNameTarget,
    AgentTarget,
    ContextExpression,
    ContextVariables,
    ExpressionAvailableCondition,
    ExpressionContextCondition,
    OnCondition,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
    StringLLMCondition,
    TerminateTarget,
)
from autogen.agentchat.group.patterns import DefaultPattern
from autogen.agentchat.group.patterns.pattern import Pattern
from autogen.events import BaseEvent
from autogen.io.run_response import (
    AsyncRunResponseProtocol,
    RunResponseProtocol,
)
import numpy as np
from dotenv import load_dotenv

# Common environment variable setup for Waldiez flows
load_dotenv(override=True)
os.environ["AUTOGEN_USE_DOCKER"] = "0"
os.environ["TOGETHER_NO_BANNER"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
#
# let's try to avoid:
# module 'numpy' has no attribute '_no_nep50_warning'"
# ref: https://github.com/numpy/numpy/blob/v2.2.2/doc/source/release/2.2.0-notes.rst#nep-50-promotion-state-option-removed
os.environ["NEP50_DEPRECATION_WARNING"] = "0"
os.environ["NEP50_DISABLE_WARNING"] = "1"
os.environ["NPY_PROMOTION_STATE"] = "weak"
if not hasattr(np, "_no_pep50_warning"):

    import contextlib
    from typing import Generator

    @contextlib.contextmanager
    def _np_no_nep50_warning() -> Generator[None, None, None]:
        """Dummy function to avoid the warning.

        Yields
        ------
        None
            Nothing.
        """
        yield

    setattr(np, "_no_pep50_warning", _np_no_nep50_warning)  # noqa

# Start logging.


def start_logging() -> None:
    """Start logging."""
    runtime_logging.start(
        logger_type="sqlite",
        config={"dbname": "flow.db"},
    )


start_logging()

# Load model API keys
# NOTE:
# This section assumes that a file named:
# "hierarchical_pattern_api_keys.py"
# exists in the same directory as this file.
# This file contains the API keys for the models used in this flow.
# It should be .gitignored and not shared publicly.
# If this file is not present, you can either create it manually
# or change the way API keys are loaded in the flow.


def load_api_key_module(flow_name: str) -> ModuleType:
    """Load the api key module.

    Parameters
    ----------
    flow_name : str
        The flow name.

    Returns
    -------
    ModuleType
        The api keys loading module.
    """
    module_name = f"{flow_name}_api_keys"
    if module_name in sys.modules:
        return importlib.reload(sys.modules[module_name])
    return importlib.import_module(module_name)


__MODELS_MODULE__ = load_api_key_module("hierarchical_pattern")


def get_hierarchical_pattern_model_api_key(model_name: str) -> str:
    """Get the model api key.
    Parameters
    ----------
    model_name : str
        The model name.

    Returns
    -------
    str
        The model api key.
    """
    return __MODELS_MODULE__.get_hierarchical_pattern_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}


# Tools


def complete_solar_research(
    research_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Submit solar energy research findings"""
    context_variables["solar_research"] = research_content
    context_variables["specialist_a1_completed"] = True

    # Check if both specialists under Manager A have completed their tasks
    if (
        context_variables["specialist_a1_completed"]
        and context_variables["specialist_a2_completed"]
    ):
        context_variables["manager_a_completed"] = True

    return ReplyResult(
        message="Solar research completed and stored.",
        context_variables=context_variables,
        target=AgentTarget(renewable_manager),
    )


def complete_wind_research(
    research_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Submit wind energy research findings"""
    context_variables["wind_research"] = research_content
    context_variables["specialist_a2_completed"] = True

    # Check if both specialists under Manager A have completed their tasks
    if (
        context_variables["specialist_a1_completed"]
        and context_variables["specialist_a2_completed"]
    ):
        context_variables["manager_a_completed"] = True

    return ReplyResult(
        message="Wind research completed and stored.",
        context_variables=context_variables,
        target=AgentTarget(renewable_manager),
    )


def complete_hydro_research(
    research_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Submit hydroelectric energy research findings"""
    context_variables["hydro_research"] = research_content
    context_variables["specialist_b1_completed"] = True

    # Check if both specialists under Manager B have completed their tasks
    if (
        context_variables["specialist_b1_completed"]
        and context_variables["specialist_b2_completed"]
    ):
        context_variables["manager_b_completed"] = True

    return ReplyResult(
        message="Hydroelectric research completed and stored.",
        context_variables=context_variables,
        target=AgentTarget(storage_manager),
    )


def complete_geothermal_research(
    research_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Submit geothermal energy research findings"""
    context_variables["geothermal_research"] = research_content
    context_variables["specialist_b2_completed"] = True

    # Check if both specialists under Manager B have completed their tasks
    if (
        context_variables["specialist_b1_completed"]
        and context_variables["specialist_b2_completed"]
    ):
        context_variables["manager_b_completed"] = True

    return ReplyResult(
        message="Geothermal research completed and stored.",
        context_variables=context_variables,
        target=AgentTarget(storage_manager),
    )


def complete_biofuel_research(
    research_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Submit biofuel research findings"""
    context_variables["biofuel_research"] = research_content
    context_variables["specialist_c1_completed"] = True
    context_variables["manager_c_completed"] = True

    return ReplyResult(
        message="Biofuel research completed and stored.",
        context_variables=context_variables,
        target=AgentTarget(alternative_manager),
    )


def compile_renewable_section(
    section_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Compile the renewable energy section (solar and wind) for the final report"""
    context_variables["report_sections"]["renewable"] = section_content

    # Check if all managers have submitted their sections
    if all(
        key in context_variables["report_sections"]
        for key in ["renewable", "storage", "alternative"]
    ):
        context_variables["executive_review_ready"] = True
        return ReplyResult(
            message="Renewable energy section compiled. All sections are now ready for executive review.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )
    else:
        return ReplyResult(
            message="Renewable energy section compiled and stored.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )


def compile_storage_section(
    section_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Compile the energy storage section (hydro and geothermal) for the final report"""
    context_variables["report_sections"]["storage"] = section_content

    # Check if all managers have submitted their sections
    if all(
        key in context_variables["report_sections"]
        for key in ["renewable", "storage", "alternative"]
    ):
        context_variables["executive_review_ready"] = True
        return ReplyResult(
            message="Energy storage section compiled. All sections are now ready for executive review.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )
    else:
        return ReplyResult(
            message="Energy storage section compiled and stored.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )


def compile_alternative_section(
    section_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Compile the alternative energy section (biofuels) for the final report"""
    context_variables["report_sections"]["alternative"] = section_content

    # Check if all managers have submitted their sections
    if all(
        key in context_variables["report_sections"]
        for key in ["renewable", "storage", "alternative"]
    ):
        context_variables["executive_review_ready"] = True
        return ReplyResult(
            message="Alternative energy section compiled. All sections are now ready for executive review.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )
    else:
        return ReplyResult(
            message="Alternative energy section compiled and stored.",
            context_variables=context_variables,
            target=AgentTarget(executive_agent),
        )


def initiate_research(context_variables: ContextVariables) -> ReplyResult:
    """Initiate the research process by delegating to managers"""
    context_variables["task_started"] = True

    return ReplyResult(
        message="Research initiated. Tasks have been delegated to the renewable energy manager, storage manager, and alternative energy manager.",
        context_variables=context_variables,
    )


def compile_final_report(
    report_content: str, context_variables: ContextVariables
) -> ReplyResult:
    """Compile the final comprehensive report from all sections"""
    context_variables["final_report"] = report_content
    context_variables["task_completed"] = True

    return ReplyResult(
        message="Final report compiled successfully. The comprehensive renewable energy report is now complete.",
        context_variables=context_variables,
        target=AgentTarget(User),  # Return to user with final report
    )


# Models

gpt_4o_mini_llm_config: dict[str, Any] = {
    "model": "gpt-4o-mini",
    "api_type": "openai",
    "api_key": get_hierarchical_pattern_model_api_key("gpt_4o_mini"),
}

# Agents

User = UserProxyAgent(
    name="User",
    description="A new User agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=False,
)

__AGENTS__["User"] = User

alternative_manager = ConversableAgent(
    name="alternative_manager",
    description="A new Assistant agent",
    system_message="You are the manager for alternative energy solutions, overseeing biofuel research.\n        Your responsibilities include:\n        1. Reviewing the research from your specialist\n        2. Ensuring the information is accurate and comprehensive\n        3. Synthesizing the information into a cohesive section on alternative energy solutions\n        4. Submitting the compiled research to the executive for final report creation\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        compile_alternative_section,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["alternative_manager"] = alternative_manager

biofuel_specialist = ConversableAgent(
    name="biofuel_specialist",
    description="A new Assistant agent",
    system_message="You are a specialist in biofuel technologies.\n        Your task is to research and provide concise information about:\n        1. Current state of biofuel technology\n        2. Types of biofuels and their applications\n        3. Cost comparison with fossil fuels\n        4. Major companies and countries leading in biofuel production\n\n        Be thorough but concise. Your research will be used as part of a larger report.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        complete_biofuel_research,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["biofuel_specialist"] = biofuel_specialist

executive_agent = ConversableAgent(
    name="executive_agent",
    description="A new Assistant agent",
    system_message="You are the executive overseeing the creation of a comprehensive report on renewable energy technologies.\n\n        You have exactly three manager agents reporting to you, each responsible for specific technology domains:\n        1. Renewable Manager - Oversees solar and wind energy research\n        2. Storage Manager - Oversees hydroelectric and geothermal energy research\n        3. Alternative Manager - Oversees biofuel research\n\n        Your responsibilities include:\n        1. Delegating research tasks to these three specific manager agents\n        2. Providing overall direction and ensuring alignment with the project goals\n        3. Reviewing the compiled sections from each manager\n        4. Synthesizing all sections into a cohesive final report with executive summary\n        5. Ensuring the report is comprehensive, balanced, and meets high-quality standards\n\n        Do not create or attempt to delegate to managers that don't exist in this structure.\n\n        The final report should include:\n        - Executive Summary\n        - Introduction to Renewable Energy\n        - Three main sections:\n        * Solar and Wind Energy (from Renewable Manager)\n        * Hydroelectric and Geothermal Energy (from Storage Manager)\n        * Biofuel Technologies (from Alternative Manager)\n        - Comparison of technologies\n        - Future outlook and recommendations",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        initiate_research,
        compile_final_report,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["executive_agent"] = executive_agent

geothermal_specialist = ConversableAgent(
    name="geothermal_specialist",
    description="A new Assistant agent",
    system_message="You are a specialist in geothermal energy technologies.\n        Your task is to research and provide concise information about:\n        1. Current state of geothermal technology\n        2. Types of geothermal systems and efficiency rates\n        3. Cost comparison with fossil fuels\n        4. Major companies and countries leading in geothermal energy\n\n        Be thorough but concise. Your research will be used as part of a larger report.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        complete_geothermal_research,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["geothermal_specialist"] = geothermal_specialist

hydro_specialist = ConversableAgent(
    name="hydro_specialist",
    description="A new Assistant agent",
    system_message="You are a specialist in hydroelectric energy technologies.\n        Your task is to research and provide concise information about:\n        1. Current state of hydroelectric technology\n        2. Types of hydroelectric generation (dams, run-of-river, pumped storage)\n        3. Cost comparison with fossil fuels\n        4. Major companies and countries leading in hydroelectric energy\n\n        Be thorough but concise. Your research will be used as part of a larger report.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        complete_hydro_research,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["hydro_specialist"] = hydro_specialist

renewable_manager = ConversableAgent(
    name="renewable_manager",
    description="A new Assistant agent",
    system_message="You are the manager for renewable energy research, specifically overseeing solar and wind energy specialists.\n        Your responsibilities include:\n        1. Reviewing the research from your specialists\n        2. Ensuring the information is accurate and comprehensive\n        3. Synthesizing the information into a cohesive section on renewable energy\n        4. Submitting the compiled research to the executive for final report creation\n\n        You should wait until both specialists have completed their research before compiling your section.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        compile_renewable_section,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["renewable_manager"] = renewable_manager

solar_specialist = ConversableAgent(
    name="solar_specialist",
    description="A new Assistant agent",
    system_message="You are a specialist in solar energy technologies.\n        Your task is to research and provide concise information about:\n        1. Current state of solar technology\n        2. Efficiency rates of different types of solar panels\n        3. Cost comparison with fossil fuels\n        4. Major companies and countries leading in solar energy\n\n        Be thorough but concise. Your research will be used as part of a larger report.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        complete_solar_research,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["solar_specialist"] = solar_specialist

storage_manager = ConversableAgent(
    name="storage_manager",
    description="A new Assistant agent",
    system_message="You are the manager for energy storage and hydroelectric technologies, overseeing hydroelectric and geothermal energy specialists.\n        Your responsibilities include:\n        1. Reviewing the research from your specialists\n        2. Ensuring the information is accurate and comprehensive\n        3. Synthesizing the information into a cohesive section on energy storage and hydroelectric solutions\n        4. Submitting the compiled research to the executive for final report creation\n\n        You should wait until both specialists have completed their research before compiling your section.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        compile_storage_section,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["storage_manager"] = storage_manager

wind_specialist = ConversableAgent(
    name="wind_specialist",
    description="A new Assistant agent",
    system_message="You are a specialist in wind energy technologies.\n        Your task is to research and provide concise information about:\n        1. Current state of wind technology (onshore/offshore)\n        2. Efficiency rates of modern wind turbines\n        3. Cost comparison with fossil fuels\n        4. Major companies and countries leading in wind energy\n\n        Be thorough but concise. Your research will be used as part of a larger report.\n\n        Use your tools only one at a time.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        complete_wind_research,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4o_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["wind_specialist"] = wind_specialist

alternative_manager.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(biofuel_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${specialist_c1_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
alternative_manager.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(executive_agent),
        condition=StringLLMCondition(
            prompt="Return to the executive with the compiled alternative energy section"
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${manager_c_completed} == True")
        ),
    )
)

biofuel_specialist.handoffs.set_after_work(
    target=AgentTarget(alternative_manager)
)

executive_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(renewable_manager),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${manager_a_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
executive_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(storage_manager),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${manager_b_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
executive_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(alternative_manager),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${manager_c_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
executive_agent.handoffs.set_after_work(target=RevertToUserTarget())

geothermal_specialist.handoffs.set_after_work(
    target=AgentTarget(renewable_manager)
)

hydro_specialist.handoffs.set_after_work(target=AgentTarget(storage_manager))

renewable_manager.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(solar_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${specialist_a1_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
renewable_manager.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(wind_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${specialist_a2_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
renewable_manager.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(executive_agent),
        condition=StringLLMCondition(
            prompt="Return to the executive after your report has been compiled."
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${manager_a_completed} == True")
        ),
    )
)
renewable_manager.handoffs.set_after_work(target=AgentTarget(executive_agent))

solar_specialist.handoffs.set_after_work(target=AgentTarget(renewable_manager))

storage_manager.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(hydro_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${specialist_b1_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
storage_manager.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(geothermal_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("not(${specialist_b2_completed})")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${task_started} == True")
        ),
    )
)
storage_manager.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(executive_agent),
        condition=StringLLMCondition(
            prompt="Return to the executive after your report has been compiled."
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("${manager_b_completed} == True")
        ),
    )
)
storage_manager.handoffs.set_after_work(target=AgentTarget(executive_agent))

wind_specialist.handoffs.set_after_work(target=AgentTarget(renewable_manager))

Manager_pattern = DefaultPattern(
    initial_agent=executive_agent,
    agents=[
        solar_specialist,
        wind_specialist,
        hydro_specialist,
        geothermal_specialist,
        biofuel_specialist,
        renewable_manager,
        storage_manager,
        alternative_manager,
        executive_agent,
    ],
    user_agent=User,
    group_manager_args={
        "llm_config": False,
        "name": "Manager",
    },
    context_variables=ContextVariables(
        data={
            "task_started": False,
            "task_completed": False,
            "executive_review_ready": False,
            "manager_a_completed": False,
            "manager_b_completed": False,
            "manager_c_completed": False,
            "specialist_a1_completed": False,
            "specialist_a2_completed": False,
            "specialist_b1_completed": False,
            "specialist_c1_completed": False,
            "specialist_b2_completed": False,
            "solar_research": "",
            "wind_research": "",
            "hydro_research": "",
            "geothermal_research": "",
            "biofuel_research": "",
            "report_sections": {},
            "final_report": "",
        }
    ),
    group_after_work=TerminateTarget(),
)

__INITIAL_MSG__ = "We need a comprehensive report on the current state of renewable energy technologies. Please coordinate the research and compilation of this report."

__GROUP__["patterns"]["Manager_pattern"] = Manager_pattern


def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
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
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        conn = sqlite3.connect(dbname)
    except BaseException:
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:
        conn.close()
        return
    try:
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        cursor.close()
        conn.close()
    except BaseException:
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass
        return
    try:
        with open(csv_file, "w", newline="", encoding="utf-8") as file:
            csv_writer = csv.DictWriter(file, fieldnames=column_names)
            csv_writer.writeheader()
            csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        with open(json_file, "w", encoding="utf-8", newline="\n") as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    except BaseException:
        return


def stop_logging() -> None:
    """Stop logging."""
    runtime_logging.stop()
    if not os.path.exists("logs"):
        try:
            os.makedirs("logs", exist_ok=True)
        except BaseException:
            pass
    for table in [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]:
        dest = os.path.join("logs", f"{table}.csv")
        get_sqlite_out("flow.db", table, dest)


def _check_for_extra_agents(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _agent_cls_name = agent.__class__.__name__
    if _agent_cls_name == "CaptainAgent":
        _assistant_agent = getattr(agent, "assistant", None)
        if _assistant_agent and _assistant_agent not in _extra_agents:
            _extra_agents.append(_assistant_agent)
        _executor_agent = getattr(agent, "executor", None)
        if _executor_agent and _executor_agent not in _extra_agents:
            _extra_agents.append(_executor_agent)
    return _extra_agents


def _check_for_group_members(agent: ConversableAgent) -> list[ConversableAgent]:
    _extra_agents: list[ConversableAgent] = []
    _group_chat = getattr(agent, "_groupchat", None)
    if _group_chat:
        _chat_agents = getattr(_group_chat, "agents", [])
        if isinstance(_chat_agents, list):
            for _group_member in _chat_agents:
                if _group_member not in _extra_agents:
                    _extra_agents.append(_group_member)
    _manager = getattr(agent, "_group_manager", None)
    if _manager:
        if _manager not in _extra_agents:
            _extra_agents.append(_manager)
        for _group_member in _check_for_group_members(_manager):
            if _group_member not in _extra_agents:
                _extra_agents.append(_group_member)
    return _extra_agents


def _get_known_agents() -> list[ConversableAgent]:
    _known_agents: list[ConversableAgent] = []
    if User not in _known_agents:
        _known_agents.append(User)
    _known_agents.append(User)
    for _group_member in _check_for_group_members(User):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(User):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if solar_specialist not in _known_agents:
        _known_agents.append(solar_specialist)
    _known_agents.append(solar_specialist)
    for _group_member in _check_for_group_members(solar_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(solar_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if wind_specialist not in _known_agents:
        _known_agents.append(wind_specialist)
    _known_agents.append(wind_specialist)
    for _group_member in _check_for_group_members(wind_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(wind_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if hydro_specialist not in _known_agents:
        _known_agents.append(hydro_specialist)
    _known_agents.append(hydro_specialist)
    for _group_member in _check_for_group_members(hydro_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(hydro_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if geothermal_specialist not in _known_agents:
        _known_agents.append(geothermal_specialist)
    _known_agents.append(geothermal_specialist)
    for _group_member in _check_for_group_members(geothermal_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(geothermal_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if biofuel_specialist not in _known_agents:
        _known_agents.append(biofuel_specialist)
    _known_agents.append(biofuel_specialist)
    for _group_member in _check_for_group_members(biofuel_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(biofuel_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if renewable_manager not in _known_agents:
        _known_agents.append(renewable_manager)
    _known_agents.append(renewable_manager)
    for _group_member in _check_for_group_members(renewable_manager):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(renewable_manager):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if storage_manager not in _known_agents:
        _known_agents.append(storage_manager)
    _known_agents.append(storage_manager)
    for _group_member in _check_for_group_members(storage_manager):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(storage_manager):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if alternative_manager not in _known_agents:
        _known_agents.append(alternative_manager)
    _known_agents.append(alternative_manager)
    for _group_member in _check_for_group_members(alternative_manager):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(alternative_manager):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if executive_agent not in _known_agents:
        _known_agents.append(executive_agent)
    _known_agents.append(executive_agent)
    for _group_member in _check_for_group_members(executive_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(executive_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)
    return _known_agents


def store_error(exc: BaseException | None = None) -> None:
    """Store the error in error.json.

    Parameters
    ----------
    exc : BaseException | None
        The exception we got if any.
    """
    reason = (
        "Event handler stopped processing"
        if not exc
        else traceback.format_exc()
    )
    try:
        with open("error.json", "w", encoding="utf-8", newline="\n") as file:
            file.write(json.dumps({"error": reason}))
    except BaseException:  # pylint: disable=broad-exception-caught
        pass


def store_results(result_dicts: list[dict[str, Any]]) -> None:
    """Store the results to results.json.
    Parameters
    ----------
    result_dicts : list[dict[str, Any]]
        The list of the results.
    """
    try:
        with open("results.json", "w", encoding="utf-8", newline="\n") as file:
            file.write(
                json.dumps(
                    {'results': result_dicts}, indent=4, ensure_ascii=False
                )
            )
    except BaseException:  # pylint: disable=broad-exception-caught
        pass


def _get_agent_by_name(
    agents: list[ConversableAgent], agent_name: str
) -> tuple[int, ConversableAgent | None]:
    """Get an agent by its name."""
    for ind, agent in enumerate(agents):
        if agent.name == agent_name:
            return ind, agent
    return -1, None


def _handle_resume_group_pattern(
    detected_pattern: Pattern, state_messages: list[dict[str, Any]]
) -> None:
    """Handle detected pattern for resuming a group chat."""
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        _pattern_type = getattr(detected_pattern.__class__, "__name__", None)
    except BaseException:
        return
    if _pattern_type == "RoundRobinPattern" and state_messages:
        last_message = state_messages[-1]
        if not last_message or not isinstance(last_message, dict):
            return
        last_agent_name = last_message.get("name", "")
        if not last_agent_name:
            return
        try:
            idx, last_agent = _get_agent_by_name(
                detected_pattern.agents, last_agent_name
            )
            if last_agent and len(detected_pattern.agents) >= (idx + 1):
                detected_pattern.agents.append(detected_pattern.user_agent)
                detected_pattern.initial_agent = detected_pattern.agents[
                    idx + 1
                ]
                detected_pattern.user_agent = detected_pattern.agents[idx]
                # fmt: off
                new_agent_order_list = detected_pattern.agents[idx+1:] + detected_pattern.agents[:idx]
                # fmt: on
                detected_pattern.agents = new_agent_order_list
        except BaseException:
            pass


def _prepare_resume(state_json: str | Path | None = None) -> None:
    """Prepare resuming a chat from state.json.

    state.json format:
        {
            "messages": [{"content": "..", "role": "...", "name": "..."}],
            "context_variables": {"key1": "value1", "key2": 4, "key3": [], "key4": {"other": "key"}}
        }
    metadata.json format:
        {
            "type": "group",
            "group": {  # one of:
                "pattern" : "<pattern_name>",
                "manager" : "<manager_name>",
            }
        }

    Parameters
    ----------
    state_json : str | Path | None
        The path to state.json to load previous state.
    """
    # pylint: disable=broad-exception-caught,too-many-try-statements,global-statement
    global __INITIAL_MSG__
    if not state_json or not Path(state_json).is_file():
        return
    metadata_json = str(state_json).replace("state.json", "metadata.json")
    if not metadata_json or not Path(metadata_json).is_file():
        return
    try:
        with open(metadata_json, "r", encoding="utf-8") as f:
            _metadata_dict = json.load(f)
    except BaseException:
        return
    if not _metadata_dict or not isinstance(_metadata_dict, dict):
        return
    _state_chat_type = _metadata_dict.get("type", "")
    if _state_chat_type != "group":
        # only resume group chats
        return
    _state_group_details = _metadata_dict.get("group", {})
    if not _state_group_details or not isinstance(_state_group_details, dict):
        return
    # either pattern or manager
    _state_group_pattern = _state_group_details.get("pattern", "")
    _state_group_manager = _state_group_details.get("manager", "")
    if not _state_group_pattern and not _state_group_manager:
        return
    try:
        with open(state_json, "r", encoding="utf-8") as f:
            _state_dict = json.load(f)
    except BaseException:
        return
    if not _state_dict or not isinstance(_state_dict, dict):
        return
    _state_messages = _state_dict.get("messages", [])
    _detected_pattern = None
    if _state_group_pattern and isinstance(_state_group_pattern, str):
        _detected_pattern = __GROUP__["patterns"].get(
            _state_group_pattern, None
        )
        if _detected_pattern:
            _state_context_variables = _state_dict.get("context_variables", {})
            if _state_context_variables and isinstance(
                _state_context_variables, dict
            ):
                _new_context_variables = (
                    _detected_pattern.context_variables.data.copy()
                )
                _new_context_variables.update(_state_context_variables)
                _detected_pattern.context_variables = ContextVariables(
                    data=_new_context_variables
                )
        if _state_messages and isinstance(_state_messages, list):
            __INITIAL_MSG__ = _state_messages
    elif _state_group_manager and isinstance(_state_group_manager, str):
        _known_group_manager = __AGENTS__.get(_state_group_manager, None)
        if _known_group_manager and hasattr(_known_group_manager, "groupchat"):
            if _state_messages and isinstance(_state_messages, list):
                _known_group_manager.groupchat.messages = _state_messages
        else:
            _detected_pattern = __GROUP__["patterns"].get(
                f"{_state_group_manager}_pattern"
            )
            if _detected_pattern:
                _state_context_variables = _state_dict.get(
                    "context_variables", {}
                )
                if _state_context_variables and isinstance(
                    _state_context_variables, dict
                ):
                    _new_context_variables = (
                        _detected_pattern.context_variables.data.copy()
                    )
                    _new_context_variables.update(_state_context_variables)
                    _detected_pattern.context_variables = ContextVariables(
                        data=_new_context_variables
                    )
            if _state_messages and isinstance(_state_messages, list):
                __INITIAL_MSG__ = _state_messages
    if (
        _detected_pattern
        and _state_messages
        and isinstance(_state_messages, list)
    ):
        _handle_resume_group_pattern(_detected_pattern, _state_messages)


# Start chatting


def main(
    on_event: Callable[[BaseEvent, list[ConversableAgent]], bool] | None = None,
    state_json: str | Path | None = None,
) -> list[dict[str, Any]]:
    """Start chatting.

    Returns
    -------
    list[dict[str, Any]]
        The result of the chat session.

    Raises
    ------
    SystemExit
        If the user interrupts the chat session.
    """
    if state_json:
        _prepare_resume(state_json)
    results: list[RunResponseProtocol] | RunResponseProtocol = []
    result_dicts: list[dict[str, Any]] = []
    a_pause_event = asyncio.Event()
    a_pause_event.set()
    pause_event = threading.Event()
    pause_event.set()
    with Cache.disk(cache_seed=42) as cache:
        results = run_group_chat(
            pattern=Manager_pattern,
            messages=__INITIAL_MSG__,
            max_rounds=50,
            pause_event=pause_event,
        )
        if not isinstance(results, list):
            results = [results]  # pylint: disable=redefined-variable-type
        got_agents = False
        known_agents: list[ConversableAgent] = []
        result_events: list[dict[str, Any]] = []
        if on_event:
            for index, result in enumerate(results):
                result_events = []
                for event in result.events:
                    try:
                        result_events.append(
                            event.model_dump(mode="json", fallback=str)
                        )
                    except (
                        BaseException
                    ):  # pylint: disable=broad-exception-caught
                        pass
                    if not got_agents:
                        known_agents = _get_known_agents()
                        got_agents = True
                    pause_event.clear()
                    try:
                        should_continue = on_event(event, known_agents)
                        pause_event.set()
                    except BaseException as e:
                        stop_logging()
                        store_error(e)
                        raise SystemExit(
                            "Error in event handler: " + str(e)
                        ) from e
                    if getattr(event, "type") == "run_completion":
                        break
                    if not should_continue:
                        stop_logging()
                        store_error()
                        raise SystemExit("Event handler stopped processing")
                result_cost = result.cost
                result_context_variables = result.context_variables
                result_dict = {
                    "index": index,
                    "uuid": str(result.uuid),
                    "events": result_events,
                    "messages": result.messages,
                    "summary": result.summary,
                    "cost": (
                        result_cost.model_dump(mode="json", fallback=str)
                        if result_cost
                        else None
                    ),
                    "context_variables": (
                        result_context_variables.model_dump(
                            mode="json", fallback=str
                        )
                        if result_context_variables
                        else None
                    ),
                    "last_speaker": result.last_speaker,
                }
                result_dicts.append(result_dict)
        else:
            for index, result in enumerate(results):
                result_events = []
                # result.process()
                for event in result.events:
                    try:
                        result_events.append(
                            event.model_dump(mode="json", fallback=str)
                        )
                    except (
                        BaseException
                    ):  # pylint: disable=broad-exception-caught
                        pass
                result_cost = result.cost
                result_context_variables = result.context_variables
                result_dict = {
                    "index": index,
                    "uuid": str(result.uuid),
                    "events": result_events,
                    "messages": result.messages,
                    "summary": result.summary,
                    "cost": (
                        result_cost.model_dump(mode="json", fallback=str)
                        if result_cost
                        else None
                    ),
                    "context_variables": (
                        result_context_variables.model_dump(
                            mode="json", fallback=str
                        )
                        if result_context_variables
                        else None
                    ),
                    "last_speaker": result.last_speaker,
                }
                result_dicts.append(result_dict)

        stop_logging()
    store_results(result_dicts)
    return result_dicts


def call_main() -> None:
    """Run the main function and print the results."""
    state_json: str | Path | None = None
    if "--state" in sys.argv:
        entry_index = sys.argv.index("--state")
        if entry_index + 1 < len(sys.argv):
            state_location = Path(sys.argv[entry_index + 1])
            if state_location.resolve().exists():
                state_json = state_location
    results: list[dict[str, Any]] = main(None, state_json=state_json)
    print(json.dumps(results, default=str, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    # Let's go!
    call_main()
