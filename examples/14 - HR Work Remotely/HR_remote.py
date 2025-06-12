#!/usr/bin/env python
# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

# pylint: disable=line-too-long,unknown-option-value,unused-argument,unused-import,unused-variable,invalid-name
# pylint: disable=import-error,import-outside-toplevel,inconsistent-quotes,missing-function-docstring,missing-param-doc,missing-return-doc
# pylint: disable=ungrouped-imports,unnecessary-lambda-assignment,too-many-arguments,too-many-locals,too-many-try-statements,broad-exception-caught

# type: ignore

# pyright: reportUnusedImport=false,reportMissingTypeStubs=false,reportUnknownArgumentType=false
# pyright: reportUnknownMemberType=false,reportUnknownLambdaType=false,reportUnnecessaryIsInstance=false
# pyright: reportUnknownVariableType=false

"""HR_Remote.

A waldiez flow

Requirements: ag2[openai]==0.9.2, langchain-google-community[gmail]
Tags:
🧩 generated with ❤️ by Waldiez.
"""


# Imports

import base64
import csv
import importlib
import json
import os
import sqlite3
import sys
from dataclasses import asdict
from email.mime.text import MIMEText
from pprint import pprint
from types import ModuleType
from typing import (
    Annotated,
    Any,
    Callable,
    Dict,
    List,
    Optional,
    Set,
    Tuple,
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
from autogen.agentchat import GroupChatManager, initiate_group_chat
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
import numpy as np
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

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
# This section assumes that a file named "hr_remote_api_keys"
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
        context_variables["manager_name"] = department['manager']
        context_variables["manager_email"] = department['manager_email']
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
            'https://mail.google.com/',  # Full access to Gmail account
            'https://www.googleapis.com/auth/gmail.send',  # Send-only access\
        ]

        creds = None
        # Try to load existing credentials if available
        token_path = 'token.json'
        # Check if token.json exists and contains valid credentials
        if os.path.exists(token_path):
            try:
                with open(token_path, 'r') as token_file:
                    token_data = json.load(token_file)
                creds = Credentials.from_authorized_user_info(
                    token_data, SCOPES
                )
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
                    'C:/Users/pathToFile/credentials.json', SCOPES
                )
                creds = flow.run_local_server(port=0)
                print("Successfully authenticated with Gmail API")

            # Save the credentials for future runs
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
                print(f"Saved credentials to {token_path}")
        else:
            print("Using existing valid credentials")

        # Build the service
        service = build('gmail', 'v1', credentials=creds)

        # Create a more complete message
        message = MIMEText(message_text)
        message['to'] = recipient_email
        message['subject'] = subject

        # Encode the message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # Create the message body
        create_message = {'raw': encoded_message}

        # Send the message
        send_message = (
            service.users()
            .messages()
            .send(userId=sender_email, body=create_message)
            .execute()
        )
        context_variables['email_sent'] = True
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
    is_termination_msg=None,  # pyright: ignore
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

email_agent = ConversableAgent(
    name="email_agent",
    description="Sends email to the employees manager if asked",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
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

hr_triage_agent = ConversableAgent(
    name="hr_triage_agent",
    description="HR_triage_agent",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
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

remote_policy_agent = ConversableAgent(
    name="remote_policy_agent",
    description="Checks remote work policy of the department",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
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

user_proxy = UserProxyAgent(
    name="user_proxy",
    description="A new User proxy agent",
    human_input_mode="ALWAYS",
    max_consecutive_auto_reply=None,
    default_auto_reply="",
    code_execution_config=False,
    is_termination_msg=None,  # pyright: ignore
    llm_config=False,  # pyright: ignore
)

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

manager_pattern = DefaultPattern(
    initial_agent=hr_triage_agent,
    agents=[
        hr_triage_agent,
        authentication_agent,
        remote_policy_agent,
        email_agent,
    ],
    user_agent=user_proxy,
    group_manager_args={
        "llm_config": autogen.LLMConfig(
            config_list=[
                gpt_4_1_llm_config,
            ],
            cache_seed=None,
        ),
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
    conn = sqlite3.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except sqlite3.OperationalError:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


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


# Start chatting


def main() -> Union[ChatResult, list[ChatResult], dict[int, ChatResult]]:
    """Start chatting.
    Returns
    -------
    Union[ChatResult, list[ChatResult], dict[int, ChatResult]]
        The result of the chat session, which can be a single ChatResult,
        a list of ChatResults, or a dictionary mapping integers to ChatResults.
    """
    results, _, __ = initiate_group_chat(
        pattern=manager_pattern,
        messages="I would like to work remotely for a few days.",
        max_rounds=40,
    )

    stop_logging()
    return results


def call_main() -> None:
    """Run the main function and print the results."""
    results: Union[ChatResult, list[ChatResult], dict[int, ChatResult]] = main()
    if isinstance(results, dict):
        # order by key
        ordered_results = dict(sorted(results.items()))
        for _, result in ordered_results.items():
            pprint(asdict(result))
    else:
        if not isinstance(results, list):
            results = [results]
        for result in results:
            pprint(asdict(result))


if __name__ == "__main__":
    # Let's go!
    call_main()
