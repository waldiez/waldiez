#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=broad-exception-caught,f-string-without-interpolation,invalid-name,import-error,import-outside-toplevel,inconsistent-quotes,line-too-long,missing-function-docstring
# pylint: disable=missing-param-doc,missing-return-doc,no-member,pointless-string-statement,too-complex,too-many-arguments,too-many-locals,too-many-try-statements
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,unknown-option-value,unused-argument,unused-import,unused-variable

# type: ignore

# pyright: reportArgumentType=false,reportAttributeAccessIssue=false,reportCallInDefaultInitializer=false,reportConstantRedefinition=false,reportDeprecated=false,reportDuplicateImport=false,reportMissingTypeStubs=false
# pyright: reportOperatorIssue=false,reportOptionalMemberAccess=false,reportPossiblyUnboundVariable=false,reportUnreachable=false,reportUnusedImport=false,reportUnknownArgumentType=false,reportUnknownMemberType=false
# pyright: reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false,reportUnusedParameter=false,reportUnusedVariable=false,reportUnknownVariableType=false

"""Context-Aware Routing.

A waldiez implementation of AG2 example: https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/pattern-cookbook/context_aware_routing/
The Context-Aware Routing Pattern creates a dynamic workflow where tasks are intelligently distributed to specialized agents based on content analysis rather than predetermined paths. Unlike static patterns with fixed routes, this approach analyzes each request in real-time to determine the most appropriate specialist, ensuring queries are handled by agents with the most relevant expertise while maintaining conversation continuity even as topics shift across domains.

Requirements: ag2[openai]==0.10.1
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
from autogen.agentchat import GroupChatManager, run_group_chat
from autogen.agentchat.group import (
    AgentTarget,
    ContextExpression,
    ContextVariables,
    ExpressionAvailableCondition,
    ExpressionContextCondition,
    OnContextCondition,
    ReplyResult,
    RevertToUserTarget,
)
from autogen.agentchat.group.patterns import DefaultPattern
from autogen.agentchat.group.patterns.pattern import Pattern
from autogen.agentchat.group.targets.transition_target import (
    AgentNameTarget,
    AgentTarget,
    RevertToUserTarget,
)
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
# "Context_Aware_Routin_api_keys.py"
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


__MODELS_MODULE__ = load_api_key_module("Context_Aware_Routin")


def get_Context_Aware_Routin_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_Context_Aware_Routin_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}


# Tools


def analyze_request(
    request: Annotated[str, "The user request text to analyze"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Analyze a user request to determine routing based on content
    Updates context variables with routing information
    """
    context_variables["question_answered"] = False

    # Update request tracking
    context_variables["routing_started"] = True
    context_variables["request_count"] += 1
    context_variables["current_request"] = request

    # Previous domain becomes part of history
    if context_variables["current_domain"]:
        prev_domain = context_variables["current_domain"]
        context_variables["previous_domains"].append(prev_domain)
        if prev_domain in context_variables["domain_history"]:
            context_variables["domain_history"][prev_domain] += 1
        else:
            context_variables["domain_history"][prev_domain] = 1

    # Reset current_domain to be determined by the router
    context_variables["current_domain"] = None

    return ReplyResult(
        message=f"Request analyzed. Will determine the best specialist to handle: '{request}'",
        context_variables=context_variables,
    )


def route_to_tech_specialist(
    confidence: Annotated[int, "Confidence level for tech domain (1-10)"],
    reasoning: Annotated[str, "Reasoning for routing to tech specialist"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Route the current request to the technology specialist
    """
    context_variables["current_domain"] = "technology"
    context_variables["domain_confidence"]["technology"] = confidence
    context_variables["tech_invocations"] += 1

    return ReplyResult(
        target=AgentTarget(agent=tech_specialist),
        message=f"Routing to tech specialist with confidence {confidence}/10. Reasoning: {reasoning}",
        context_variables=context_variables,
    )


def route_to_finance_specialist(
    confidence: Annotated[int, "Confidence level for finance domain (1-10)"],
    reasoning: Annotated[str, "Reasoning for routing to finance specialist"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Route the current request to the finance specialist
    """
    context_variables["current_domain"] = "finance"
    context_variables["domain_confidence"]["finance"] = confidence
    context_variables["finance_invocations"] += 1

    return ReplyResult(
        # target=AgentTarget(finance_specialist),
        target=AgentNameTarget(agent_name="finance_specialist"),
        message=f"Routing to finance specialist with confidence {confidence}/10. Reasoning: {reasoning}",
        context_variables=context_variables,
    )


def route_to_healthcare_specialist(
    confidence: Annotated[int, "Confidence level for healthcare domain (1-10)"],
    reasoning: Annotated[str, "Reasoning for routing to healthcare specialist"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Route the current request to the healthcare specialist
    """
    context_variables["current_domain"] = "healthcare"
    context_variables["domain_confidence"]["healthcare"] = confidence
    context_variables["healthcare_invocations"] += 1

    return ReplyResult(
        target=AgentTarget(agent=healthcare_specialist),
        message=f"Routing to healthcare specialist with confidence {confidence}/10. Reasoning: {reasoning}",
        context_variables=context_variables,
    )


def route_to_general_specialist(
    confidence: Annotated[int, "Confidence level for general domain (1-10)"],
    reasoning: Annotated[
        str, "Reasoning for routing to general knowledge specialist"
    ],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Route the current request to the general knowledge specialist
    """
    context_variables["current_domain"] = "general"
    context_variables["domain_confidence"]["general"] = confidence
    context_variables["general_invocations"] += 1

    return ReplyResult(
        target=AgentTarget(agent=general_specialist),
        message=f"Routing to general knowledge specialist with confidence {confidence}/10. Reasoning: {reasoning}",
        context_variables=context_variables,
    )


def provide_tech_response(
    response: Annotated[str, "The specialist's response to the request"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Submit a response from the technology specialist
    """
    # Record the question and response
    context_variables["question_responses"].append(
        {
            "domain": "technology",
            "question": context_variables["current_request"],
            "response": response,
        }
    )
    context_variables["question_answered"] = True

    return ReplyResult(
        message="Technology specialist response provided.",
        context_variables=context_variables,
    )


def provide_finance_response(
    response: Annotated[str, "The specialist's response to the request"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Submit a response from the finance specialist
    """
    # Record the question and response
    context_variables["question_responses"].append(
        {
            "domain": "finance",
            "question": context_variables["current_request"],
            "response": response,
        }
    )
    context_variables["question_answered"] = True

    return ReplyResult(
        message="Finance specialist response provided.",
        context_variables=context_variables,
    )


def provide_healthcare_response(
    response: Annotated[str, "The specialist's response to the request"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Submit a response from the healthcare specialist
    """
    # Record the question and response
    context_variables["question_responses"].append(
        {
            "domain": "healthcare",
            "question": context_variables["current_request"],
            "response": response,
        }
    )
    context_variables["question_answered"] = True

    return ReplyResult(
        message="Healthcare specialist response provided.",
        context_variables=context_variables,
    )


def provide_general_response(
    response: Annotated[str, "The specialist's response to the request"],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Submit a response from the general knowledge specialist
    """
    # Record the question and response
    context_variables["question_responses"].append(
        {
            "domain": "general",
            "question": context_variables["current_request"],
            "response": response,
        }
    )
    context_variables["question_answered"] = True

    return ReplyResult(
        message="General knowledge specialist response provided.",
        context_variables=context_variables,
    )


# Function for follow-up clarification if needed
def request_clarification(
    clarification_question: Annotated[
        str, "Question to ask user for clarification"
    ],
    context_variables: ContextVariables,
) -> ReplyResult:
    """
    Request clarification from the user when the query is ambiguous
    """
    return ReplyResult(
        message=f"Further clarification is required to determine the correct domain: {clarification_question}",
        context_variables=context_variables,
        target=RevertToUserTarget(),
    )


# Models

gpt_4_1_mini_llm_config: dict[str, Any] = {
    "model": "gpt-4.1-mini",
    "api_type": "openai",
    "api_key": get_Context_Aware_Routin_model_api_key("gpt_4_1_mini"),
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

finance_specialist = ConversableAgent(
    name="finance_specialist",
    description="A new Assistant agent",
    system_message="You are the finance specialist with deep expertise in personal finance, investments, banking, budgeting, financial planning, taxes, economics, and business finance.\n\n    When responding to queries in your domain:\n    1. Provide accurate financial information and advice based on sound financial principles\n    2. Explain financial concepts clearly without excessive jargon\n    3. Present balanced perspectives on financial decisions, acknowledging risks and benefits\n    4. Avoid making specific investment recommendations but provide educational information about investment types\n    5. Include relevant financial principles, terms, or calculations when appropriate\n\n    Focus on being informative, balanced, and helpful. If a query contains elements outside your domain of expertise, focus on the financial aspects while acknowledging the broader context.\n\n    Use the provide_finance_response tool to submit your final response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        provide_finance_response,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["finance_specialist"] = finance_specialist

general_specialist = ConversableAgent(
    name="general_specialist",
    description="A new Assistant agent",
    system_message="You are the general knowledge specialist with broad expertise across multiple domains and topics.\n\n    When responding to queries in your domain:\n    1. Provide comprehensive information drawing from relevant knowledge domains\n    2. Handle questions that span multiple domains or don't clearly fit into a specialized area\n    3. Synthesize information from different fields when appropriate\n    4. Provide balanced perspectives on complex topics\n    5. Address queries about history, culture, society, ethics, environment, education, arts, and other general topics\n\n    Focus on being informative, balanced, and helpful. For questions that might benefit from deeper domain expertise, acknowledge this while providing the best general information possible.\n\n    Use the provide_general_response tool to submit your final response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        provide_general_response,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["general_specialist"] = general_specialist

healthcare_specialist = ConversableAgent(
    name="healthcare_specialist",
    description="A new Assistant agent",
    system_message="You are the healthcare specialist with deep expertise in health, medicine, fitness, nutrition, diseases, medical conditions, and wellness.\n\n    When responding to queries in your domain:\n    1. Provide accurate health information based on current medical understanding\n    2. Explain medical concepts in clear, accessible language\n    3. Include preventive advice and best practices for health management when appropriate\n    4. Reference relevant health principles, systems, or processes\n    5. Always clarify that you're providing general information, not personalized medical advice\n\n    Focus on being informative, accurate, and helpful. If a query contains elements outside your domain of expertise, focus on the health aspects while acknowledging the broader context.\n\n    Use the provide_healthcare_response tool to submit your final response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        provide_healthcare_response,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["healthcare_specialist"] = healthcare_specialist

router_agent = ConversableAgent(
    name="router_agent",
    description="A new Assistant agent",
    system_message="You are the routing agent responsible for analyzing user requests and directing them to the most appropriate specialist.\n\n    Your task is to carefully analyze each user query and determine which domain specialist would be best equipped to handle it:\n\n    1. Technology Specialist: For questions about computers, software, programming, IT issues, electronics, digital tools, internet, etc. Use route_to_tech_specialist to transfer.\n    2. Finance Specialist: For questions about money, investments, banking, budgeting, financial planning, taxes, economics, etc. Use route_to_finance_specialist to transfer.\n    3. Healthcare Specialist: For questions about health, medicine, fitness, nutrition, diseases, medical conditions, wellness, etc. Use route_to_healthcare_specialist to transfer.\n    4. General Knowledge Specialist: For general questions that don't clearly fit the other categories or span multiple domains. Use route_to_general_specialist to transfer.\n\n    For each query, you must:\n    1. Use the analyze_request tool to process the query and update context\n    2. Determine the correct domain by analyzing keywords, themes, and context\n    3. Consider the conversation history and previous domains if available\n    4. Route to the most appropriate specialist using the corresponding routing tool\n\n    When routing:\n    - Provide a confidence level (1-10) based on how certain you are about the domain\n    - Include detailed reasoning for your routing decision\n    - If a query seems ambiguous or spans multiple domains, route to the specialist who can best handle the primary intent\n\n    Always maintain context awareness by considering:\n    - Current query content and intent\n    - Previously discussed topics\n    - User's possible follow-up patterns\n    - Domain switches that might indicate changing topics\n\n    After a specialist has provided an answer, output the question and answer.\n\n    For ambiguous queries that could belong to multiple domains:\n    - If you are CERTAIN that the query is multi-domain but has a primary focus, route to the specialist for that primary domain\n    - If you are NOT CERTAIN and there is no clear primary domain, use the request_clarification tool to ask the user for more specifics\n    - When a query follows up on a previous topic, consider maintaining consistency by routing to the same specialist unless the domain has clearly changed",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        analyze_request,
        route_to_finance_specialist,
        route_to_healthcare_specialist,
        route_to_tech_specialist,
        route_to_general_specialist,
        request_clarification,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["router_agent"] = router_agent

tech_specialist = ConversableAgent(
    name="tech_specialist",
    description="A new Assistant agent",
    system_message="You are the technology specialist with deep expertise in computers, software, programming, IT, electronics, digital tools, and internet technologies.\n\n    When responding to queries in your domain:\n    1. Provide accurate, technical information based on current industry knowledge\n    2. Explain complex concepts in clear terms appropriate for the user's apparent level of technical understanding\n    3. Include practical advice, troubleshooting steps, or implementation guidance when applicable\n    4. Reference relevant technologies, programming languages, frameworks, or tools as appropriate\n    5. For coding questions, provide correct, well-structured code examples when helpful\n\n    Focus on being informative, precise, and helpful. If a query contains elements outside your domain of expertise, focus on the technology aspects while acknowledging the broader context.\n\n    Use the provide_tech_response tool to submit your final response.",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        provide_tech_response,
    ],
    update_agent_state_before_reply=[],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_mini_llm_config,
        ],
        cache_seed=42,
    ),
)

__AGENTS__["tech_specialist"] = tech_specialist

finance_specialist.handoffs.set_after_work(target=AgentTarget(router_agent))

general_specialist.handoffs.set_after_work(target=AgentTarget(router_agent))

healthcare_specialist.handoffs.set_after_work(target=AgentTarget(router_agent))

router_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(tech_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("${current_domain} == 'technology'")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("!${question_answered}")
        ),
    )
)
router_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(finance_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("${current_domain} == 'finance'")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("!${question_answered}")
        ),
    )
)
router_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(healthcare_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("${current_domain} == 'healthcare'")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("!${question_answered}")
        ),
    )
)
router_agent.handoffs.add_context_condition(
    condition=OnContextCondition(
        target=AgentTarget(general_specialist),
        condition=ExpressionContextCondition(
            expression=ContextExpression("${current_domain} == 'general'")
        ),
        available=ExpressionAvailableCondition(
            expression=ContextExpression("!${question_answered}")
        ),
    )
)
router_agent.handoffs.set_after_work(target=RevertToUserTarget())

tech_specialist.handoffs.set_after_work(target=AgentTarget(router_agent))

Manager_pattern = DefaultPattern(
    initial_agent=router_agent,
    agents=[
        router_agent,
        tech_specialist,
        finance_specialist,
        healthcare_specialist,
        general_specialist,
    ],
    user_agent=User,
    group_manager_args={
        "llm_config": False,
        "name": "Manager",
    },
    context_variables=ContextVariables(
        data={
            "routing_started": False,
            "current_domain": None,
            "previous_domains": [],
            "domain_confidence": {},
            "request_count": 0,
            "current_request": "",
            "domain_history": {},
            "question_responses": [],
            "question_answered": True,
            "tech_invocations": 0,
            "finance_invocations": 0,
            "healthcare_invocations": 0,
            "general_invocations": 0,
            "has_error": False,
            "error_message": "",
        }
    ),
)

__INITIAL_MSG__ = "I have a question. Can you tell me about benefits? I'm trying to understand all my options and make the right decision."

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

    if router_agent not in _known_agents:
        _known_agents.append(router_agent)
    _known_agents.append(router_agent)
    for _group_member in _check_for_group_members(router_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(router_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if tech_specialist not in _known_agents:
        _known_agents.append(tech_specialist)
    _known_agents.append(tech_specialist)
    for _group_member in _check_for_group_members(tech_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(tech_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if finance_specialist not in _known_agents:
        _known_agents.append(finance_specialist)
    _known_agents.append(finance_specialist)
    for _group_member in _check_for_group_members(finance_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(finance_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if healthcare_specialist not in _known_agents:
        _known_agents.append(healthcare_specialist)
    _known_agents.append(healthcare_specialist)
    for _group_member in _check_for_group_members(healthcare_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(healthcare_specialist):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if general_specialist not in _known_agents:
        _known_agents.append(general_specialist)
    _known_agents.append(general_specialist)
    for _group_member in _check_for_group_members(general_specialist):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(general_specialist):
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
    with open("results.json", "w", encoding="utf-8", newline="\n") as file:
        file.write(
            json.dumps({'results': result_dicts}, indent=4, ensure_ascii=False)
        )


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
                _detected_pattern.context_variables = ContextVariables(
                    data=_state_context_variables
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
                    _detected_pattern.context_variables = ContextVariables(
                        data=_state_context_variables
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
            max_rounds=100,
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
