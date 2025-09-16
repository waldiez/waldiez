# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Actions to perform before running the flow."""

import sys
from typing import Callable

from waldiez.models import Waldiez
from waldiez.utils.python_manager import PythonManager

from .environment import refresh_environment


class RequirementsMixin:
    """Mixin class to handle requirements installation."""

    _waldiez: Waldiez
    _called_install_requirements: bool
    _print: Callable[..., None]

    def __init__(self) -> None:
        """Initialize the instance."""
        self._python_manager = PythonManager()

    def gather_requirements(self) -> set[str]:
        """Gather extra requirements to install before running the flow.

        Returns
        -------
        set[str]
            A set of requirements that are not already installed and do not
            include 'waldiez' in their name.
        """
        extra_requirements = {
            req
            for req in self._waldiez.requirements
            if req not in sys.modules and "waldiez" not in req
        }
        if "python-dotenv" not in extra_requirements:  # pragma: no branch
            extra_requirements.add("python-dotenv")
        return extra_requirements

    def install_requirements(self) -> None:
        """Install the requirements for the flow."""
        if not self._called_install_requirements:  # pragma: no branch
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:  # pragma: no branch
                self._python_manager.pip_install(
                    extra_requirements, printer=self._print
                )
            refresh_environment()

    async def a_install_requirements(self) -> None:
        """Install the requirements for the flow asynchronously."""
        if not self._called_install_requirements:  # pragma: no branch
            self._called_install_requirements = True
            extra_requirements = self.gather_requirements()
            if extra_requirements:  # pragma: no branch
                await self._python_manager.a_pip_install(
                    extra_requirements, printer=self._print
                )
            refresh_environment()
