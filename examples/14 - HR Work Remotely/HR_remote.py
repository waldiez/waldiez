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

"""HR_Remote.

A waldiez flow

Requirements: ag2[openai]==0.10.0, langchain-google-community[gmail]
Tags:
🧩 generated with ❤️ by Waldiez.
"""


# Imports

import asyncio
import base64
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
from email.mime.text import MIMEText
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
from typing import Optional, Any

import autogen  # type: ignore
from autogen import (
    Agent,
    Cache,
    ChatResult,
    ConversableAgent,
    GroupChat,
    UpdateSystemMessage,
    UserProxyAgent,
    register_function,
    runtime_logging,
)
from autogen.agentchat import GroupChatManager, run_group_chat
from autogen.agentchat.group import (
    AgentTarget,
    ContextVariables,
    OnCondition,
    ReplyResult,
    RevertToUserTarget,
    StringAvailableCondition,
    StringLLMCondition,
)
from autogen.agentchat.group.patterns import DefaultPattern
from autogen.agentchat.group.patterns.pattern import Pattern
from autogen.events import BaseEvent
from autogen.io.run_response import AsyncRunResponseProtocol, RunResponseProtocol
import numpy as np
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

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
# "hr_remote_api_keys.py"
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


__MODELS_MODULE__ = load_api_key_module("hr_remote")


def get_hr_remote_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_hr_remote_model_api_key(model_name)


class GroupDict(TypedDict):
    """Group related global dict."""

    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]


__GROUP__: GroupDict = {"chats": {}, "patterns": {}}

__AGENTS__: dict[str, ConversableAgent] = {}


# Tools

# Databases
USER_DATABASE = {
    "istella": {
        "full_name": "Stella Ioannidou",
        "department": "HR",
    },
    "laztoum": {
        "full_name": "Lazaros Toumanidis",
        "department": "RnD",
    },
}
DEPARTMENT_DATABASE = {
    "HR": {
        "manager": "Styliani Ioannidou",
        "manager_email": "manager_1@example.com",
        "max_remote_days": 4,
        "dep_address": "23 Kifisias St, Athens, PA 12345",
    },
    "RnD": {
        "manager": "Panagiotis Kasnesis",
        "manager_email": "manager_1@example.com",
        "max_remote_days": 10,
        "dep_address": "56 Ermou St, Athens, PA 12346",
    },
}


def remote_days(days: str, context_variables: ContextVariables) -> ReplyResult:
    """Record the number of remote days in the workflow context"""
    context_variables["remote_days"] = days
    context_variables["has_defined_days"] = True
    return ReplyResult(
        context_variables=context_variables,
        message=f"Number of remote days recorded: {days}",
    )


def login_by_username(
    username: str, context_variables: ContextVariables
) -> ReplyResult:
    """Get and log the employee in by their username"""
    if username in USER_DATABASE:
        department_name = USER_DATABASE[username]["department"]
        context_variables["user_name"] = USER_DATABASE[username]["full_name"]
        context_variables["department"] = department_name
        department = DEPARTMENT_DATABASE[department_name]
        context_variables["logged_in_username"] = username
        context_variables["logged_in"] = True
        context_variables["requires_login"] = False
        context_variables["defined_department"] = True
        context_variables["manager_name"] = department["manager"]
        context_variables["manager_email"] = department["manager_email"]
        context_variables["max_remote_days"] = department["max_remote_days"]
        return ReplyResult(
            context_variables=context_variables,
            message="The user is authenticated, continue",
        )
    return ReplyResult(
        context_variables=context_variables,
        message=f"User {username} not found. Please ask for the correct username.",
    )


def check_remote_policy(
    remote_days: int, context_variables: ContextVariables
) -> ReplyResult:
    """Check if the order ID is valid"""
    # Restricts order to checking to the logged in user
    if (
        context_variables["logged_in_username"]
        and context_variables["defined_department"]
    ):
        department = context_variables["department"]
        if DEPARTMENT_DATABASE[department]["max_remote_days"] >= remote_days:
            context_variables["days_approved"] = True
            return ReplyResult(
                context_variables=context_variables,
                message=f"Requested remote dates are approved.",
            )
    return ReplyResult(
        context_variables=context_variables,
        message=f"The number {remote_days} of requested remote days is not compliant with your departments policy. Please ask for less or ask to notify your manager.",
    )


def wants_to_notify(
    notify_manager: str, context_variables: ContextVariables
) -> ReplyResult:
    """Check if the users wants to notify the department's manager."""
    if context_variables["logged_in_username"] and notify_manager:
        context_variables["notify_manager"] = True
        manager_name = context_variables["manager_name"]
        manager_email = context_variables["manager_email"]
        return ReplyResult(
            context_variables=context_variables,
            message=f"An email will be sent to your manager {manager_name} with email {manager_email}",
        )
    return ReplyResult(
        context_variables=context_variables,
        message="The user doesn't want to notify the manager",
    )


def gmail_send_function(
    message_text: str,
    recipient_email: str,
    context_variables: ContextVariables,
    subject: str = "",
    sender_email: str = "me",
) -> ReplyResult:
    """Send an email using Gmail API.

    Args:
        message_text (str): The body of the email
        recipient_email (str): Email address of the recipient
        subject (str, optional): Subject of the email. Defaults to "".
        sender_email (str, optional): Email address of sender. Defaults to "me".
    Returns:
        str: A message indicating success or failure
    """
    try:
        # Gmail API setup directly within the function
        SCOPES = [
            "https://mail.google.com/",  # Full access to Gmail account
            "https://www.googleapis.com/auth/gmail.send",  # Send-only access\
        ]

        creds = None
        # Try to load existing credentials if available
        token_path = "token.json"
        # Check if token.json exists and contains valid credentials
        if os.path.exists(token_path):
            try:
                with open(token_path, "r") as token_file:
                    token_data = json.load(token_file)
                creds = Credentials.from_authorized_user_info(token_data, SCOPES)
            except Exception as e:
                print(f"Error loading token file: {str(e)}")

        # Check if credentials need to be refreshed or created
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                # Just refresh the token if possible
                creds.refresh(Request())
                print("Refreshed existing credentials")
            else:
                # Only trigger OAuth flow if we have no valid credentials
                print("No valid credentials found, starting OAuth flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    "C:/Users/pathToFile/credentials.json", SCOPES
                )
                creds = flow.run_local_server(port=0)
                print("Successfully authenticated with Gmail API")

            # Save the credentials for future runs
            with open(token_path, "w") as token:
                token.write(creds.to_json())
                print(f"Saved credentials to {token_path}")
        else:
            print("Using existing valid credentials")

        # Build the service
        service = build("gmail", "v1", credentials=creds)

        # Create a more complete message
        message = MIMEText(message_text)
        message["to"] = recipient_email
        message["subject"] = subject

        # Encode the message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # Create the message body
        create_message = {"raw": encoded_message}

        # Send the message
        send_message = (
            service.users()
            .messages()
            .send(userId=sender_email, body=create_message)
            .execute()
        )
        context_variables["email_sent"] = True
        return ReplyResult(
            context_variables=context_variables,
            message=f"Email sent successfully to {recipient_email} with message ID: {send_message['id']}",
        )
    except Exception as e:
        # More verbose error handling
        return ReplyResult(
            context_variables=context_variables,
            message=(
                f"Error sending email: {str(e)}"
                "Make sure your Google Cloud Project has Gmail API enabled and the credentials.json file is configured correctly."
            ),
        )


# Models

gpt_4_1_llm_config: dict[str, Any] = {
    "model": "gpt-4.1",
    "api_type": "openai",
    "api_key": get_hr_remote_model_api_key("gpt_4_1"),
}

# Agents

authentication_agent = ConversableAgent(
    name="authentication_agent",
    description="authenticates the employee",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        login_by_username,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are an HR agent, working with a user and a group of agents to provide support for your HR department regarding your company's remote work policies.\nA user needs to be logged in to be able to request to work remotely.\nThe authentication_agent will work with the customer to verify their identity, transfer to them to start with.\nThe policy_remote_agent will check whether the user is eligible to ask to work remotely, how many days ect.\nBe sure to check get the department and the manager's email.\nIf the days are approved ask whether you should notify the user's manager.\nAsk the customer for further information when necessary.\n\nThe current status of this workflow is:\nCustomer name: {user_name}\nLogged in: {logged_in}\nApproved days:{days_approved}\nWants to notify the manager: {notify_manager}\""
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["authentication_agent"] = authentication_agent

email_agent = ConversableAgent(
    name="email_agent",
    description="Sends email to the employees manager if asked",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        wants_to_notify,
        gmail_send_function,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are a email notification agent. You must ask the user whether he/she wishes to notify his/her manager.\nIf so, send this info to the EmailAssistant asking to write a formal email that will work remotely for to his/her manager. Add Work Remotely as title\n\nUse existing tools\n"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["email_agent"] = email_agent

hr_triage_agent = ConversableAgent(
    name="hr_triage_agent",
    description="HR_triage_agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        remote_days,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are an HR agent, working with a user and a group of agents to provide support for your HR department regarding your company's remote work policies.\nA user needs to be logged in to be able to request to work remotely.\nThe authentication_agent will work with the customer to verify their identity, transfer to them to start with.\nThe policy_remote_agent will check whether the user is eligible to ask to work remotely, how many days ect.\nBe sure to check get the department and the manager's email.\nIf the days are approved ask whether you should notify the user's manager.\nAsk the customer for further information when necessary.\n\nThe current status of this workflow is:\nCustomer name: {user_name}\nLogged in: {logged_in}\nApproved days:{days_approved}\nWants to notify the manager: {notify_manager}\""
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["hr_triage_agent"] = hr_triage_agent

remote_policy_agent = ConversableAgent(
    name="remote_policy_agent",
    description="Checks remote work policy of the department",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    functions=[
        remote_days,
        check_remote_policy,
    ],
    update_agent_state_before_reply=[
        UpdateSystemMessage(
            "You are a work from remote policy management agent that manages whether the days a user has asked are valid.\nThe user must be logged in to ask working remotely.\nUse your available tools to check if the defined number of days comply with the departments policy. Ask the user questions as needed.\n\nThe current status of this workflow is:\nCustomer name: {user_name}\nLogged in: {logged_in}\nNumber of days: {remote_days}\n"
        ),
    ],
    llm_config=autogen.LLMConfig(
        config_list=[
            gpt_4_1_llm_config,
        ],
        cache_seed=None,
    ),
)

__AGENTS__["remote_policy_agent"] = remote_policy_agent

user_proxy = UserProxyAgent(
    name="user_proxy",
    description="A new User proxy agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,
    llm_config=False,
)

__AGENTS__["user_proxy"] = user_proxy

authentication_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(hr_triage_agent),
        condition=StringLLMCondition(
            prompt="The user is logged in, continue with the request."
        ),
        available=StringAvailableCondition("logged_in"),
    )
)
authentication_agent.handoffs.set_after_work(target=RevertToUserTarget())

email_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(hr_triage_agent),
        condition=StringLLMCondition(
            prompt="The user hasn't defined whether he/she would like to via email."
        ),
    )
)

hr_triage_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(authentication_agent),
        condition=StringLLMCondition(
            prompt="The user is not logged in, authenticate the user."
        ),
        available=StringAvailableCondition("requires_login"),
    )
)
hr_triage_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(remote_policy_agent),
        condition=StringLLMCondition(
            prompt="If the customer is logged in, continue with the policy agent, else transfer to the authentication agent."
        ),
        available=StringAvailableCondition("logged_in"),
    )
)
hr_triage_agent.handoffs.add_llm_condition(
    condition=OnCondition(
        target=AgentTarget(email_agent),
        condition=StringLLMCondition(
            prompt="The user application for working few days remotely has been approved by the policy."
        ),
        available=StringAvailableCondition("notify_manager"),
    )
)
hr_triage_agent.handoffs.set_after_work(target=RevertToUserTarget())

__INITIAL_MSG__ = "I would like to work remotely for a few days."

manager_pattern = DefaultPattern(
    initial_agent=hr_triage_agent,
    agents=[hr_triage_agent, authentication_agent, remote_policy_agent, email_agent],
    user_agent=user_proxy,
    group_manager_args={
        "llm_config": autogen.LLMConfig(
            config_list=[
                gpt_4_1_llm_config,
            ],
            cache_seed=None,
        ),
        "name": "manager",
    },
    context_variables=ContextVariables(
        data={
            "user_name": None,
            "logged_in_username": None,
            "logged_in": False,
            "requires_login": True,
            "max_remote_days": None,
            "remote_days": None,
            "notify_manager": False,
            "has_defined_days": False,
            "department": None,
            "defined_department": False,
            "manager_email": None,
            "manager_name": None,
            "days_approved": False,
            "email_sent": False,
        }
    ),
    group_after_work=RevertToUserTarget(),
)

__GROUP__["patterns"]["manager_pattern"] = manager_pattern


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
        os.makedirs("logs")
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
    if user_proxy not in _known_agents:
        _known_agents.append(user_proxy)
    _known_agents.append(user_proxy)
    for _group_member in _check_for_group_members(user_proxy):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(user_proxy):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if hr_triage_agent not in _known_agents:
        _known_agents.append(hr_triage_agent)
    _known_agents.append(hr_triage_agent)
    for _group_member in _check_for_group_members(hr_triage_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(hr_triage_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if authentication_agent not in _known_agents:
        _known_agents.append(authentication_agent)
    _known_agents.append(authentication_agent)
    for _group_member in _check_for_group_members(authentication_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(authentication_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if remote_policy_agent not in _known_agents:
        _known_agents.append(remote_policy_agent)
    _known_agents.append(remote_policy_agent)
    for _group_member in _check_for_group_members(remote_policy_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(remote_policy_agent):
        if _extra_agent not in _known_agents:
            _known_agents.append(_extra_agent)

    if email_agent not in _known_agents:
        _known_agents.append(email_agent)
    _known_agents.append(email_agent)
    for _group_member in _check_for_group_members(email_agent):
        if _group_member not in _known_agents:
            _known_agents.append(_group_member)
    for _extra_agent in _check_for_extra_agents(email_agent):
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
    reason = "Event handler stopped processing" if not exc else traceback.format_exc()
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
        file.write(json.dumps({"results": result_dicts}, indent=4, ensure_ascii=False))


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
                detected_pattern.initial_agent = detected_pattern.agents[idx + 1]
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
        _detected_pattern = __GROUP__["patterns"].get(_state_group_pattern, None)
        if _detected_pattern:
            _state_context_variables = _state_dict.get("context_variables", {})
            if _state_context_variables and isinstance(_state_context_variables, dict):
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
                _state_context_variables = _state_dict.get("context_variables", {})
                if _state_context_variables and isinstance(
                    _state_context_variables, dict
                ):
                    _detected_pattern.context_variables = ContextVariables(
                        data=_state_context_variables
                    )
            if _state_messages and isinstance(_state_messages, list):
                __INITIAL_MSG__ = _state_messages
    if _detected_pattern and _state_messages and isinstance(_state_messages, list):
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
    if Path(".cache").is_dir():
        shutil.rmtree(".cache", ignore_errors=True)
    results = run_group_chat(
        pattern=manager_pattern,
        messages=__INITIAL_MSG__,
        max_rounds=40,
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
                    result_events.append(event.model_dump(mode="json", fallback=str))
                except BaseException:  # pylint: disable=broad-exception-caught
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
                    raise SystemExit("Error in event handler: " + str(e)) from e
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
                    result_context_variables.model_dump(mode="json", fallback=str)
                    if result_context_variables
                    else None
                ),
                "last_speaker": result.last_speaker,
            }
            result_dicts.append(result_dict)
    else:
        for index, result in enumerate(results):
            result_events = []
            result.process()
            for event in result.events:
                try:
                    result_events.append(event.model_dump(mode="json", fallback=str))
                except BaseException:  # pylint: disable=broad-exception-caught
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
                    result_context_variables.model_dump(mode="json", fallback=str)
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
