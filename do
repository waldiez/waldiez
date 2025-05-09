#!/usr/bin/env sh
# Cross-platform entry point for development setup

set -eu

if ! command -v uname >/dev/null 2>&1; then
    echo "Command 'uname' not found. Is this script running in a Unix-like environment?"
    exit 1
fi

if [ "$#" -eq 0 ]; then
    echo "Usage: $(basename "$0") [python|react|all|help]"
    echo "Run './$(basename "$0") help' for more information."
    exit 0
fi

if [ "$(uname)" = "Darwin" ]; then
    # macOS might not support readlink -f
    HERE="$(cd "$(dirname "$0")" && pwd)"
else
    HERE="$(dirname "$(readlink -f "$0")")"
fi
SCRIPTS_DIR="${HERE}/scripts"

OS="$(uname | tr '[:upper:]' '[:lower:]')"

if echo "$OS" | grep -qE 'mingw|msys|cygwin'; then
    # Windows detected
    if [ ! -f "${SCRIPTS_DIR}/do.ps1" ]; then
        echo "Script not found: ${SCRIPTS_DIR}/do.ps1"
        exit 1
    fi
    if command -v pwsh >/dev/null 2>&1; then
        echo "Running PowerShell script..."
        pwsh "${SCRIPTS_DIR}/do.ps1" "$@"
    else
        if command -v powershell >/dev/null 2>&1; then
            echo "Running PowerShell script..."
            powershell -ExecutionPolicy Bypass -File "${SCRIPTS_DIR}/do.ps1" "$@"
        else
            echo "PowerShell not found. Please install PowerShell 7 or higher."
            exit 1
        fi
    fi
else
    if [ "$OS" = "linux" ] || [ "$OS" = "darwin" ]; then
        if [ -f "${SCRIPTS_DIR}/do.sh" ]; then
            echo "Running shell script..."
            _SHELL="${SHELL:-/bin/bash}"
            $_SHELL "${SCRIPTS_DIR}/do.sh" "$@"
        else
            echo "Script not found: ${SCRIPTS_DIR}/do.sh"
            exit 1
        fi
    else
        echo "Unsupported OS: $OS"
        exit 1
    fi
fi
