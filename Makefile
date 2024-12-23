.DEFAULT_GOAL := help
.MANAGER_COMMAND := bun

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Default target: help"
	@echo ""
	@echo "Targets:"
	@echo " help             Show this message and exit"
	@echo " requirements-ts  Install the typescript requirements (in sub-projects)"
	@echo " requirements-py  Generate and install the python requirements (in sub-projects)"
	@echo " requirements     Install the requirements"
	@echo " format-py        Run the formatters for python"
	@echo " format-ts        Run the formatters for typescript"
	@echo " format           Run the formatters for python and typescript"
	@echo " lint-py          Run the linters for python"
	@echo " lint-ts          Run the linters for typescript"
	@echo " lint             Run the linters for python and typescript"
	@echo " forlint          Alias for 'format' and 'lint'"
	@echo " clean-py         Cleanup python related unneeded files"
	@echo " clean-ts         Cleanup typescript related unneeded files"
	@echo " clean            Cleanup python and typescript related unneeded files"
	@echo " test-py          Run the tests for python"
	@echo " test-ts          Run the tests for typescript"
	@echo " test             Run the tests for python and typescript"
	@echo " build-py         Build the python packages"
	@echo " build-ts         Build the typescript packages"
	@echo " build            Build the python and typescript packages"
	@echo " docs-py          Generate the python documentation (in sub-projects)"
	@echo " docs-ts          Generate the typescript documentation (in sub-projects)"
	@echo " docs             Generate the python and typescript documentation"
	@echo " images           Build the podman/docker images"
	@echo " all-py           Run all the python related tasks"
	@echo " all-ts           Run all the typescript related tasks"
	@echo " all              Run all the tasks"
	@echo " bump-patch       Bump the patch version"
	@echo " bump-minor       Bump the minor version"
	@echo " bump-major       Bump the major version"

.PHONY: format-py
format-py:
	$(.MANAGER_COMMAND) format:py

.PHONY: format-ts
format-ts:
	$(.MANAGER_COMMAND) format:ts

.PHONY: format
format: format-py format-ts

.PHONY: lint-py
lint-py:
	$(.MANAGER_COMMAND) lint:py

.PHONY: lint-ts
lint-ts:
	$(.MANAGER_COMMAND) lint:ts

.PHONY: lint
lint: lint-py lint-ts

.PHONY: forlint
forlint: format lint

.PHONY: clean-py
clean-py:
	$(.MANAGER_COMMAND) clean:py

.PHONY: clean-ts
clean-ts:
	$(.MANAGER_COMMAND) clean:ts

.PHONY: clean
clean: clean-py clean-ts

.PHONY: test-py
test-py:
	$(.MANAGER_COMMAND) test:py

.PHONY: test-ts
test-ts:
	$(.MANAGER_COMMAND) test:ts

.PHONY: test
test: test-py test-ts

.PHONY: build-py
build-py:
	$(.MANAGER_COMMAND) build:py

.PHONY: build-ts
build-ts:
	$(.MANAGER_COMMAND) build:ts

.PHONY: build
build: build-py build-ts

.PHONY: docs-py
docs-py:
	$(.MANAGER_COMMAND) docs:py

.PHONY: docs-ts
docs-ts:
	$(.MANAGER_COMMAND) docs:ts

.PHONY: docs
docs: docs-py docs-ts

.PHONY: images
images:
	$(.MANAGER_COMMAND) images

.PHONY: requirements-ts
requirements-ts:
	$(.MANAGER_COMMAND) requirements:ts

.PHONY: requirements-py
requirements-py:
	$(.MANAGER_COMMAND) requirements:py

.PHONY: requirements
requirements:
	$(.MANAGER_COMMAND) install
	$(.MANAGER_COMMAND) requirements

.PHONY: bump-patch
bump-patch:
	$(.MANAGER_COMMAND) bump:patch

.PHONY: bump-minor
bump-minor:
	$(.MANAGER_COMMAND) bump:minor

.PHONY: bump-major
bump-major:
	$(.MANAGER_COMMAND) bump:major

.PHONY: all-py
all-py:
	$(.MANAGER_COMMAND) all:py

.PHONY: all-ts
all-ts:
	$(.MANAGER_COMMAND) all:ts

.PHONY: all
all:
	$(.MANAGER_COMMAND) all
