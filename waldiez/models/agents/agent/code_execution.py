# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Agent Code Execution Configuration."""

from typing import List, Optional

from pydantic import Field
from typing_extensions import Annotated

from ...common import WaldiezBase


class WaldiezAgentCodeExecutionConfig(WaldiezBase):
    """Waldiez Agent Code Execution Configuration.

    Attributes
    ----------
    work_dir : Optional[str]
        The working directory for the code execution.
    use_docker : Optional[bool]
        Run the code in a docker container.
    timeout : Optional[float]
        The timeout for the code execution. By default None (no timeout).
    last_n_messages : Optional[int]
        The chat's last n messages to consider for the code execution.
    functions : Optional[List[str]]
        If not using docker, a list of function ids to use.
    """

    work_dir: Annotated[
        Optional[str],
        Field(
            None,
            title="Working directory",
            description="The working directory for the code execution.",
            alias="workDir",
        ),
    ]
    use_docker: Annotated[
        Optional[bool],
        Field(
            None,
            title="Use docker",
            description="Run the code in a docker container.",
            alias="useDocker",
        ),
    ]
    timeout: Annotated[
        Optional[float],
        Field(
            None,
            title="Timeout",
            description=(
                "The timeout for the code execution.Default: No timeout"
            ),
        ),
    ]
    last_n_messages: Annotated[
        Optional[int],
        Field(
            None,
            title="Last N Messages",
            description="The number of previous messages in the chat to use.",
        ),
    ]
    functions: Annotated[
        List[str],
        Field(
            default_factory=list,
            title="Functions",
            description="If not using docker, the function ids to use",
        ),
    ]
