## Setting Up a Model

- **Create a new model**:
On the Models view, click "Add model" to create a new model. You can click on the gear icon, or double click the model's view to access its settings.

- **Basic Tab**:
  - **Name**: Enter a unique name for the model.
  - **Description**: Provide a brief description of the model's purpose or functionality.
  - **Model Type**: Select the model type (e.g., OpenAI) from the dropdown list.
  - **API Key**: Input your API key to authenticate requests.
  - **Base URL**: If the base URL is not one that is pre-filled, you can specify the API base URL (for OpenAI models, it’s usually `https://api.openai.com/v1` but for other OpenAI compatible models, this can differ).

![Models Preview](../static/images/light/models_1.webp#only-light)
![Models Dark Preview](../static/images/dark/models_1.webp#only-dark)

- **Advanced Tab**:
  - **Temperature**: Adjust the temperature (a value between 0 and 1) to control the creativity of the model's output. Lower values produce more deterministic results, while higher values allow for more diverse responses.
  - **Top P**: Set the Top P parameter to limit the selection of tokens based on cumulative probability. If you want it unset, leave it as is.
  - **Max Tokens**: Define the maximum token count for each response (set to "No limit" in the example).
  - **Default Headers**: Add any additional headers needed for API requests (optional).
  - **Tags**: Use tags to categorize or label the model (optional but recommended).

![Models Advance Tab Preview](../static/images/light/models_2.webp#only-light)
![Models Advance Tab Dark Preview](../static/images/dark/models_2.webp#only-dark)

- **Price Tab**:
  - **Prompt price per 1K tokens**: Enter the price per 1,000 tokens for the model (optional).
  - **Completion price per 1K tokens**: Enter the price per 1,000 tokens for completions (optional).

- **Save the Configuration**:
  - After completing the setup in any of the tabs, click **Save** to confirm and apply the model configuration.

This setup will enable you to link this model to one or more agents for generating responses based on the model's capabilities.
