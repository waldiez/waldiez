# Changelog

<!-- Careful with the quotes or any special chars
The contents of each release will be used in
"gh release create"
 -->

## [Unreleased]

- Added async mode
- Fixed a bug with long variable or function names

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
