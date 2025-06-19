In the agents view, you can design and organize agent workflows by connecting nodes representing different components in the process.

![Assistant Preview](../static/images/light/agents_1.webp#only-light)
![Assistant Dark Preview](../static/images/dark/agents_1.webp#only-dark)

- **Adding Agents**:
  - On the left sidebar, you'll find options such as "User Proxy", "Assistant" and "Group Manager." Drag and drop any of these to the canvas to start building your workflow.

- **Connecting Nodes**:
  - Connect nodes by dragging lines from one node to another. This is used to create the information flow between agents.

- **Configuring Agents**:
  - Each agent has settings where you can specify the model, add a system message, and set other properties.
  - Double-clicking an agent allows you to edit its properties, such as setting the agent's name, linking models and tools to it, and defining the agent's behavior.

## User Proxy Agent

A User Proxy agent acts as an intermediary between the real user and the rest of the agent flow. It is responsible for sending user messages into the system and optionally simulating replies when human input is not available.

### **General Settings**

In the User tab:

- **Name**: Set a label to identify this agent (e.g., "User", "Researcher").
- **Max Consecutive Auto Reply**: Define how many automatic replies the agent can send before waiting for human input.
- **Default Auto Reply**: Provide a fallback message that will be used if no input is received (e.g., "Okay", "Continue").

This configuration helps control how the agent behaves in cases where no user is actively participating.

![User agent - Basic setup preview](../static/images/light/user_1.webp#only-light)
![User agent - Basic setup preview](../static/images/dark/user_1.webp#only-dark)

### Code Execution Settings

In the Code Execution tab:

- **Enable Code Execution**: Allows the user proxy to execute Python snippets (for testing flows or simulating dynamic behavior).
- **Working Directory**: Specify where any temporary code files should be executed.
- **Last N Messages**: Determines how many previous messages should be included as context. ~auto~ will use all available.
- **Timeout**: Optional timeout to prevent long-running code.

This is useful for simulating scenarios where a user performs code-based tasks or replies with dynamically computed results.

![User Agent - Code execution preview](../static/images/light/user_2.webp#only-light)
![User Agent - Code execution preview](../static/images/dark/user_2.webp#only-dark)

## Assistant Agent

An Assistant Agent is an AI-powered responder in your workflow. It receives messages from other agents (like the User Proxy), processes them using a selected model, and replies intelligently. It can also run tools, execute code, and stop responding based on termination conditions you define.

This agent is ideal for handling conversations, reasoning over tasks, using external tools, or automating replies.

### Basic Setup

In the Agent tab:

- **Name & Description**: Customize how the agent is labeled in your flow.
- **System Message**: Define the assistant’s behavior or role. For example: "You are a helpful research assistant."
- **Human Input Mode**:
  - **Always**: Waits for user input every time before replying.
  - **Terminate**: Waits only after max auto replies or when a termination condition is met.
  - **Never**: Replies without asking for user input.
- **Auto Reply Settings**: Set how many replies the assistant should send before waiting and/or what default message to use.

![Assistant agent - Basic setup preview](../static/images/light/assistant_1.webp#only-light)
![Assistant agent - Basic setup preview](../static/images/dark/assistant_1.webp#only-dark)

### Model Configuration

In the Models tab:

- **Model Selection**: Choose a language model (e.g. gpt-4.1) to power your assistant.
- You can assign different models to different agents for flexibility.

### Termination Conditions

Control if and when the Assistant should stop responding:

- By Keyword: Stop when specific keywords are found (e.g., “stop”, “done”).
- By Method: Use a custom Python function to decide when to stop.

Examples:

- "Keyword is found" — stops when a phrase appears.
- "Exact match" — stops only if the reply is exactly the keyword.

![Assistant agent - Termination setup preview](../static/images/light/assistant_2.webp#only-light)
![Assistant agent - Termination setup preview](../static/images/dark/assistant_2.webp#only-dark)

### Tools

Assistants can use tools (e.g., search, calculations, APIs) with executors (other agents like User or Assistant) that run them.

- Tool: Choose a defined tool from your system.
- Executor: Select which agent will handle the tool execution.
- Add to bind the tool to this assistant.

![Assistant agent - Tools setup preview](../static/images/light/assistant_3.webp#only-light)
![Assistant agent - Tools setup preview](../static/images/dark/assistant_3.webp#only-dark)

## RAG User Agent

A RAG (Retrieval-Augmented Generation) User Agent enhances your assistant by letting it fetch and reference documents before responding. It combines language model reasoning with contextual data retrieval—ideal for question-answering, documentation helpers, or research bots.

This agent is more advanced than the standard Assistant because it uses an external document database (Vector DB) and can be finely tuned for chunking, relevance filtering, and custom behavior.

![RAG agent - Setup preview](../static/images/light/rag_1.webp#only-light)
![RAG agent - Setup preview](../static/images/dark/rag_1.webp#only-dark)

### Retrieve Config

### Text Splitting

In the Text Splitting tab, control how your source documents are broken into chunks before indexing.

- **Chunk Token Size**: Max token length per chunk.
- **Context Max Tokens**: Limit on how much is passed to the model at once.
- **Chunk Mode**: Split by lines or full paragraphs.
- **Must Break at Empty Line**: Force chunk breaks at empty lines.

### Vector DB Configuration

Connect the agent to your vector database.

- **Vector DB Type**: Choose from options like Chroma, Qdrant, PGVector, or MongoDB.
- **Embedding Model**: Select a model for turning text into embeddings (e.g., all-MiniLM-L6-v2).
- **Storage Path & URL**: Where to persist vectors and how to connect.

### Custom Functions (Optional)

Advanced users can define custom Python functions for:

- **Embeddings**
- **Token Count**
- **Text Splitting**

![RAG agent - Custom functions preview](../static/images/light/rag_2.webp#only-light)
![RAG agent - Custom functions preview](../static/images/dark/rag_2.webp#only-dark)

These functions let you override the default logic. You’ll see editable code blocks when these options are toggled on.

### Advanced Options

Extra controls for fine-tuning the retrieval logic:

- Customized Prompt / Answer Prefix
- Flags like Update Context, Recursive, Overwrite, etc. help control how responses evolve across messages.

## Reasoning Agent

A Reasoning Agent is designed for structured multi-step thinking. It doesn’t just generate a single response—it explores different reasoning paths, evaluates them, and selects or pools the best answers.

This agent is best used when decisions require evaluation, ranking, or planning — such as chain-of-thought tasks, multi-step reasoning, or agent voting.ß

### Reasoning Tab

In the Reasoning tab, you can choose the search strategy and fine-tune how reasoning paths are explored.

- Verbose: When enabled, the agent provides insights into its internal decision-making process (great for debugging or teaching).
- Reasoning Method: Choose how reasoning paths are explored:
- Beam Search: Prioritizes best candidates at each step.
- Monte Carlo Tree Search: Simulates and scores multiple paths randomly.
- Language Agent Tree Search: A hybrid search using agents.
- Depth First Search: Explores one branch fully before backtracking.

![Reasoning agent - Reasoning setup preview](../static/images/light/reasoning.webp#only-light)
![Reasoning agent - Reasoning setup preview](../static/images/dark/reasoning.webp#only-dark)

#### Fine-Tuning Parameters

Each method can be tuned using the sliders below:

- Max Depth: How many steps deep to explore (limits the reasoning chain).
- Forest Size: Number of reasoning trees (parallel threads of thought).
- Rating Scale: Used for evaluating and scoring candidate answers.
- Beam Size: Number of options kept at each step in beam search.
- Answer Approach:
  - Best: Picks the highest-scoring path.
  - Pool: Combines multiple paths into a single answer.

### Shared Tabs

The following tabs function just like in the Assistant Agent:

- Agent: Name, description, and system message.
- Termination: Rules for stopping the agent.
- Code Execution: Optional code block evaluation.
- Models / Tools: Assign models or enable tool-based workflows.

## Captain Agent

A *Captain Agent* orchestrates a conversation by dynamically creating agents and tools from a pre-defined library. It’s particularly useful for simulations, planning sessions, and AI-driven multi-agent environments where the participants and tools are defined at runtime.

![Gaptain agent - Setup preview](../static/images/light/captain.webp#only-light)
![Gaptain agent - Setup preview](../static/images/dark/captain.webp#only-dark)

### Configuration

In the Captain tab, you define the scope and components of the simulated group chat:

- Max Round: The maximum number of message rounds to run in the generated conversation.
- Include Tool Lib: If enabled, tools from a pre-defined library will be included.
<!-- → You can view available tools here. -->
- Include Agent Lib: If enabled, the Captain will dynamically generate agents from a provided agent library file.
<!-- → Example agent library: agent_library_example.json -->
- File Upload Box: Drop in your custom agent or tool library as a JSON file.

### Common Tabs

Like other agents, the Captain also includes the standard configuration tabs:

- Termination
- Code Execution
- Models
- Tools

Refer to the Assistant Agent section above for guidance on these.

## Group Manager

The Group Manager Agent allows you to create multi-agent group chats with dynamic conversation flows. It coordinates the interaction between agents based on your speaker selection and group configuration.

![Gaptain agent - Setup preview](../static/images/light/group_1.webp#only-light)
![Gaptain agent - Setup preview](../static/images/dark/group_1.webp#only-dark)

### Group Tab

Configure the overall group metadata:

- **Group Name**: Set a custom name for this group.
- **Initial Agent**: Choose the agent that will start the conversation.
- **Context Variables**: Define key-value pairs to share context between agents.

### Group Manager Tab

Configure the manager that oversees the group:

- **Models to use**: Assign the model(s) the group manager will use.
- **Group Manager’s Name:** A label to refer to the manager (e.g., Manager).
- **Description**: Optional description of the manager’s role.
- **System Message**: Set the behavioral instruction or system-level message for the group manager.
- **Send Introductions**: When enabled, sends a round of introductions at the start of the conversation so agents know who they can interact with.
- **Enable Clear History**: If checked, history is reset after each conversation round.

### Speakers Tab

Define how speakers take turns in the conversation:

- Speaker Selection Method:
- **Auto**: The LLM automatically selects the next speaker.
- **Manual**: You manually select the next speaker.
- **Default**: Uses the explicitly defined transitions in the flow.
- **Random**: Randomly picks the next speaker.
- **Round Robin**: Cycles through speakers in the provided order.

![Gaptain agent - Setup preview](../static/images/light/group_2.webp#only-light)
![Gaptain agent - Setup preview](../static/images/dark/group_2.webp#only-dark)

- **Max Retries for Selecting a Speaker**: Set the number of attempts allowed to pick the next speaker before giving up.

## Nested Chats

Nested chats let agents launch sub-conversations when certain triggers occur—such as receiving a message from another agent or fulfilling a condition. They’re useful when an agent needs to temporarily delegate part of its task to others and later return with the result.

### When Available

- Only visible when an agent is connected to at least one other agent.
- The “Nested Chat” tab will then appear in the source agent's configuration.

![Nested chat - Setup preview](../static/images/light/nested_1.webp#only-light)
![Nested chat - Setup preview](../static/images/dark/nested_1.webp#only-dark)

### Configuration Tabs

#### Queue

Define the order in which connected agents should be evaluated during the nested chat.

- Agents are prioritized top to bottom.
- You can drag or click the up/down arrows to reorder them.

#### Condition

Specify when a nested chat transition is allowed:

- **Static LLM Prompt**: Fixed message evaluated by the LLM.
- **Dynamic LLM Prompt**: Uses context variables in a templated message.
- **Variable Check**: Checks if a given variable is truthy.
- **Expression Check**: Allows short logic expressions like `${is_logged_in} and not ${is_banned}`.

#### Availability

Fine-tune when a specific nested chat is considered usable.

- Enables filtering based on dynamic runtime conditions.

### Group Agent Variations

When agents are part of a group (i.e. nested inside a Group Manager), nested chat logic is governed by the `Handoffs` and group settings:

- Group speaker mode must be set to `default` for nested chat to take effect.
- Handoffs tab will show an entry like:

  ```text
  2. Nested Chat → Assistant 2 + 1 more
  ```

---

## Group Membership and Handoffs

If a group manager is available in the flow, an option to join and configure each agent's group membership is also included.

![Group membership preview](../static/images/light/group_membership.webp#only-light)
![Group membership previeww](../static/images/dark/group_membership.webp#only-dark)

### Group Tab (per agent)

Each agent can define what happens after its turn ends:

- **Membership**: Determines if the agent belongs to a group.
- **Handoffs**: Sets the next agent or nested chat flow. Ordered top-down.
- **State**: Lets the agent update its system message before replying.
  - Can be a function or templated string using context vars.
- **Afterwards**: Specify fallback behavior (e.g., return to user, terminate, ask manager).

### Handoff Priorities

If group’s speaker mode is `default`, handoffs are processed top to bottom:

1. First match is executed (based on condition or availability)
2. If no match is valid, fallback in `Afterwards` tab is used

---

### Nested + Group Example

![Nested Chat handoff preview](../static/images/light/nested_handoff.webp#only-light)
![Nested Chat handoff previeww](../static/images/dark/nested_handoff.webp#only-dark)

- Assistant is in a group.
- It connects to Assistant 2 and 3 via nested chat.
- In Handoffs, "Nested Chat" comes after a direct connection.
- If `Assistant 2` is unavailable or condition fails, `Assistant 3` is used.
- Once both finish, control is handed back to the group or user.

This structure enables powerful branching, fallback logic, and temporary delegation.
