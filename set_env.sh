#!/usr/bin/env sh

HERE="$(dirname "$(readlink -f "$0")")"

DEFAULT_PATH="${HERE}/.venv/bin/python"
ENV_FILE="${HERE}/.env"
VENV_PATH="${HERE}/.venv"

# Function to check Python version
check_python_version() {
    _python_exec=$1
    _version=$($_python_exec --version 2>&1 | awk '{print $2}')
    case "$_version" in
        3.10.*|3.11.*|3.12.*)
            echo "$_python_exec"
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Ensure .env file exists and load it
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    echo "PYTHON_INTERPRETER_PATH=$DEFAULT_PATH" > "$ENV_FILE"
else
    # shellcheck disable=SC1090
    . "$ENV_FILE"
fi

# Set PYTHON_INTERPRETER_PATH if not already set
if [ -z "$PYTHON_INTERPRETER_PATH" ]; then
    echo "PYTHON_INTERPRETER_PATH is not set. Setting it to default..."
    PYTHON_INTERPRETER_PATH="$DEFAULT_PATH"
    export PYTHON_INTERPRETER_PATH
    echo "PYTHON_INTERPRETER_PATH=$DEFAULT_PATH" >> "$ENV_FILE"
fi

is_macos() {
    # from (any) python
    python -c 'import platform; print(platform.system())' | grep -qi "Darwin" > /dev/null 2>&1 || return 1
}

if [  ! -f "$PYTHON_INTERPRETER_PATH" ]; then
    # maybe overridden on windows (.\venv\Scripts\python.exe)?
    # change it back to unix path
    # if it ends Scripts\python.exe, use the default path
    if echo "$PYTHON_INTERPRETER_PATH" | grep -q "Scripts\\python.exe"; then
        PYTHON_INTERPRETER_PATH="$DEFAULT_PATH"
        export PYTHON_INTERPRETER_PATH
        # replace if it is in the .env file
        if is_macos; then
            sed -i '' "s|PYTHON_INTERPRETER_PATH=.*|PYTHON_INTERPRETER_PATH=$DEFAULT_PATH|" "$ENV_FILE"
        else
            sed -i "s|PYTHON_INTERPRETER_PATH=.*|PYTHON_INTERPRETER_PATH=$DEFAULT_PATH|" "$ENV_FILE"
        fi
    fi
fi

# Check Python version
PYTHON_EXEC=""
if check_python_version "$PYTHON_INTERPRETER_PATH"; then
    PYTHON_EXEC="$PYTHON_INTERPRETER_PATH"
else
    for version in 10 11 12; do
        if PYTHON_EXEC=$(check_python_version "python3.$version"); then
            break
        fi
    done
fi

if [ -z "$PYTHON_EXEC" ]; then
    echo "No suitable Python version found. Please install Python >= 3.10 and < 3.13."
    exit 1
fi

# Ensure the virtual environment exists
if [ ! -d "$VENV_PATH" ] || [ ! -x "$DEFAULT_PATH" ]; then
    echo "Virtual environment not found or invalid. Creating one..."
    if ! "$PYTHON_EXEC" -m venv "$VENV_PATH"; then
        echo "Failed to create virtual environment. Ensure Python >= 3.10 and < 3.13 is installed."
        exit 1
    fi
    echo "Virtual environment created successfully at $VENV_PATH"
fi

# shellcheck disable=SC1091
. "$VENV_PATH/bin/activate"
export PATH="$VENV_PATH/bin:$PATH"
# Update pip
echo "Updating pip..."
if ! "$PYTHON_EXEC" -m pip install --upgrade uv pip; then
    echo "Failed to update pip. Please check your Python installation."
    exit 1
fi
echo "Python Interpreter Path: $PYTHON_INTERPRETER_PATH"
echo "You can call 'bun requirements' to install the requirements"
echo "And 'uv sync --all-packages' to sync the packages (and check for conflicts)"
