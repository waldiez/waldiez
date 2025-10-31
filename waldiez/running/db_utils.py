# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-complex

"""Db / sqlite related utils."""

import csv
import json
import sqlite3

import aiofiles
import aiosqlite
from aiocsv import AsyncDictWriter


# noinspection PyBroadException,SqlNoDataSourceInspection
def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        conn = sqlite3.connect(dbname)
    except BaseException:  # pragma: no cover
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:  # pragma: no cover
        conn.close()
        return
    try:
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        cursor.close()
        conn.close()
    except BaseException:  # pragma: no cover
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass
        return
    try:
        with open(csv_file, "w", newline="", encoding="utf-8") as file:
            csv_writer = csv.DictWriter(file, fieldnames=column_names)
            csv_writer.writeheader()
            csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        with open(json_file, "w", encoding="utf-8", newline="\n") as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    except BaseException:  # pragma: no cover
        return


# noinspection PyBroadException,SqlNoDataSourceInspection
async def a_get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    # pylint: disable=broad-exception-caught,too-many-try-statements
    try:
        conn = await aiosqlite.connect(dbname)
    except BaseException:
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = await conn.execute(query)
    except BaseException:  # pragma: no cover
        await conn.close()
        return
    try:
        rows = await cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        await cursor.close()
        await conn.close()
    except BaseException:  # pragma: no cover
        try:
            await cursor.close()
            await conn.close()
        except BaseException:
            pass
        return
    try:
        async with aiofiles.open(
            csv_file, "w", newline="", encoding="utf-8"
        ) as file:
            csv_writer = AsyncDictWriter(file, fieldnames=column_names)
            await csv_writer.writeheader()
            await csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        async with aiofiles.open(
            json_file, "w", encoding="utf-8", newline="\n"
        ) as file:
            await file.write(json.dumps(data, indent=4, ensure_ascii=False))
    except BaseException:  # pragma: no cover
        return
