# Connecting Agents

Once you have created and configured agents, you can connect them to create a flow of interactions. This flow can be as simple as a single agent responding to user inputs or as complex as multiple agents interacting with each other.

## Chats

![Chat Preview](../static/images/light/chats.webp#only-light)
![Chat Dark Preview](../static/images/dark/chats.webp#only-dark)

### **Message Type and Content**

In the **Message** tab, you can set the type and content of the message that will be sent from the source (e.g., Assistant) to the target (e.g., User).

- **Message Type:** Choose the type of message from the dropdown:
  - **None:** No message is sent.
  - **Text:** Allows for sending a custom text message.
  - **Custom Method:** Select this if you have a custom message handling method.

- **Message Content:** If "Text" is selected as the type, enter the specific message you want to send here.

---

### **Carryover Option**

The **Carryover** setting determines if the last context from a previous message should be appended to the new message.

- **Carryover:** Check this box to include the last carryover context in the message.
  - For example, if the carryover context includes instructions or prior context, it will be appended to the message.

!!! note
    Do not check **Carryover** if this is the first message in the flow.

---

### Nested Chats

If the type of chat is a nested chat, you can configure the nested chat settings in the **Nested Chat** tab. Here, in addition to the message type and content, you can set up replies specific to nested chat interactions.

## Flow Order and Dependencies

This guide explains how to configure and manage flows, which are sequences of actions or chats that an agent can execute.

![Flow settings Preview](../static/images/light/flow.webp#only-light)
![Flow settings Dark Preview](../static/images/dark/flow.webp#only-dark)

### **Edit Flow - Basic Settings**

In the **Edit Flow** tab, set up the basic details and order of chats in the flow.

- **Name:** Enter a name for the flow.
- **Description:** Provide a brief description of the flow.
- **Order:** Define the sequence in which chats should run when the flow initializes.
  - **Add a Chat:** Use the dropdown to select and add a new chat to the flow order.
  - **Remove a Chat:** Click **Remove** next to a chat to delete it from the sequence.
  - **Reorder Chats:** Use the **↑** and **↓** buttons to adjust the order of chats.

---

## **Edit Flow - Other Settings**

In the **Other** tab, specify any additional requirements or tags for the flow.

- **Additional Requirements:** Add any Python packages that need to be installed before running the flow.
  - **Example:** If your flow requires the `pandas` library, type `pandas` and click **+** to add it to the requirements list.
  - Each package listed here will be installed via `pip install` before the flow starts.
- **Tags:** Add relevant tags to categorize the flow for easier management or searching.
