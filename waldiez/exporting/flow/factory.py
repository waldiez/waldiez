# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Factory function for creating a FlowExporter instance."""

from pathlib import Path
from typing import Any, Optional

from waldiez.logger import WaldiezLogger
from waldiez.models import Waldiez

from ..core import (
    DefaultPathResolver,
    DefaultSerializer,
    ExportConfig,
    ExporterContext,
)
from .exporter import FlowExporter


def create_flow_exporter(
    waldiez: Waldiez,
    output_dir: Path | None,
    for_notebook: bool,
    context: Optional[ExporterContext] = None,
    **kwargs: Any,
) -> FlowExporter:
    """Create a flow exporter.

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

    Returns
    -------
    ChatsExporter
        The created chats exporter.
    """
    if context is None:
        config = ExportConfig(
            name=waldiez.name,
            description=waldiez.description or "",
            tags=waldiez.tags or [],
            requirements=waldiez.requirements or [],
            output_extension="ipynb" if for_notebook else "py",
            is_async=waldiez.is_async,
            output_directory=output_dir,
            cache_seed=waldiez.cache_seed,
        )
        context = ExporterContext(
            config=config,
            serializer=DefaultSerializer(),
            path_resolver=DefaultPathResolver(),
            logger=WaldiezLogger(),
        )
    else:
        if not context.config:
            context.config = ExportConfig(
                name=waldiez.name,
                description=waldiez.description or "",
                tags=waldiez.tags or [],
                requirements=waldiez.requirements or [],
                output_extension="ipynb" if for_notebook else "py",
                is_async=waldiez.is_async,
                output_directory=output_dir,
                cache_seed=waldiez.cache_seed,
            )
        else:
            context.config.update(
                name=waldiez.name,
                description=waldiez.description or "",
                tags=waldiez.tags or [],
                requirements=waldiez.requirements or [],
                output_extension="ipynb" if for_notebook else "py",
                is_async=waldiez.is_async,
                output_directory=output_dir,
                cache_seed=waldiez.cache_seed,
            )

    return FlowExporter(
        waldiez=waldiez,
        output_dir=output_dir,
        for_notebook=for_notebook,
        context=context,
        **kwargs,
    )
