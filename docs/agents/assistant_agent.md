An *Assistant Agent* is an AI-powered responder in your workflow. It receives messages from other agents (like the [User Agent](../agents/user_agent.md)), processes them using a selected model, and replies intelligently. It can also run tools, execute code, and stop responding based on termination conditions you define.

This agent is ideal for handling conversations, reasoning over tasks, using external tools, or automating replies.

<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_main.png"
    alt="Assistant Agent - preview"
    style="width: 100%; max-width: 200; height: auto;"
  >
</p>

## Basic Setup

In the Agent tab:

- **Multimodal**: If checked, the agent will handle uploaded images from the user.  
> ⚠️ NOTE: Make sure you use a compatible LLM model that supports multimodal inputs (e.g. GPT-4o-mini)
- **Name & Description**: Customize how the agent is labeled in your flow.
- **System Message**: Define the agent's behavior or role.
- **Human Input Mode**: Whether to ask for human inputs every time a message is received. Possible values are:  
  - **Always**: The agent prompts for human input every time a message is received. Under this mode, the conversation stops when the human input is "exit", or when is_termination_msg is True and there is no human input.
  - **Terminate**: The Agent only prompts for human input only when a termination message is received or the number of auto reply reaches the max_consecutive_auto_reply.
  - **Never**: The agent will neever prompt for human input. Under this mode, the conversation stops when the number of auto reply reaches the max_consecutive_auto_reply or when is_termination_msg is True.
- **Max Consecutive auto reply**: The maximum number of consecutive auto replies (i.e., when no code execution or LLM-based reply is generated). Default is None (no limit provided). When set to 0, no auto reply will be generated.
- **Defautl Auto Reply**: Set a Default auto reply.

<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_1.png"
    alt="Assistant Agent - Basic setup preview"
    style="width: 100%; max-width: 580; height: auto;"
  >
</p>

## Termination Conditions

Control if and when the Agent should stop responding:

- By Keyword: Stop when specific keywords are found (e.g., “stop”, “done”).
- By Method: Use a custom Python function to decide when to stop.

Examples:

- "Keyword is found" — stops when a phrase appears.
- "Exact match" — stops only if the reply is exactly the keyword.

<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_termination.png"
    alt="Assistant Agent - Termination conditions preview"
    style="width: 100%; max-width: 580; height: auto;"
  >
</p>

## Code Execution Settings

In the Code Execution tab:

- **Enable Code Execution**: Allows the Assistant Agent to execute Python snippets (for testing flows or simulating dynamic behavior).
- **Working Directory**: Specify where any temporary code files should be executed.
- **Last N Messages**: Determines how many previous messages should be included as context. __Auto__ will use all available.
- **Timeout**: Optional timeout to prevent long-running code.

This is useful for simulating scenarios where a user performs code-based tasks or replies with dynamically computed results.

<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_codex.png"
    alt="Assistant Agent - Code Execution setup preview"
    style="width: 100%; max-width: 580; height: auto;"
  >
</p>


## Model Configuration

In the Models tab:

- **Model Selection**: Choose a language model (e.g. gpt-4.1) to power your assistant.
- You can assign different models to different agents for flexibility.  

For a deeper overview of available models and configuration options, check the [Models Guide](../usage/models.md).

<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_models.png"
    alt="Assistant Agent - Model setup preview"
    style="width: 100%; max-width: 580; height: auto;"
  >
</p>


## Tools

Assistants can use tools (e.g., search, calculations, APIs) with executors (other agents like User or Assistant) that run them.

- **Tool**: Choose a defined tool from your system.
- **Executor**: Select which agent will handle the tool execution.
- Add to bind the tool to this assistant.


<p align="center">
  <img
    src="../static/images/agents/assistant/assistant_tools.png"
    alt="Assistant Agent - Tool settings preview"
    style="width: 100%; max-width: 580; height: auto;"
  >
</p>

<!--

## Nested Chat

Upon linking the Assistant Agent with another Agent, the Nested Chat tab will appear. For more info, check out Nested Chat (url)

-->