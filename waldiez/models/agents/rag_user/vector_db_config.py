# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501

"""The vector db config for the RAG user agent."""

from pathlib import Path
from typing import Any, Dict, Optional

from pydantic import ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel
from typing_extensions import Annotated, Self

from ...common import WaldiezBase


# pylint: disable=line-too-long
class WaldiezRagUserVectorDbConfig(WaldiezBase):
    """The config for the vector db.

    Attributes
    ----------
    model : str
        The model to use for the vector db embeddings.
    use_memory : bool
        Whether to use memory for the vector db (if `qdrant` is used).
    use_local_storage : bool
        Whether to use local storage for the db (if `qdrant` or `chroma` is used).
    local_storage_path : Optional[str]
        The path to the local storage for the vector db (if `qdrant` or `chroma` is used).
    connection_url : Optional[str]
        The connection url for the vector db.
    wait_until_index_ready : Optional[float]
        Blocking call to wait until the database indexes are ready (if `mongodb` is used).
        None, the default, means no wait.
    wait_until_document_ready : Optional[float]
        Blocking call to wait until the database documents are ready (if `mongodb` is used).
        None, the default, means no wait.
    metadata : Optional[Dict[str, Any]]
        The metadata to use for the vector db.
        Example: {"hnsw:space": "ip", "hnsw:construction_ef": 30, "hnsw:M": 32}

    Functions
    ---------
    validate_vector_db_config()
        Validate the vector db config.
    """

    model_config = ConfigDict(
        extra="ignore",
        alias_generator=to_camel,
        populate_by_name=True,
        frozen=False,
        protected_namespaces=(),  # we use "model" as a field
    )

    model: Annotated[
        Optional[str],
        Field(
            None,
            title="Model",
            description="The model to use for the vector db embeddings.",
        ),
    ]
    use_memory: Annotated[
        bool,
        Field(
            True,
            title="Use Memory",
            description=(
                "Whether to use memory for the vector db (if qdrant is used)."
            ),
        ),
    ]
    use_local_storage: Annotated[
        bool,
        Field(
            False,
            title="Use Local Storage",
            description=(
                "Whether to use local storage for the vector db "
                "(if qdrant or chroma is used)."
            ),
        ),
    ]
    local_storage_path: Annotated[
        Optional[str],
        Field(
            None,
            title="Local Storage Path",
            description=(
                "The path to the local storage for the vector db "
                "(if qdrant is used)."
            ),
        ),
    ]
    connection_url: Annotated[
        Optional[str],
        Field(
            None,
            title="Connection URL",
            description="The connection url for the vector db.",
        ),
    ]
    wait_until_index_ready: Annotated[
        Optional[float],
        Field(
            None,
            title="Wait Until Index Ready",
            description=(
                "The time to wait/block until the database indexes are ready. "
                "None, the default, means no wait."
            ),
        ),
    ]
    wait_until_document_ready: Annotated[
        Optional[float],
        Field(
            None,
            title="Wait Until Document Ready",
            description=(
                "The time to wait/block until the database documents "
                "are ready. None, the default, means no wait."
            ),
        ),
    ]
    metadata: Annotated[
        Optional[Dict[str, Any]],
        Field(
            None,
            title="Metadata",
            description=(
                "The metadata to use for the vector db. Example: "
                '"{"hnsw:space": "ip", '
                '"hnsw:construction_ef": 30, '
                '"hnsw:M": 32}'
            ),
        ),
    ]

    @model_validator(mode="after")
    def validate_vector_db_config(self) -> Self:
        """Validate the vector db config.

        if local storage is used, make sure the path is provided,
        and make it absolute if not already.

        Returns
        -------
        WaldiezRagUserVectorDbConfig
            The vector db config.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if self.use_local_storage:
            if self.local_storage_path is None:
                raise ValueError(
                    "The local storage path must be provided if local storage is used."
                )
            as_path = Path(self.local_storage_path)
            if not as_path.is_absolute():
                self.local_storage_path = str(as_path.resolve())
        return self
