# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""
Check for rpds-py on Windows ARM64.

Since we cannot use direct git dependency on `rpds-py` in `pyproject.toml`,
let's check it here.

NOTE: We should regularly check if this is still needed.
"""
# "rpds-py @ git+https://github.com/crate-py/rpds.git@v0.24.0 ;
# sys_platform == "win32" and platform_machine == "arm64"",
# "rpds-py @ git+https://github.com/crate-py/rpds.git@v0.24.0 ;
# sys_platform == "win32" and platform_machine == "ARM64"",
# "rpds-py @ git+https://github.com/crate-py/rpds.git@v0.24.0 ;
# sys_platform == "win32" and platform_machine == "aarch64"",
# "rpds-py @ git+https://github.com/crate-py/rpds.git@v0.24.0 ;
# sys_platform == "win32" and platform_machine == "AARCH64"",
