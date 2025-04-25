# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Base class to inherit from."""

from typing import Any, Dict

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class WaldiezBase(BaseModel):
    """Base model class to inherit from.

    It contains the default configuration for all models.
    It also `model_dumps` by alias by default.
    """

    model_config = ConfigDict(
        extra="ignore",
        # treat `skillId` as `skill_id`
        alias_generator=to_camel,
        # allow passing either `skill_id` or `skillId`
        populate_by_name=True,
        # allow setting any attribute after initialization
        frozen=False,
    )

    def model_dump(self, **kwargs: Any) -> Dict[str, Any]:
        """Dump the model to a dictionary.

        Parameters
        ----------
        **kwargs : Any
            Additional keyword arguments.

        Returns
        -------
        Dict[str, Any]
            The dictionary representation of the model.
        """
        by_alias = kwargs.pop("by_alias", None)
        if by_alias is None:
            by_alias = True
        if not isinstance(by_alias, bool):
            by_alias = True
        return super().model_dump(by_alias=by_alias, **kwargs)

    def model_dump_json(self, **kwargs: Any) -> str:
        """Dump the model to a JSON string.

        Parameters
        ----------
        **kwargs : Any
            Additional keyword arguments.

        Returns
        -------
        str
            The JSON string.
        """
        by_alias = kwargs.pop("by_alias", None)
        if by_alias is None:
            by_alias = True
        if not isinstance(by_alias, bool):
            by_alias = True
        return super().model_dump_json(by_alias=by_alias, **kwargs)

    def __hash__(self) -> int:  # pragma: no cover
        """Return the hash of the object."""
        return id(self)
