# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=too-few-public-methods
"""Remote agent extras."""

from dataclasses import dataclass

from waldiez.exporting.core.result import ExportResult

from .standard_extras import StandardExtras


@dataclass
class RemoteExtras(StandardExtras):
    """Extras for remote agents."""

    server_content: str = ""
    client_content: str = ""

    def _contribute_specific_content(self, result: ExportResult) -> None:
        """Contribute reasoning specific content to the export result.

        Parameters
        ----------
        result : ExportResult
            The export result to contribute to.
        """
        super()._contribute_specific_content(result)
        td = (
            "TODO: check server and client content \n"
            "TODO: we also need to check (detect) if we should "
            "use multiple remote agents in one common server app:\n"
            "one server multiple endpoints, one for each agent that "
            "has common server configs"
        )
        print(td)

    def has_specific_content(self) -> bool:
        """Check for remote-agent specific content.

        Returns
        -------
        bool
            True if there's remote agent's specific content.
        """
        if not super().has_specific_content():
            return bool(
                self.extra_args
                or self.extra_imports
                or self.before_agent.strip()
                or self.after_agent.strip()
                or self.server_content.strip()
                or self.client_content.strip()
            )
        return True
