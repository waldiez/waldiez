#!/usr/bin/env pwsh
# Requires PowerShell 7+

param(
    [string]$Option
)

$HERE = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$ROOT_DIR = Split-Path -Parent -Path $HERE

Set-Location -Path $ROOT_DIR

function Invoke-Py {
    if (-Not (Test-Path "$ROOT_DIR/.venv")) {
        if (Get-Command uv -ErrorAction SilentlyContinue) {
            uv sync
            uv pip install --upgrade pip
        }
        elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
            python3 -m venv .venv
        }
        elseif (Get-Command python -ErrorAction SilentlyContinue) {
            python -m venv .venv
        }
        else {
            Write-Error "No suitable Python interpreter found. Please install Python 3."
            exit 1
        }
    }

    # Activate the virtual environment
    .\.venv\Scripts\Activate
    $env:PATH = "$env:PATH;$(Get-Location)/.venv/Scripts"
    if (-Not (Get-Command uv -ErrorAction SilentlyContinue)) {
        pip install --upgrade pip
        pip install -r requirements/main.txt,requirements/dev.txt,requirements/test.txt
    }

    if (Get-Command make -ErrorAction SilentlyContinue) {
        make some
    }
    else {
        $scripts = @("clean.py", "format.py", "lint.py", "test.py", "build.py", "docs.py", "image.py")
        foreach ($script in $scripts) {
            if (Get-Command uv -ErrorAction SilentlyContinue) {
                uv run "scripts/$script"
            }
            elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
                python3 "scripts/$script"
            }
            elseif (Get-Command python -ErrorAction SilentlyContinue) {
                python "scripts/$script"
            }
            else {
                Write-Error "No suitable Python interpreter found. Please install Python 3."
                exit 1
            }
        }
    }
}

function Invoke-React {
    if (-Not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Error "bun is not installed. Please install bun first."
        exit 1
    }
    bun install
    bun all
}

function Show-Help {
    Write-Output "Usage: script.ps1 [python|--python|react|--react|all|--all|help|--help|-h]"
    Write-Output ""
    Write-Output "Options:"
    Write-Output "  python   Set up the Python environment and run python related tasks."
    Write-Output "  react    Set up the React environment and run react related tasks."
    Write-Output "  all      Set up both Python and React environments and run all tasks."
    Write-Output "  help     Show this help message."
}

if (-not $Option) {
    Show-Help
    exit 0
}

switch ($Option) {
    "python" { Invoke-Py }
    "--python" { Invoke-Py }
    "react" { Invoke-React }
    "--react" { Invoke-React }
    "all" { Invoke-React; Invoke-Py }
    "--all" { Invoke-React; Invoke-Py }
    "help" { Show-Help; exit 0 }
    "--help" { Show-Help; exit 0 }
    "-h" { Show-Help; exit 0 }
    default {
        Write-Error "Invalid option: $Option"
        Show-Help
        exit 1
    }
}
