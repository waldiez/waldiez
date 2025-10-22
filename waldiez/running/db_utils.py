# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-exception-caught,too-many-try-statements

"""Db / sqlite related utils."""

import csv
import json
import sqlite3

import aiocsv
import aiofiles
import aiosqlite


def get_sqlite_out(db_name: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    db_name : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    try:
        conn = sqlite3.connect(db_name)
    except BaseException:  # pragma: no cover
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except BaseException:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row, strict=True)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


async def a_get_sqlite_out(db_name: str, table: str, csv_file: str) -> None:
    """Convert a sqlite table to csv and json files.

    Parameters
    ----------
    db_name : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    """
    try:
        conn = await aiosqlite.connect(db_name)
    except BaseException:  # pragma: no cover
        return
    query = f"SELECT * FROM {table}"  # nosec
    try:
        async with conn.execute(query) as cursor:
            rows = await cursor.fetchall()
            column_names = [
                description[0] for description in cursor.description
            ]
            data = [dict(zip(column_names, row, strict=True)) for row in rows]
        await conn.close()
    except BaseException:
        try:
            await conn.close()
        except BaseException:  # pragma: no cover
            pass
        return
    async with aiofiles.open(
        csv_file, "w", newline="", encoding="utf-8"
    ) as file:
        csv_writer = aiocsv.AsyncDictWriter(file, fieldnames=column_names)
        await csv_writer.writeheader()
        await csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    async with aiofiles.open(
        json_file, "w", encoding="utf-8", newline="\n"
    ) as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))
