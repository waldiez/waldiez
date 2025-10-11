# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.common.method_utils.*."""

import ast

from waldiez.models.agents.agent.termination_message import (
    IS_TERMINATION_MESSAGE,
    IS_TERMINATION_MESSAGE_ARGS,
)
from waldiez.models.chat.chat_message import (
    CALLABLE_MESSAGE,
    CALLABLE_MESSAGE_ARGS,
    CALLABLE_MESSAGE_TYPES,
)
from waldiez.models.chat.chat_nested import (
    NESTED_CHAT_ARGS,
    NESTED_CHAT_REPLY,
    NESTED_CHAT_TYPES,
)
from waldiez.models.common.method_utils import (
    MAX_VAR_NAME_LENGTH,
    check_function,
    generate_function,
    get_function,
    parse_code_string,
)


def test_parse_code_string() -> None:
    """Test parse_code_string."""
    # Given
    code_string = "def test():\n    return 42"
    # When
    error, tree = parse_code_string(code_string)
    # Then
    assert error is None
    assert tree is not None
    assert isinstance(tree, ast.Module)

    # Given
    code_string = "def test():\n   4x = 2\n"
    # When
    error, tree = parse_code_string(code_string)
    assert error is not None
    assert tree is None
    assert "SyntaxError" in error


def test_check_function() -> None:
    """Test check_function."""
    # Given
    code_string = '''
def callable_message(
    sender,
    recipient,
    context
) -> str:
    """Some docstring."""
    return "Hello"'''
    function_name = CALLABLE_MESSAGE
    function_args = CALLABLE_MESSAGE_ARGS
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert valid
    assert body == '    """Some docstring."""\n    return "Hello"'

    # Given
    code_string = """
def callable_message(sender, recipient, context):
    return "Hello"
    """
    function_name = "invalid_function"
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=[],
    )
    # Then
    assert not valid
    assert "No method with name" in body

    # Given
    code_string = """
def callable_message(other, context):
    return "Hello"
    """
    # When
    function_name = CALLABLE_MESSAGE
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=[],
    )
    # Then
    assert not valid
    assert "Invalid number of arguments" in body
    # Given
    code_string = """
def is_termination_message(x):
    return True
    """
    function_name = IS_TERMINATION_MESSAGE
    function_args = IS_TERMINATION_MESSAGE_ARGS
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert not valid
    assert "Invalid argument name" in body

    # Given
    code_string = """
def is_termination_message(4):
    return True
    """
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert not valid
    assert "SyntaxError" in body

    # Given
    code_string = """
def some_other_function(sender, recipient, context):
    return "Hello"

def nested_chat_reply(recipient, messages, sender, config):
    return "Hello"
    """
    function_name = NESTED_CHAT_REPLY
    function_args = NESTED_CHAT_ARGS
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert valid
    # pylint: disable=line-too-long
    # fmt: off
    assert body == (
        '    return "Hello"'  # noqa: E501
    )
    # fmt: on

    # Given
    code_string = """
def nested_chat_reply_(recipient, messages, sender, config):
    return "Hello"
    """
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert not valid
    assert "No method with name" in body


def test_check_function_with_docstring() -> None:
    """Test check_function."""
    # Given
    code_string = '''
def callable_message(sender, recipient, context):
    """
    A callable message.
    """
    return "Hello"
'''
    function_name = CALLABLE_MESSAGE
    function_args = CALLABLE_MESSAGE_ARGS
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert valid
    assert (
        body
        == '''    """
    A callable message.
    """
    return "Hello"'''
    )


def test_check_function_with_empty_body() -> None:
    """Test check_function."""
    # Given
    code_string = """
def callable_message(sender, recipient, context):

"""
    function_name = CALLABLE_MESSAGE
    function_args = CALLABLE_MESSAGE_ARGS
    # When
    valid, _ = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert not valid


def test_check_function_with_new_lines() -> None:
    """Test check_function."""
    # Given
    code_string = """
def callable_message(sender, recipient, context):


    return "Hello"


"""
    function_name = CALLABLE_MESSAGE
    function_args = CALLABLE_MESSAGE_ARGS
    # When
    valid, body = check_function(
        code_string=code_string,
        function_name=function_name,
        function_args=function_args,
    )
    # Then
    assert valid
    assert body == '    return "Hello"'


def test_generate_function() -> None:
    """Test generate_function."""
    # Given
    function_name = CALLABLE_MESSAGE
    function_args = CALLABLE_MESSAGE_ARGS
    function_types = CALLABLE_MESSAGE_TYPES
    function_body = "    return 'Hello'"
    # When
    function_string = generate_function(
        function_name=function_name,
        function_args=function_args,
        function_types=function_types,
        function_body=function_body,
    )
    # Then
    assert function_string == (
        "def callable_message(\n"
        "    sender: ConversableAgent,\n"
        "    recipient: ConversableAgent,\n"
        "    context: dict[str, Any],\n"
        ") -> Union[dict[str, Any], str]:\n"
        "    return 'Hello'\n"
    )
    # Given
    function_name = NESTED_CHAT_REPLY
    function_args = NESTED_CHAT_ARGS
    function_types = NESTED_CHAT_TYPES
    function_body = "    return 'Hello'"
    # When
    function_string = generate_function(
        function_name=function_name,
        function_args=function_args,
        function_types=function_types,
        function_body=function_body,
        types_as_comments=True,
    )
    # Then
    assert function_string == (
        "def nested_chat_reply(\n"
        "    recipient,  # type: ConversableAgent\n"
        "    messages,  # type: list[dict[str, Any]]\n"
        "    sender,  # type: ConversableAgent\n"
        "    config,  # type: dict[str, Any]\n"
        "):\n"
        "    # type: (...) -> Union[dict[str, Any], str]\n"
        "    return 'Hello'\n"
    )
    # Given
    function_name = (
        "a_function_name_that_is_longer_than_64_characters_should_be_truncated"
    )
    function_args = ["arg1", "arg2", "arg3"]
    function_types = ["str", "int", "float"], "str"
    function_body = "    return 'Hello'"
    # When
    function_string = generate_function(
        function_name=function_name,
        function_args=function_args,
        function_types=function_types,
        function_body=function_body,
    )
    # Then
    assert function_string == (
        f"def {function_name[:MAX_VAR_NAME_LENGTH]}"
        "(\n"
        "    arg1: str,\n"
        "    arg2: int,\n"
        "    arg3: float,\n"
        ") -> str:\n"
        "    return 'Hello'\n"
    )


def test_get_function() -> None:
    """Test get_function."""
    # Given
    code_string = """
def callable_message(sender, recipient, context):
    return "Hello"
"""
    function_name = "callable_message"
    # When
    function = get_function(
        code_string=code_string,
        function_name=function_name,
    )
    # Then
    assert function == code_string

    # Given
    code_string = """
def invalid:
    return "Hello"
"""
    function_name = "invalid"
    # When/Then
    output = get_function(
        code_string=code_string,
        function_name=function_name,
    )
    assert output == ""

    # Given
    code_string = """
# some code before should be excluded

x = 5

def callable_message(sender, recipient, context):
    return "Hello"
"""
    # When
    function_name = "callable_message"
    output = get_function(
        code_string=code_string,
        function_name=function_name,
    )
    # Then
    assert output == (
        "\ndef callable_message(sender, recipient, context):\n"
        '    return "Hello"\n'
    )

    # Given
    code_string = """
def callable_message(sender, recipient, context):
    return "Hello"
"""
    function_name = "invalid"
    # When
    output = get_function(
        code_string=code_string,
        function_name=function_name,
    )
    # Then
    assert output == ""
