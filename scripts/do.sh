#!/usr/bin/env sh

set -e

HERE="$(dirname "$(readlink -f "$0")")"
ROOT_DIR="$(dirname "${HERE}")"

cd "${ROOT_DIR}" || exit 1

do_py() {
    if [ ! -d "${ROOT_DIR}/.venv" ]; then
        if command -v uv >/dev/null 2>&1; then
            uv sync
            uv pip install --upgrade pip
        else
            if command -v python3 >/dev/null 2>&1; then
                python3 -m venv .venv
                python3 -m pip install --upgrade pip
            elif command -v python >/dev/null 2>&1; then
                python -m venv .venv
                python -m pip install --upgrade pip
            else
                echo "No suitable Python interpreter found. Please install Python 3."
                exit 1
            fi
        fi
    fi
    # shellcheck disable=SC1091
    . .venv/bin/activate
    PATH="${PATH}:$(pwd)/.venv/bin"
    if ! command -v uv >/dev/null 2>&1; then
        pip install -r requirements/main.txt -r requirements/dev.txt -r requirements/test.txt
    fi
    if command -v make >/dev/null 2>&1; then
        make some
    else
        # fallback to python/python3
        scripts="clean.py format.py lint.py test.py build.py docs.py image.py"
        for script in $scripts; do
            if command -v uv >/dev/null 2>&1; then
                uv run scripts/"$script"
            else
                if command -v python3 >/dev/null 2>&1; then
                    python3 scripts/"$script"
                elif command -v python >/dev/null 2>&1; then
                    python scripts/"$script"
                else
                    echo "No suitable Python interpreter found. Please install Python 3."
                    exit 1
                fi
            fi
        done
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
