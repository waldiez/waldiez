.DEFAULT_GOAL := help

.TESTS_DIR := tests
.REPORTS_DIR := coverage
.PACKAGE_NAME := my_package

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Default target: help"
	@echo ""
	@echo "Targets:"
	@echo " help             Show this message and exit"
	@echo " format           Format the code"
	@echo " lint             Lint the code"
	@echo " forlint          Alias for 'make format && make lint'"
	@echo " requirements     Generate requirements/*.txt files"
	@echo " test             Run the tests"
	@echo " docs             Generate the documentation"
	@echo " docs-live        Generate the documentation in 'live' mode"
	@echo " clean            Remove unneeded files (__pycache__, .mypy_cache, etc.)"
	@echo " build            Build the python package"
	@echo " images           Generate container images"
	@echo " all              Run 'make format && make lint && make test && make docs && make build && make image'"
	@echo ""

.PHONY: format
format: requirements
	python -m pip install -r requirements/all.txt
	isort .
	autoflake --remove-all-unused-imports --remove-unused-variables --in-place .
	black --config pyproject.toml .
	ruff format --config pyproject.toml .

.PHONY: lint
lint: requirements
	python -m pip install -r requirements/all.txt
	isort --check-only .
	black --check --config pyproject.toml .
	mypy --config pyproject.toml .
	flake8 --config=.flake8
	pydocstyle --config pyproject.toml .
	bandit -r -c pyproject.toml .
	yamllint -c .yamllint.yaml .
	ruff check --config pyproject.toml .
	pylint --rcfile=pyproject.toml .

.PHONY: forlint
forlint: format lint

.PHONY: clean
clean:
	python scripts/clean.py

.PHONY: requirements
requirements:
	python scripts/requirements.py

.PHONY: .before_test
.before_test: requirements
	python -c 'import os; os.makedirs("${.REPORTS_DIR}", exist_ok=True)'
	python -c \
		'import subprocess, sys; subprocess.run(\
		[sys.executable, "-m", "pip", "uninstall", "-y", "${.PACKAGE_NAME}"], \
		stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)'
	python -m pip install -r requirements/test.txt

.PHONY: test
test: .before_test
	python -m pytest \
		-c pyproject.toml \
		--cov=${.PACKAGE_NAME} \
		--cov-report=term-missing:skip-covered \
		--cov-report html:${.REPORTS_DIR}/html \
		--cov-report xml:${.REPORTS_DIR}/coverage.xml \
		--cov-report lcov:${.REPORTS_DIR}/lcov.info \
		--junitxml=${.REPORTS_DIR}/xunit.xml \
		${.TESTS_DIR}/

.PHONY: docs
docs:
	python -m pip install -r requirements/docs.txt
	python -m mkdocs build -d site
	@echo "open:   file://`pwd`/site/index.html"
	@echo "or use: \`python -m http.server --directory site\`"

.PHONY: docs-live
docs-live:
	python -m pip install -r requirements/docs.txt
	python -m mkdocs serve --watch mkdocs.yaml --watch docs --watch ${.PACKAGE_NAME} --dev-addr localhost:8400

.PHONY: build
build:
	python -c 'import os; os.makedirs("dist", exist_ok=True); os.makedirs("build", exist_ok=True)'
	python -c 'import shutil; shutil.rmtree("dist", ignore_errors=True); shutil.rmtree("build", ignore_errors=True)'
	python -m pip install --upgrade pip wheel
	python -m pip install -r requirements/main.txt
	python -m pip install build twine
	python -m build --sdist --wheel --outdir dist/
	python -m twine check dist/*.whl
	python -c 'import shutil; shutil.rmtree("build", ignore_errors=True)'

.PHONY: images
images:
	python scripts/image.py --platform linux/amd64
	python scripts/image.py --platform linux/arm64

.PHONY: all
all: forlint test docs build images
