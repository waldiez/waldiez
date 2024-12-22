# Get the absolute path to the script's directory
$HERE = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Default path
$defaultPath = Join-Path $HERE ".venv\Scripts\python.exe"
$venvPath = Join-Path $HERE ".venv"

# Path to the .env file
$envFile = Join-Path $HERE ".env"

# Function to test Python version
function Test-PythonVersion {
    param (
        [string]$pythonExec
    )
    try {
        $version = & $pythonExec --version 2>&1 | ForEach-Object { ($_ -split " ")[1] }
        if ($version -match "^3\.(10|11|12)\.") {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

# Ensure .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..."
    Set-Content -Path $envFile -Value "PYTHON_INTERPRETER_PATH=$defaultPath`n" -Encoding utf8
}

# Load .env file
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^PYTHON_INTERPRETER_PATH=(.+)$") {
        $env:PYTHON_INTERPRETER_PATH = $matches[1]
    }
}

# Set PYTHON_INTERPRETER_PATH if not already set
if (-not $env:PYTHON_INTERPRETER_PATH) {
    Write-Host "PYTHON_INTERPRETER_PATH is not set. Setting it to default..."
    $env:PYTHON_INTERPRETER_PATH = $defaultPath
    Add-Content $envFile "PYTHON_INTERPRETER_PATH=$defaultPath"
}

if (-not (Test-Path -Path $PYTHON_INTERPRETER_PATH)) {
    # Check if it matches any path ending with /bin/python
    if ($PYTHON_INTERPRETER_PATH -match "/bin/python$") {
        $PYTHON_INTERPRETER_PATH = $DEFAULT_PATH
        $env:PYTHON_INTERPRETER_PATH = $PYTHON_INTERPRETER_PATH

        # Replace if it is in the .env file
        if (Test-Path -Path $ENV_FILE) {
            $envContent = Get-Content -Path $ENV_FILE
            $updatedContent = $envContent -replace "PYTHON_INTERPRETER_PATH=.*", "PYTHON_INTERPRETER_PATH=$DEFAULT_PATH"

            Set-Content -Path $ENV_FILE -Value $updatedContent
        }
    }
}
# Check Python version
$pythonExec = "python"
if (Test-PythonVersion $env:PYTHON_INTERPRETER_PATH) {
    $pythonExec = $env:PYTHON_INTERPRETER_PATH
} else {
    foreach ($version in 10, 11, 12) {
        if (Test-PythonVersion "python3.$version") {
            $pythonExec = "python3.$version"
            break
        }
    }
    if (-not $pythonExec) {
        # last check using python3
        if (Test-PythonVersion "python3") {
            $pythonExec = "python3"
        }
    }
}

if (-not $pythonExec) {
    Write-Host "No suitable Python version found. Please install Python >= 3.10 and < 3.13."
    exit 1
}

# Ensure the virtual environment exists and is valid
if (-not (Test-Path $venvPath) -or -not (Test-Path $defaultPath)) {
    Write-Host "Virtual environment not found or invalid. Creating one..."
    try {
        & $pythonExec -m venv $venvPath
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create virtual environment."
        }
        Write-Host "Virtual environment created successfully at $venvPath"
    } catch {
        Write-Host "Failed to create virtual environment. Ensure Python >= 3.10 and < 3.13 is installed."
        exit 1
    }
} else {
    # Validate the Python executable inside the virtual environment
    $isValidVenv = & $defaultPath -c "import sys; print(hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)" 2>&1
    if ($isValidVenv -ne "True") {
        Write-Host "Existing virtual environment is invalid. Recreating..."
        Remove-Item -Recurse -Force $venvPath
        try {
            & $pythonExec -m venv $venvPath
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to recreate virtual environment."
            }
            Write-Host "Virtual environment recreated successfully at $venvPath"
        } catch {
            Write-Host "Failed to recreate virtual environment. Ensure Python >= 3.10 and < 3.13 is installed."
            exit 1
        }
    }
}
# Activate the virtual environment
Write-Host "Activating the virtual environment..."
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"

if (Test-Path $activateScript) {
    & $activateScript
    Write-Host "Virtual environment activated. You are now using the environment: $(Get-Command python)."
} else {
    Write-Host "Failed to find the activation script at $activateScript."
    exit 1
}
# Update pip and sync packages
Write-Host "Updating pip..."
try {
     & $defaultPath -m pip install --upgrade uv pip
     if ($LASTEXITCODE -ne 0) {
         throw "Failed to update pip."
     }
     Write-Host "pip successfully updated."
} catch {
     Write-Host "Failed to update pip. Please check your Python installation."
     exit 1
}
Write-Host "Python Interpreter Path: $env:PYTHON_INTERPRETER_PATH"
Write-Host "You can call 'bun requirements' to install the requirements"
Write-Host "And 'uv sync --all-packages' to sync the packages (and check for conflicts)"
