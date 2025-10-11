# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Flow exporter."""

from pathlib import Path
from typing import Any

from waldiez.models import Waldiez

from ..core import Exporter, ExporterContext
from ..core.extras import FlowExtras
from .file_generator import FileGenerator
from .orchestrator import ExportOrchestrator


class FlowExporter(Exporter[FlowExtras]):
    """Flow exporter."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_dir: Path | None,
        for_notebook: bool,
        context: ExporterContext | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the chats exporter.

        Parameters
        ----------
        waldiez : Waldiez
            The Waldiez instance containing the flow data.
        output_dir : Path
            The directory where the exported flow will be saved.
        for_notebook : bool
            Whether the export is intended for a notebook environment.
        context : Optional[ExporterContext], optional
            Exporter context with dependencies, by default None
        **kwargs : Any
            Additional keyword arguments for the exporter.
        """
        super().__init__(context, **kwargs)

        self.waldiez = waldiez
        self.output_dir = Path(output_dir) if output_dir is not None else None
        self.flow_config = self.context.get_config(
            name=waldiez.name,
            description=waldiez.description,
            requirements=waldiez.requirements or [],
            tags=waldiez.tags or [],
            output_extension="ipynb" if for_notebook else "py",
            is_async=waldiez.is_async,
            output_directory=str(self.output_dir) if self.output_dir else None,
            cache_seed=waldiez.cache_seed,
        )
        self._extras = self._generate_extras()

    @property
    def extras(self) -> FlowExtras:
        """Get the flow exporter extras.

        Returns
        -------
        dict[str, Any]
            The extras dictionary containing additional
            information for the flow exporter.
        """
        return self._extras

    def _generate_extras(self) -> FlowExtras:
        """Generate the extras for the flow exporter.

        Returns
        -------
        BaseExtras
            An instance of BaseExtras containing the generated content.
        """
        extras = FlowExtras(
            instance_id=self.waldiez.id,
            flow_name=self.waldiez.name,
            description=self.waldiez.description or "",
            config=self.flow_config,
        )
        return extras

    def generate_main_content(self) -> str:
        """Generate the main content of the export.

        Returns
        -------
        str
            The final executable script or notebook content.
        """
        orchestrator = ExportOrchestrator(
            waldiez=self.waldiez,
            context=self.context,
        )
        merged_result = orchestrator.orchestrate()
        after_run = orchestrator.get_after_run_content()
        generator = FileGenerator(
            context=self.context,
        )
        return generator.generate(
            merged_result=merged_result,
            is_async=self.waldiez.is_async,
            after_run=after_run,
            skip_logging=orchestrator.should_skip_logging(),
        )
