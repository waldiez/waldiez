# Changelog

<!-- Careful with the quotes or any special chars
The contents of each release will be used in
"gh release create"
Also, make sure the npm token is not expired
 -->

## Unreleased

- Added waldiez-as-a-tool support
- Added python3.14 support
- Allow overriding the initial message in run and export
- Allow skipping dependencies installation in the runner
- Updated ag2 dependency to 0.10.3
- Updated jupyter dependencies to 4.5.1
- Bug fixes and enhancements
- UI related enhancements
- Dependency updates

## v0.6.11

- Fixed an issue in vscode extension with step-by-step mode state and view updates

## v0.6.10

- Added Claude 4.5 Opus and Sonnet 4.5 Haiku predefined model options
- Fixed an issue in studio regarding base url and static assets
- Dependency updates

## v0.6.9

- Updated ag2 dependency to 0.10.2
- Updated code generation to allow case sensitive names
- Minor UI enhancements
- Bug fixes
- Dependency updates

## v0.6.8

- Invalid/Yanked release

## v0.6.7

- Minor bug fixes
- Minor UI enhancements
- Dependency updates

## v0.6.6

- Updated monaco-editor options
- Minor bug fixes
- Dependency updates

## v0.6.5

- Fixed an issue with monaco editor content being shared across multiple editor instances
- Dependency updates

## v0.6.4

- Fixed an issue with custom summary method not being imported correctly
- Updated waldiez-studio base url handling

## v0.6.3

- Updated ag2 dependency to 0.10.1
- Updated jupyter dependencies to 4.5.0
- Added support for custom summary functions in chats
- Bug fixes and enhancements
- Dependency updates

## v0.6.2

- Added checkpoints support in the step-by-step runner for group chats
- Updated jupyter dependencies to 4.4.10
- UI minor enhancements
- Bug fixes and enhancements
- Dependency updates

## v0.6.1

- Updated ag2 dependency to 0.9.10
- Updated jupyter dependencies to 4.4.9
- Added Claude Sonnet 4.5 option for predefined models
- Added breakpoints support in the step-by-step runner
- Added multiple tabs support in studio
- Added dnd support for uploading files in studio
- Bug fixes and enhancements
- UI related enhancements
- Dependency updates

## v0.6.0

- New mode for step-by-step running a waldiez flow
- Waldiez-runner bug fixes and enhancements, including administration related actions
- New waldiez-studio with file previews, python code execution and terminal view
- Dependency updates, including jupyter 4.4.7
- Bug fixes
- UI related enhancements

## v0.5.10

- Updated ag2 dependency to 0.9.9
- Updated jupyter dependencies to 4.4.6
- Added GPT-5, GPT-5 Mini, GPT-5 Nano options for predefined models
- Added GPT-OSS-20B, GPT-OSS-120B NIM model options for predefined models
- Allow lists and dicts in group context variables
- Fixed missing ContextExpression when exporting
- Remove system message from group manager
- Fixed long tool description display
- Use different icon for shared and custom tools
- Added waldiez.ws for websocket server used in development
- Python only: Added step-py-step-runner for debug execution
- Added subprocess runner for running flows in separate processes
- Other bug fixes
- Other dependency updates

## v0.5.9

- Added support for custom .env files in the runner
- Changed the runner to return a list of dicts
- Fixed a missing await in a_run_group_chat
- Make the generated code search the os.environ first for the tool and model secrets
- Dependency updates
- Handled a version conflict on aiohttp between waldiez_runner and waldiez_studio
- Made google search engine id a secret instead of a kwarg in the google search tool

## v0.5.8

- Added support for custom .env files in the runner
- Changed the runner to return a list of dicts
- Fixed a missing await in a_run_group_chat
- Make the generated code search the os.environ first for the tool and model secrets
- Dependency updates

## v0.5.7

- Added hub search functionality
- Updated ag2 dependency to 0.9.7
- Minor UI changes
- Bug fixes
- Dependency updates

## v0.5.6

- Fixed a bug with the tools view

## v0.5.5

- Fixed a bug with the editor not loading when a non predefined tool is selected

## v0.5.4

- Updated ag2 dependency to 0.9.6
- Updated jupyter dependencies to 4.4.5
- Added more predefined tools
- Replaced RAG User Proxy agent with Doc Agent
- Minor UI changes
- Bug fixes and bug introductions
- Dependency updates

## v0.5.3

- Updated ag2 dependency to 0.9.5
- Added cost and timeline post-processing step
- Vscode extension updates
- Minor UI changes
- Bug fixes
- Dependency updates

## v0.5.2

- Added predefined tools
- Updated ag2 dependency to 0.9.4
- Updated jupyter dependencies to 4.4.4
- Minor UI changes
- Bug fixes
- Dependency updates

## v0.5.1

- Add upload to hub option when exporting a flow
- Dependency updates

## v0.5.0

- Updated ag2 dependency to 0.9.3.
- Swarm deprecation and migration to group chats as in ag2.
- New json schema to ensure ts and py compatibility.
- Several ui changes.
- Added structured IO Stream.
- Image usage support with ag2 Multimodal agent.
- Several bug fixes.
- Updated dependencies.
- NOTE: Previously created waldiez flows will not work.

## v0.4.7

- Fixed a bug with flow not running if using a swarm chat.

## v0.4.6

- Updated jupyter dependencies to 4.4.2
- UI: Fixed typos in predefined models
- UI: Make modals resizable and draggable
- VSCode: Fixed an issue with activating previously opened flows
- Dependency updates
- Other Minor UI changes
- Other Minor Bug fixes

## v0.4.5

- Minor UI changes
- Dependency updates
- Bug fixes

## v0.4.4

- Updated ag2 dependency to 0.8.7
- Updated jupyter dependencies to 4.4.1
- Introduce waldiez-runner
- UI: Added predefined models to select from
- UI: Added a button to test model configurations
- Dependency updates
- Bug fixes

## v0.4.3

- Updated ag2 dependency to 0.8.6
- Jupyter: Updated jupyter dependencies to 4.4.0
- Minor code rebase changes to sync with ag2
- Minor UI changes
- Dependency updates
- Bug fixes

## v0.4.2

- Updated ag2 dependency to 0.8.4
- Added limited support for Python 3.13: no CrewAI tools with Python 3.13
- Jupyter: Updated jupyter dependencies to 4.3.6
- Jupyter: Added an extra button to interrupt the kernel.
- Minor code rebase to sync with ag2
- Minor UI changes
- Dependency updates
- Js: Using Node.js 22 LTS, dropped older versions
- Doc updates
- Bug fixes

## v0.4.1

- Allow captain agent use non-openai models.
- Dependency updates.

## v0.4.0

- Updated ag2 dependency to 0.7.4
- Added captain agent support
- Added LangChain and CrewAI interoperability support for tools.
- Minor ui changes and bug fixes
- Dependency updates

## v0.3.12

- Added cohere model option
- Fixed an issue with loading swarm agents and an existing flow id
- Dependency updates

## v0.3.11

- Updated ag2 dependency to 0.7.3
- Added a cache seed option
- Fixed an indentation issue when exporting to ipynb a flow with reasoning agents
- Dependency updates

## v0.3.10

- Added async mode
- Fixed a bug with long variable or function names
- Minor ui changes
- Dependency updates

## v0.3.9

- Added deepseek model option
- Added feature to export the reasoning agents tree of thoughts to json
- Minor ui changes
- Dependency updates

## v0.3.8

- Added deepseek model option
- Added feature to export the reasoning agents tree of thoughts to json
- Minor ui changes
- Dependency updates

## v0.3.7

- Updated ag2 dependency to 0.7.2
- Added reasoning agent.
- Fixed an issue with gemini dependencies not being installed automatically.
- Minor ui changes.
- Dependency updates.

## v0.3.6

- Fixed an issue with initial swarm chat parameters

## v0.3.5

- Fixed an issue with initial swarm chat parameters

## v0.3.3

- Minor styling changes and bug fixes
- Dependency updates.

## v0.3.1

- Updated swarm agent icon
- Minor styling changes and bug fixes
- Dependency updates.

## v0.3.0

- Added swarm agent ag2 compatibility
- Add post-processing step to generate mermaid diagrams
- Minor styling changes
- Dependency updates.

## v0.2.2

- introduce waldiez_studio
- add waldiez extras: 'studio' and 'jupyter'
- python dependency updates, including ag2 v0.6.0
- Dev dependencies updates

## v0.2.1

- (invalid) Testing new release process

## v0.2.0

- (invalid) Testing new release process

## v0.1.20

- Fix models not using a default base_url if not provided
- Updated runner: try handling UnicodeDecodeError
- Ignore 'flaml.automl is not available' warning

## v0.1.19

- Updated runner: Make the call to install requirements public

## v0.1.18

- Removed custom IOStream
- Handle refreshing the environment after pip install
- Dev dependencies updates

## v0.1.17

- Updated ag2 to 0.5.3
- Fixed an issue using uuid instead of str for the flow id
- Updated runtime logging to start earlier

## v0.1.16

- Updated conflict checker to provide more detailed instructions on how to resolve conflicts

## v0.1.15

- Updated requirements. Force pydantic to >=2.0

## v0.1.14

- Updated cli to allow/ignore extra arguments
- Fixed typo in pydantic model
- Updated ag2 to 0.5.0
- Other dependency updates

## v0.1.13

- Fix cli start script in pyproject.toml

## v0.1.12

- Updated cli usage (use typer)
- Added a `check` command option to validate a flow
- Fixed an issue with `pip install {requirements}` giving `externally-managed-environment` error

## v0.1.11

- Added a conflict check for ag2 and autogen-agentchat
- Updated exporting skills: create a new file the the skill secrets
- Updated ag2 to 0.4.1
- Other dependency updates

## v0.1.10

- Fixed an issue with using a chromadb client without telemetry

## v0.1.9

- Fix quotes in paths
- Disable chromadb telemetry
- Dependency updates

## v0.1.8

- Change autogen-agentchat to ag2
- Requirement updates
- Minor doc changes

- ## v0.1.7

- Move `WaldiezIOStream` to `waldiez.io` module
- Move autogen imports to local imports
- Also Provide a container (docker/podman) image for running/exporting Waldiez flows

## v0.1.6

- Fix SyntaxError with quoted strings
- Update twisted to 24.10.0

## v0.1.5

- Fix Quoting issue in chat messages

## v0.1.4

- Fix #40 - AttributeError: 'NoneType' object has no attribute 'endswith' with keyword termination.

## v0.1.3

- Exporting: Use a separate file for the model API keys

## v0.1.2

- RAG: handle windows paths
- Remove max_tokens from agent data

## v0.1.1

- RAG: use string literals for paths, to avoid issues with backslashes in Windows

## v0.1.0

- Initial release
