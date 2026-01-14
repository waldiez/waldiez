# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Base class to inherit from."""

from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class WaldiezBase(BaseModel):
    """Base model class to inherit from.

    It contains the default configuration for all models.
    It also `model_dumps` by alias by default.
    """

    model_config = ConfigDict(
        extra="ignore",
        # treat `toolId` as `tool_id`
        alias_generator=to_camel,
        # allow passing either `tool_id` or `toolId`
        populate_by_name=True,
        # allow setting any attribute after initialization
        frozen=False,
        json_schema_serialization_defaults_required=False,
    )

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:
        """Dump the model to a dictionary.

        Parameters
        ----------
        **kwargs : Any
            Additional keyword arguments.

            The following are from the Pydantic `model_dump` method:
              - mode: str | Literal['json', 'python'] = 'json',
              - include: IncEx | None
              - exclude: IncEx | None
              - context: Any | None
              - by_alias: bool | None (None defaults to True)
              - exclude_unset: bool = False
              - exclude_defaults: bool = False
              - exclude_none: bool = False
              - round_trip: bool = False
              - warnings: bool | Literal['none', 'warn', 'error'] = True
              - fallback: ((Any) -> Any) | None = None
              - serialize_as_any: bool = False

        Returns
        -------
        dict[str, Any]
            The dictionary representation of the model.
        """
        by_alias = kwargs.pop("by_alias", None)
        mode = kwargs.pop("mode", None)
        if mode is None:  # pragma: no branch
            mode = "json"
        if by_alias is None:  # pragma: no branch
            by_alias = True
        # noinspection PyUnreachableCode
        if not isinstance(by_alias, bool):
            by_alias = True
        return super().model_dump(by_alias=by_alias, mode=mode, **kwargs)

    def model_dump_json(self, **kwargs: Any) -> str:
        """Dump the model to a JSON string.

        Parameters
        ----------
        **kwargs : Any
            Additional keyword arguments.

            The following are from the Pydantic `model_dump_json` method:
            - indent: int | None = None,
            - include: IncEx | None = None,
            - exclude: IncEx | None = None,
            - context: Any | None = None,
            - by_alias: bool | None = None, (None defaults to True)
            - exclude_unset: bool = False,
            - exclude_defaults: bool = False,
            - exclude_none: bool = False,
            - round_trip: bool = False,
            - warnings: bool | Literal['none', 'warn', 'error'] = True,
            - fallback: ((Any) -> Any) | None = None,
            - serialize_as_any: bool = False

        Returns
        -------
        str
            The JSON string.
        """
        by_alias = kwargs.pop("by_alias", None)
        if by_alias is None:
            by_alias = True
        # noinspection PyUnreachableCode
        if not isinstance(by_alias, bool):
            by_alias = True
        return super().model_dump_json(by_alias=by_alias, **kwargs)

    def __hash__(self) -> int:  # pragma: no cover
        """Return the hash of the object."""
        return id(self)
