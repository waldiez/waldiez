# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Simple A2A agent server."""

# flake8: noqa: E501
# pylint: disable=line-too-long
# pyright: reportMissingTypeStubs=false,reportConstantRedefinition=false

import os
from pathlib import Path

from autogen import (  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
    ConversableAgent,
    LLMConfig,
)
from autogen.a2a import (  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped]  # noqa
    A2aAgentServer,
)

try:
    HERE = Path(__file__).parent
except NameError:
    # jupyter?
    HERE = Path(".").resolve()

ROOT_DIR = HERE.parent

try:
    from dotenv import load_dotenv
except ImportError:
    pass
else:
    if (HERE / ".env").exists():
        load_dotenv(HERE / ".env")
    elif (ROOT_DIR / ".env").exists():
        load_dotenv(ROOT_DIR / ".env")


API_KEY = os.environ.get("OPENAI_API_KEY")

# Create your regular agent
llm_config = LLMConfig({"model": "gpt-4o-mini", "api_key": API_KEY})

agent = ConversableAgent(
    name="python_coder",
    system_message="You are an expert Python developer...",
    llm_config=llm_config,
    # set human_input_mode "NEVER" to avoid asking
    #  for human input on server side
    human_input_mode="NEVER",
)

# Create A2A server
server = A2aAgentServer(agent, url="http://0.0.0.0:8000").build()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(server, host="0.0.0.0", port=8000)
