.DEFAULT_GOAL := help

.TESTS_DIR := tests
.PACKAGE_NAME := waldiez

ifeq ($(OS),Windows_NT)
  PYTHON_PATH := $(shell where python 2>NUL || where py 2>NUL)
else
  PYTHON_PATH := $(shell command -v python || command -v python3)
endif

PYTHON_NAME := $(notdir $(lastword $(PYTHON_PATH)))
PYTHON := $(basename $(PYTHON_NAME))

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Default target: help"
	@echo ""
	@echo "Targets:"
	@echo " help             Show this message and exit"
	@echo " requirements     Generate requirements/*.txt files"
	@echo " format           Run the formatters for the python package"
	@echo " lint             Run the linters for the python package"
	@echo " forlint          Alias for 'format' and 'lint'"
	@echo " clean            Cleanup unneeded files"
	@echo " test             Run the tests on the python package"
	@echo " test-models      Run the tests on the models"
	@echo " test-exporting   Run the tests on exporting module"
	@echo " test-running     Run the tests on running module"
	@echo " test-io          Run the tests on IO module"
	@echo " test-ws          Run the tests on ws module"
	@echo " test-storage     Run the tests on the storage module"
	@echo " test-schema      Run the tests on the schema"
	@echo " build            Build the python package"
	@echo " docs             Generate the python documentation"
	@echo " docs-live        Generate the documentation in 'live' mode"
	@echo " images           Build the podman/docker images"
	@echo " smoke            Run smoke tests on the python package"
	@echo " smoke-local      Run smoke tests on the python package using local examples"
	@echo " smoke-remote     Run smoke tests on the python package using remote examples"
	@echo " dev              Start both python and react dev servers"
	@echo " some             Run some (not all) of the above"


.PHONY: format
format:
	$(PYTHON) scripts/format.py

.PHONY: lint
lint:
	$(PYTHON) scripts/lint.py

.PHONY: forlint
forlint: format lint

.PHONY: clean
clean:
	$(PYTHON) scripts/clean.py

.PHONY: test
test:
	$(PYTHON) scripts/test.py


.PHONY: test_models
test_models:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/models \
		--cov-branch \
		${.TESTS_DIR}/models

.PHONY: test-models
test-models: test_models

.PHONY: test_exporting
test_exporting:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/exporting \
		--cov-branch \
		${.TESTS_DIR}/exporting

.PHONY: test-exporting
test-exporting: test_exporting

.PHONY: test_running
test_running:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/running \
		--cov-branch \
		${.TESTS_DIR}/running

.PHONY: test-running
test-running: test_running

.PHONY: test_io
test_io:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/io \
		--cov-branch \
		${.TESTS_DIR}/io

.PHONY: test-io
test-io: test_io

.PHONY: test_ws
test_ws:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/ws \
		--cov-branch \
		${.TESTS_DIR}/ws

.PHONY: test-ws
test-ws: test_ws

.PHONY: test_storage
test_storage:
	pytest \
		-c pyproject.toml -vv \
		--cov-report=term-missing:skip-covered \
		--cov=${.PACKAGE_NAME}/storage \
		--cov-branch \
		${.TESTS_DIR}/storage

.PHONY: test-storage
test-storage: test_storage

.PHONY: test_schema
test_schema:
	pytest \
		-c pyproject.toml -vv \
		${.TESTS_DIR}/test_schema.py

.PHONY: test-schema
test-schema: test_schema

.PHONY: schema
schema:
	bun schema

.PHONY: build
build:
	$(PYTHON) scripts/build.py

.PHONY: docs
docs:
	$(PYTHON) scripts/docs.py

.PHONY: docs-live
docs-live:
	$(PYTHON) -m pip install -r requirements/docs.txt
	$(PYTHON) -m mkdocs serve --watch mkdocs.yml --watch docs --watch waldiez --dev-addr localhost:8400

.PHONY: image
image:
	$(PYTHON) scripts/image.py

.PHONY: requirements
requirements:
	$(PYTHON) scripts/requirements.py

.PHONY: some
some: clean format lint test build docs image

.PHONY: smoke
smoke:
	$(PYTHON) scripts/smoke.py

.PHONY: smoke-local
smoke-local:
	$(PYTHON) scripts/smoke.py --local

.PHONY: smoke_local
smoke_local: smoke-local

.PHONY: smoke-remote
smoke-remote:
	$(PYTHON) scripts/smoke.py --remote

.PHONY: smoke_remote
smoke_remote: smoke-remote

.PHONY: dev
dev:
	$(PYTHON) scripts/dev.py
