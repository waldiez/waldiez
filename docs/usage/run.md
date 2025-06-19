## Running a Flow

Once we have setup the models, agents, and connections in the flow, we open the *Edit Flow* modal to specify which connections should be used to initiate the conversation, specify any additional requirements that might be needed. Let's also give the flow a descriptive name and maybe a short description.

![Edit flow order](../static/images/light/run.webp#only-light)
![Edit flow](../static/images/dark/run.webp#only-dark)

## Troubleshooting Errors

During the flow execution, you might encounter errors that can interrupt the conversation. Here are some common errors and solutions to help you resolve them.

### Troubleshooting Common Errors

!!! Note
    If an error persists, or new packages were installed, you might need to restart the kernel to apply the changes.
    If this does not resolve the issue, or you need further assistance, please reach out to us, we are more than happy to help!

#### **ChromaDB Installation Fails on Windows**

**Description:** When installing `chromadb` on Windows, you might encounter build errors due to missing C++ build tools.

- **Error Message (example):**
  
  ```text
  error: Microsoft Visual C++ 14.0 or greater is required. Get it with "Microsoft C++ Build Tools"
    ```

- **Cause:** Some ChromaDB dependencies require native code compilation. Windows systems need additional tools for this. Here is a related link on chroma's repository with a solution (thanks to the author): <https://github.com/chroma-core/chroma/issues/189#issuecomment-1454418844>

- **Solution:**
  - Install the required C++ build tools from the [Microsoft website](https://visualstudio.microsoft.com/visual-cpp-build-tools/). You probably need to install a few only components (based on you windows version, see the link above if in doubt).
  - You can manually test the installation of `chromadb` by running the following command in your terminal:

    ```shell
    pip install chromadb
    ```

  - If the installation is successful, you can proceed with the flow. If not, check the error messages for more details.

!!!Note
    This error could also occur with other extra dependencies that might be needed for running a flow, so keep in mind this error in case you are using other packages that require native code compilation.

![Waldiez Error Preview](../static/images/light/error1.webp#only-light)
![Waldiez Error Dark Preview](../static/images/dark/error1.webp#only-dark)

#### **ValidationError: Agent Not Connected**

**Description:** This error occurs when an agent in the flow is not connected to any other node, causing the flow to be incomplete.

- **Error Message:**

```text
  ValidationError: 1 validation error for [Flow Name]
  Value error, Agent does not connect to any other node.
```

- **Solution:**
  - Identify the agent mentioned in the error (e.g., `Planner`).
  - Connect this agent to another node in the flow to complete the sequence.
  - Re-run the flow after making the connection.

![Autogen Error Preview](../static/images/light/error2.webp#only-light)
![Autogen Error Dark Preview](../static/images/dark/error2.webp#only-dark)

#### **OpenAI Error: Missing API Key**

**Description:** This error appears when the OpenAI API key is not set, preventing the tool from accessing OpenAI's services.

- **Error Message:**

  ```text
  OpenAIError: The api_key client option must be set either by passing api_key to the client or by setting the OPENAI_API_KEY environment variable.
  ```

- **Solution:**
  - Make sure you have set the API key in the model configuration.
  - Restart the flow after setting the API key to ensure it is recognized.

#### **Tool or custom functions related errors**

**Description:** Errors related to tools or custom functions can occur due to incorrect function names, missing environment variables, or syntax errors in the code.

![Autogen Error Preview](../static/images/light/error3.webp#only-light)
![Autogen Error Dark Preview](../static/images/dark/error3.webp#only-dark)

Make sure to check the following:

- **Function Name:** In tools, ensure the function name in the code matches the tool name.
- **Syntax Errors:** Review the code for any syntax errors or typos that may cause the function to fail.
- **Environment Variables:** If environment variables are required, ensure they are correctly set in the tool configuration.
- **Logs:** Check the logs for detailed error messages that can help identify the issue.

#### **General Debugging Tips**

- **Check Connections:** Ensure all nodes are connected correctly in the flow. Unconnected nodes can interrupt the flow sequence.
- **Verify Configuration:** Review the configuration for each agent and node. Ensure all fields are populated with valid data, especially required fields like API keys.
- **Restart and Retry:** After making changes to resolve errors, restart the flow to test if the issue is resolved.
- **Review Logs:** Check the logs for detailed error messages or warnings that can help identify the root cause of the issue.
