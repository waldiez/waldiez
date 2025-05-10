#!/usr/bin/env pwsh
# Requires PowerShell 7+

param(
    [string]$Option
)

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "This script requires PowerShell 7 or later."
    exit 1
}

$HERE = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$ROOT_DIR = Split-Path -Parent -Path $HERE

$requirementsFiles = @(
    (Join-Path -Path $ROOT_DIR -ChildPath "requirements" -AdditionalChildPath "main.txt"),
    (Join-Path -Path $ROOT_DIR -ChildPath "requirements" -AdditionalChildPath "dev.txt"),
    (Join-Path -Path $ROOT_DIR -ChildPath "requirements" -AdditionalChildPath "test.txt")
)

Set-Location -Path $ROOT_DIR

function Update-Pip {
    if (Get-Command python3 -ErrorAction SilentlyContinue) {
        python3 -m pip install --upgrade pip
    }
    elseif (Get-Command python -ErrorAction SilentlyContinue) {
        python -m pip install --upgrade pip
    }
    else {
        Write-Error "No suitable Python interpreter found. Please install Python 3."
        exit 1
    }
}

function New-Venv {
    if (Get-Command python3 -ErrorAction SilentlyContinue) {
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

function Invoke-Py {
    if (-not $env:HATCH_ENV_ACTIVE) {
        if (-not (Test-Path "$ROOT_DIR/.venv")) {
            if (Get-Command uv -ErrorAction SilentlyContinue) {
                uv sync
                uv pip install --upgrade pip
            }
            else {
                New-Venv
            }
        }

        $activateScript = if ($IsWindows) {
            Join-Path -Path $ROOT_DIR -ChildPath ".venv" -AdditionalChildPath "Scripts", "Activate.ps1"
        }
        else {
            Join-Path -Path $ROOT_DIR -ChildPath ".venv" -AdditionalChildPath "bin", "activate.ps1"
        }

        if (Test-Path $activateScript) {
            . $activateScript
        }
        else {
            Write-Error "Activation script not found at $activateScript"
            exit 1
        }
        $env:PATH = "$ROOT_DIR/.venv/Scripts;$env:PATH"

        Update-Pip
        Write-Host "Installing requirements..." -ForegroundColor Cyan
        pip install -r $requirementsFiles[0] -r $requirementsFiles[1] -r $requirementsFiles[2]
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install requirements"
            exit 1
        }
    }
    else {
        if (-not (Get-Command hatch -ErrorAction SilentlyContinue)) {
            Write-Error "HATCH_ENV_ACTIVE is set, but 'hatch' is not installed or not in PATH."
            exit 1
        }
        Update-Pip
        Write-Host "Installing requirements..." -ForegroundColor Cyan
        pip install -r $requirementsFiles[0] -r $requirementsFiles[1] -r $requirementsFiles[2]
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install requirements"
            exit 1
        }
    }

    if (Get-Command make -ErrorAction SilentlyContinue) {
        make some
    }
    else {
        $pythonCmd = if ($env:HATCH_ENV_ACTIVE) {
            if (Get-Command hatch -ErrorAction SilentlyContinue) {
                if (Get-Command python3 -ErrorAction SilentlyContinue) {
                    "python3"
                }
                elseif (Get-Command python -ErrorAction SilentlyContinue) {
                    "python"
                }
                else {
                    Write-Error "No suitable Python interpreter found. Please install Python 3."
                    exit 1
                }
            }
            else {
                Write-Error "HATCH_ENV_ACTIVE is set but 'hatch' is not available."
                exit 1
            }
        }
        elseif (Get-Command uv -ErrorAction SilentlyContinue) {
            "uv run"
        }
        elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
            "python3"
        }
        elseif (Get-Command python -ErrorAction SilentlyContinue) {
            "python"
        }
        else {
            Write-Error "No suitable Python interpreter found. Please install Python 3."
            exit 1
        }
        $scripts = @("clean.py", "format.py", "lint.py", "test.py", "build.py", "docs.py", "image.py")
        foreach ($script in $scripts) {
            $scriptPath = Join-Path -Path $ROOT_DIR -ChildPath "scripts" -AdditionalChildPath $script
            if ($pythonCmd -eq "uv run") {
                & uv run $scriptPath
            }
            else {
                & $pythonCmd $scriptPath
            }
        }
    }
}

function Invoke-React {
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
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
