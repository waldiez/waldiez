# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Common utils for all models."""

from .ag2_version import get_autogen_version
from .base import WaldiezBase
from .date_utils import now
from .dict_utils import update_dict
from .handoff import (
    WaldiezAgentTarget,
    WaldiezContextBasedCondition,
    WaldiezContextBasedTransition,
    WaldiezContextStrLLMCondition,
    WaldiezDefaultCondition,
    WaldiezExpressionContextCondition,
    WaldiezGroupOrNestedTarget,
    WaldiezHandoff,
    WaldiezHandoffCondition,
    WaldiezHandoffTransition,
    WaldiezLLMBasedCondition,
    WaldiezLLMBasedTransition,
    WaldiezRandomAgentTarget,
    WaldiezSimpleTarget,
    WaldiezStringContextCondition,
    WaldiezStringLLMCondition,
    WaldiezTransitionAvailability,
    WaldiezTransitionTarget,
)
from .id_generator import get_id
from .method_utils import (
    check_function,
    gather_code_imports,
    generate_function,
    get_function,
    parse_code_string,
)
from .naming import (
    MAX_VARIABLE_LENGTH,
    get_valid_instance_name,
    get_valid_python_variable_name,
    safe_filename,
)
from .waldiez_version import get_waldiez_version

__all__ = [
    "MAX_VARIABLE_LENGTH",
    "WaldiezBase",
    "check_function",
    "update_dict",
    "gather_code_imports",
    "get_autogen_version",
    "get_function",
    "get_id",
    "get_valid_instance_name",
    "get_valid_python_variable_name",
    "get_waldiez_version",
    "generate_function",
    "now",
    "parse_code_string",
    "safe_filename",
    "WaldiezDefaultCondition",
    "WaldiezAgentTarget",
    "WaldiezContextBasedCondition",
    "WaldiezContextBasedTransition",
    "WaldiezContextStrLLMCondition",
    "WaldiezExpressionContextCondition",
    "WaldiezGroupOrNestedTarget",
    "WaldiezHandoff",
    "WaldiezHandoffCondition",
    "WaldiezHandoffTransition",
    "WaldiezLLMBasedCondition",
    "WaldiezLLMBasedTransition",
    "WaldiezRandomAgentTarget",
    "WaldiezSimpleTarget",
    "WaldiezStringContextCondition",
    "WaldiezStringLLMCondition",
    "WaldiezTransitionAvailability",
    "WaldiezTransitionTarget",
]
