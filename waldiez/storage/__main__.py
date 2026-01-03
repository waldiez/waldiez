# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Storage module entrypoint."""

import sys  # pragma: no cover
from pathlib import Path  # pragma: no cover

try:  # pragma: no cover
    from .cli import app
except ImportError:  # pragma: no cover
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from waldiez.storage.cli import app

if __name__ == "__main__":
    app()
