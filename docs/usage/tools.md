
## Setting Up a new Tool

- **Create a new tool**:
    On the Tools view, click "Add tool" to create a new tool. You can click on the gear icon, or double click the tool's view to access its settings.

![Tools Preview](../static/images/light/tools.webp#only-light)
![Tools Dark Preview](../static/images/dark/tools.webp#only-dark)

- **Basic Information**:
  - **Name**: Enter a unique name for the tool (e.g., `new_tool`).
  - **Description**: Provide a brief description of the tool's purpose.
  !!! note
      The tool name should match the function name in the code.

- **Content Section**:
  - This is where you define the code for your tool
  - **Template Code**:
    - Replace the provided template code with your actual implementation.
    - Ensure that the function name matches the tool's name (e.g., if the tool is named `new_tool`, the function should also be named `new_tool`).
  - Example:
  
      ```python
        """
        Replace this with your code.
        Ensure the function name matches the tool name.
        """
        def new_tool() -> None:
            """Tool entry point."""
            # Add your logic here
      ```

- **Environment Variables** (Optional):
  - Add any necessary environment variables as key-value pairs to support the tool.
  - Click the **+** button to add multiple environment variables if required.

- **Save the Configuration**:
  - Once you have entered the tool details and code, click **Save** to confirm and apply the tool configuration.

This setup enables you to define and configure a new tool within your project by providing necessary code, naming conventions, and any environment variables.
