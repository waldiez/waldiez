# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Simple wrapper to call "do" in the "scripts" directory."""

import platform
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent.resolve()
SCRIPTS = HERE / "scripts"

if platform.system() == "Windows":
    subprocess.run(  # nosemgrep # nosec
        ["pwsh", str(SCRIPTS / "do.ps1"), *sys.argv[1:]],
        check=True,
    )
else:
    subprocess.run(  # nosemgrep # nosec
        [str(SCRIPTS / "do.sh"), *sys.argv[1:]],
        check=True,
    )
