#!/usr/bin/env sh


if ! command -v uname >/dev/null 2>&1; then
    echo "Command 'uname' not found. Is this script running in a Unix-like environment?"
    exit 1
fi

set -e

HERE="$(dirname "$(readlink -f "$0")")"
SCRIPTS_DIR="${HERE}/scripts"

OS="$(uname | tr '[:upper:]' '[:lower:]')"

if echo "$OS" | grep -qE 'mingw|msys|cygwin'; then
    # Windows detected
    if command -v pwsh >/dev/null 2>&1; then
        pwsh "${SCRIPTS_DIR}/do.ps1" "$@"
    elif command -v powershell >/dev/null 2>&1; then
        powershell -ExecutionPolicy Bypass -File "${SCRIPTS_DIR}/do.ps1" "$@"
    else
        echo "PowerShell not found. Please install PowerShell 7 or higher."
        exit 1
    fi
elif [ "$OS" = "linux" ] || [ "$OS" = "darwin" ]; then
    bash "${SCRIPTS_DIR}/do.sh" "$@"
else
    echo "Unsupported OS: $OS"
    exit 1
fi
