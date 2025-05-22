#!/usr/bin/env sh

set -eu

if [ "$(uname)" = "Darwin" ]; then
    # macOS might not support readlink -f
    HERE="$(cd "$(dirname "$0")" && pwd)"
else
    HERE="$(dirname "$(readlink -f "$0")")"
fi
ROOT_DIR="$(dirname "${HERE}")"

cd "${ROOT_DIR}" || exit 1

pip_upgrade_pip() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -m pip install --upgrade pip
    else
        if command -v python >/dev/null 2>&1; then
            python -m pip install --upgrade pip
        else
            echo "No suitable Python interpreter found. Please install Python 3."
            exit 1
        fi
    fi
}

make_venv() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -m venv .venv
    else
        if command -v python >/dev/null 2>&1; then
            python -m venv .venv
        else
            echo "No suitable Python interpreter found. Please install Python 3."
            exit 1
        fi
    fi
}

do_py() {
    if [ -z "${HATCH_ENV_ACTIVE:-}" ]; then
        if [ ! -d "${ROOT_DIR}/.venv" ]; then
            if command -v uv >/dev/null 2>&1; then
                uv sync
                uv pip install --upgrade pip
                if [ -f .venv/bin/activate ]; then
                    # shellcheck disable=SC1091
                    . .venv/bin/activate
                else
                    echo "Activation script not found at .venv/bin/activate"
                    exit 1
                fi
                PATH="$(pwd)/.venv/bin:${PATH}"
                echo "Installing requirements..."
                uv pip install -r requirements/main.txt -r requirements/dev.txt -r requirements/test.txt
            else
                make_venv
                if [ -f .venv/bin/activate ]; then
                    # shellcheck disable=SC1091
                    . .venv/bin/activate
                else
                    echo "Activation script not found at .venv/bin/activate"
                    exit 1
                fi
                PATH="$(pwd)/.venv/bin:${PATH}"
                pip_upgrade_pip
                echo "Installing requirements..."
                pip install -r requirements/main.txt -r requirements/dev.txt -r requirements/test.txt
            fi
        else
            # Activate existing venv
            if [ -f .venv/bin/activate ]; then
                # shellcheck disable=SC1091
                . .venv/bin/activate
            else
                echo "Activation script not found at .venv/bin/activate"
                exit 1
            fi
            PATH="$(pwd)/.venv/bin:${PATH}"
        fi
        if command -v make >/dev/null 2>&1; then
            make some
        else
            # fallback to python/python3
            scripts="clean.py format.py lint.py test.py build.py docs.py image.py"
            for script in $scripts; do
                if [ -z "${HATCH_ENV_ACTIVE:-}" ]; then
                    if command -v uv >/dev/null 2>&1; then
                        uv run "scripts/$script"
                    else
                        if command -v python3 >/dev/null 2>&1; then
                            python3 "scripts/$script"
                        else
                            if command -v python >/dev/null 2>&1; then
                                python "scripts/$script"
                            else
                                echo "No suitable Python interpreter found. Please install Python 3."
                                exit 1
                            fi
                        fi
                    fi
                else
                    if command -v python3 >/dev/null 2>&1; then
                        python3 "scripts/$script"
                    else
                        if command -v python >/dev/null 2>&1; then
                            python "scripts/$script"
                        else
                            echo "No suitable Python interpreter found. Please install Python 3."
                            exit 1
                        fi
                    fi
                fi
            done
        fi
    else
        pip install --upgrade pip
        echo "Installing requirements..."
        pip install -r requirements/main.txt -r requirements/dev.txt -r requirements/test.txt
        hatch run all
    fi
}

do_react() {
    if ! command -v bun >/dev/null 2>&1; then
        echo "bun is not installed. Please install bun first."
        exit 1
    fi
    bun install
    bun all
}

show_help() {
    echo "Usage: $0 [python|--python|react|--react|all|--all|help|--help|-h]"
    echo
    echo "Options:"
    echo "  python   Set up the Python environment and run python related tasks."
    echo "  react    Set up the React environment and run react related tasks."
    echo "  all      Set up both Python and React environments and run all tasks."
    echo "  help     Show this help message."
}

if [ $# -eq 0 ]; then
    show_help
    exit 0
fi
case "${1}" in
    python|--python)
        do_py
    ;;
    react|--react)
        do_react
    ;;
    all|--all)
        do_react
        do_py
    ;;
    help|--help|-h)
        show_help
        exit 0
    ;;
    *)
        echo "Invalid option: ${1}"
        show_help
        exit 1
    ;;
esac
