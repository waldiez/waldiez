
## Setting Up a new Skill

- **Create a new skill**:
    On the Skills view, click "Add skill" to create a new skill. You can click on the gear icon, or double click the skill's view to access its settings.

![Skills Preview](../static/images/light/skills.webp#only-light)
![Skills Dark Preview](../static/images/dark/skills.webp#only-dark)

- **Basic Information**:
  - **Name**: Enter a unique name for the skill (e.g., `new_skill`).
  - **Description**: Provide a brief description of the skill's purpose.
  !!! note
      The skill name should match the function name in the code.

- **Content Section**:
  - This is where you define the code for your skill
  - **Template Code**:
    - Replace the provided template code with your actual implementation.
    - Ensure that the function name matches the skill's name (e.g., if the skill is named `new_skill`, the function should also be named `new_skill`).
  - Example:
  
      ```python
        """
        Replace this with your code.
        Ensure the function name matches the skill name.
        """
        def new_skill() -> None:
            """Skill entry point."""
            # Add your logic here
      ```

- **Environment Variables** (Optional):
  - Add any necessary environment variables as key-value pairs to support the skill.
  - Click the **+** button to add multiple environment variables if required.

- **Save the Configuration**:
  - Once you have entered the skill details and code, click **Save** to confirm and apply the skill configuration.

This setup enables you to define and configure a new skill within your project by providing necessary code, naming conventions, and any environment variables.
