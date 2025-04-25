In the agents view, you can design and organize agent workflows by connecting nodes representing different components in the process.

- **Adding Agents**:
  - On the left sidebar, you'll find options such as "User Proxy," "Assistant," and "Group Manager." Drag and drop any of these to the canvas to start building your workflow.

- **Connecting Nodes**:
  - Connect nodes by dragging lines from one node to another. This is used to create the information flow between agents.

- **Configuring Agents**:
  - Each agent has settings where you can specify the model, add a system message, and set other properties.
  - Double-clicking an agent allows you to edit its properties, such as setting the agent's name, linking models and skills to it, and defining the agent's behavior.

![Assistant Preview](../static/images/light/assistant_1.webp#only-light)
![Assistant Dark Preview](../static/images/dark/assistant_1.webp#only-dark)

## User Proxy Agent, Assistant Agent

The assistant agent is a conversational agent that can interact with users and execute code. You can configure the assistant's behavior, termination settings, code execution settings, and model configuration. The user proxy agent acts as an intermediary between the user and the assistant. The settings for these agents are similar, with some differences in the default configurations.

![Agent Modal Preview](../static/images/light/agent_1.webp#only-light)
![Agent Modal Dark Preview](../static/images/dark/agent_1.webp#only-dark)

### **General Settings**

This section allows you to configure the general behavior of the assistant agent.

- **Human Input Mode:** Select how often the agent should ask for human input after sending a message.
  - **Always:** Prompts for human input every time. This is the default setting for a user proxy agent.
  - **Terminate:** Only prompts if a termination message is received or after reaching a maximum number of consecutive auto-replies.
  - **Never:** Never prompts for human input unless a termination message is received. This is the default setting for an assistant agent.
  
- **Max Consecutive Auto Reply:** Set the maximum number of consecutive auto-replies before pausing for human input.
- **Agent Default Auto Reply:** Enter the default reply message the agent will use when there’s no human input.

---

### **Termination Settings**

The termination settings specify the conditions under which the assistant should stop replying.

- **Termination:** Choose the type of termination condition (e.g., by keyword or custom method).
- **Termination Criterion:** Set the specific criterion (e.g., "Keyword is found").
- **Termination Keywords:** Enter the keywords that will trigger termination.

---

### **Code Execution Settings**

If your assistant can execute code, configure these options here.

- **Use Code Execution:** Check this box to enable code execution capabilities.
- **Working Directory:** Set the directory where code will be executed.
- **Last N Messages:** Specify the number of previous messages to consider when executing code.
- **Timeout:** Set a timeout limit for code execution.
- **Use Docker:** Enable Docker for isolated code execution, if needed.
- **Functions:** Select specific functions the assistant can use.

---

### **Model Configuration**

Link models to your agent in this section.

- **Models linked to agent:** Select the model you wish to link. Multiple models can be linked for various functionalities.

---

### **Skill Management**

Define specific skills for the assistant.

- **Skill:** Select a previously defined skill to link to the agent.
- **Executor:** Choose the executor responsible for running the skill.
- **Current Skills:** View and manage currently linked skills.

---

### Nested Chats Configuration

When an agent is connected to another agent, you can configure the nested chat settings to create a multi-step conversation flow.
This allows you to set up automated chat sequences that are triggered based on specific messages. This can be used to guide conversations through predefined paths.
 <!-- More on this in # TODO: (In flow.md we 'll add nested chat section) -->

#### Overview

- **Triggered by:** Select who initiates the nested chat.
  - For example, `User => Assistant` means the user sends a message to the assistant, which then triggers the nested chat.
  
- **Agent's Reply:** Check this box if the message should be sent from the assistant back to the user. If unchecked, the message will be directed to the next agent in the nested sequence.

- **Messages:**
  - Use this to specify the nested chat that will be triggered.
  - The final message in the sequence will return to the main chat.
  - If the **Agent's Reply** box is checked, the trigger message is sent to the assistant; otherwise, it is sent to the user.

![Agent Nested Chats Preview](../static/images/light/nested_1.webp#only-light)
![Agent Nested Chats Dark Preview](../static/images/dark/nested_1.webp#only-dark)

#### Configure Nested Chats

1. **Define Trigger:**
   - Select the interaction pattern for triggering nested chats (e.g., `User => Assistant`).
   - Click **Add** to include this trigger.

2. **Set Messages:**
   - In the **Messages** dropdown, select the message or nested chat sequence you wish to include.
   - Check **Agent's Reply** if this message should be sent back to the assistant; otherwise, leave it unchecked.

3. **Add or Remove Steps:**
   - Use **Add** to include additional messages or nested chat sequences.
   - **Remove** steps as needed to refine the flow.

---

Use these settings to create complex conversation flows that can help automate responses and guide users through a series of related interactions.

Each of these sections allows you to customize the assistant's behavior and capabilities. Make sure to save changes before exiting the modal.

## Group Manager Agent

A group manager agent is used to manage group chats and multi-agent conversations. It allows you to configure group settings, speaker selection, and transitions between speakers.

### Group Chat Configuration

The **Group Chat** configuration allows you to manage group settings, speaker selection, and transitions between speakers in a multi-agent chat environment.

#### Configuration

##### Settings

- **Admin Name:** Define the name of the group admin.
- **Max Rounds:** Set the maximum number of conversation rounds for the group.
- **Enable Clear History:** Check this to allow history to be cleared after each conversation.
- **Send Introductions:** Enable this to automatically send introductions at the beginning.
- **Max Retries for Selecting Speaker:** Define the maximum retries for selecting a speaker.

---

#### Speakers

##### Speaker Selection

- **Speaker Repetition Mode:** Choose how often a speaker can repeat.
  - **Disabled (Use transitions):** The next speaker is chosen based on transitions.
  - **Enabled:** Allows the same speaker to repeat based on set parameters.
  
- **Speaker Selection Method:** Select the method for determining the next speaker:
  - **Auto:** Automatically selects the next speaker.
  - **Manual:** Allows manual selection of the next speaker.
  - **Random:** Randomly selects the next speaker.
  - **Round Robin:** Selects speakers in a round-robin fashion.
  - **Custom Method:** Use a custom function to select the next speaker.

##### Speaker Transitions

Set specific transitions between speakers.

1. **From / To:** Choose which agents the transition applies to. You can select more than one agents for the "To" field.
2. **Transitions Mode:** Select if transitions are **Allowed** or **Blocked**.
3. **Add Transition:** Click **Add** to save the transition.

---

These settings allow you to manage complex group conversations and control transitions between speakers that are members of the same group.

## RAG User Proxy Agent

A RAG User Proxy agent is used to enable retrieval-augmented generation (RAG) for generating responses. You can configure the agent to use RAG, set up document retrieval, customize text splitting, and define advanced settings. This can be useful for creating responses based on dynamic content retrieval and custom function integration.

![RAG Preview](../static/images/light/rag.webp#only-light)
![RAG Dark Preview](../static/images/dark/rag.webp#only-dark)

### **Enable RAG and Basic Settings**

In the **Agent** tab, you can enable RAG to allow the agent to use retrieval-augmented generation for generating responses.

- **Use RAG:** Check this box to activate RAG for the agent.
- **Name, Description, System Message:** Fill out the name, description, and any system message for the agent.
- **Human Input Mode:** Set when the agent should request human input.
- **Max Consecutive Auto Reply:** Define the limit for consecutive auto-replies.
- **Agent Default Auto Reply:** Specify a default message if there’s no human input.

---

#### **RAG Configuration - Retrieve Config**

In the **RAG** tab, configure the retrieval settings for the agent.

- **Task:** Select the RAG task, such as `code`, `qa`, or `default`. The task affects the system prompt used.
- **Docs Paths:** Specify paths to any documents you wish to include.
- **Collection Name:** Set the collection name (e.g., `autogen-docs`).
- **Number of Results:** Define the number of documents to retrieve for responses.
- **Distance Threshold:** Set a distance threshold for document retrieval relevance.

---

#### **RAG Configuration - Text Splitting**

Customize text splitting settings to control how the retrieved content is processed.

- **Chunk Token Size:** Set the size of text chunks in tokens.
- **Context Max Tokens:** Define the maximum number of tokens for context.
- **Chunk Mode:** Choose the chunking mode (`Multi Lines`, `Single Line`, etc.).
- **Must Break at Empty Line:** Check this if chunks should only break at empty lines when in `Multi Lines` mode.

---

#### **RAG Configuration - Vector DB Config**

Set up the Vector Database for embedding and retrieval.

- **Embedding Model:** Choose the model for embeddings. Available models include `all-MiniLM-L6-v2`, `bge-small-en-v1.5`, etc.
- **Use Persistent Storage:** Enable this to store embeddings persistently.
- **Connection URL:** Enter the connection URL for the vector database.

---

#### **RAG Configuration - Custom Functions**

Enable and define custom functions for embedding, token count, and text splitting.

- **Use Custom Embedding Function:** Check this box to enable a custom function for embeddings.
- **Embedding Function:** Define the Python function for custom embeddings. Refer to the code example provided to see how to structure the function.

---

#### **RAG Configuration - Advanced Settings**

The Advanced tab offers additional configuration options. You probably won't need to adjust these settings unless you have specific requirements.

- **Customized Prompt:** Specify a custom prompt for generating responses.
- **Customized Answer Prefix:** Add a prefix for responses generated by the agent.
- **Options:** Check options like `Update Context`, `Get or Create`, `New Docs`, `Overwrite`, and `Recursive` to further control document handling and context updates.
