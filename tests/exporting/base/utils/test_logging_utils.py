# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=inconsistent-quotes, line-too-long
# flake8: noqa: E501
"""Test waldiez.exporting.flow.utils.logging_utils.*."""

from waldiez.exporting.flow.utils.logging_utils import (
    get_async_sqlite_out,
    get_sqlite_out,
    get_start_logging,
    get_stop_logging,
    get_sync_sqlite_out,
)

EXPECTED_ASYNC = """

async def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    \"\"\"Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    \"\"\"
    conn = await aiosqlite.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = await conn.execute(query)
    except BaseException:  # pylint: disable=broad-except
        await conn.close()
        return
    rows = await cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    await cursor.close()
    await conn.close()
    async with aiofiles.open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = AsyncDictWriter(file, fieldnames=column_names, dialect="unix")
        await csv_writer.writeheader()
        await csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    async with aiofiles.open(json_file, "w", encoding="utf-8") as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))


"""


EXPECTED_SYNC = """

def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:
    \"\"\"Convert a sqlite table to csv and json files.

    Parameters
    ----------
    dbname : str
        The sqlite database name.
    table : str
        The table name.
    csv_file : str
        The csv file name.
    \"\"\"
    conn = sqlite3.connect(dbname)
    query = f"SELECT * FROM {table}"  # nosec
    try:
        cursor = conn.execute(query)
    except sqlite3.OperationalError:
        conn.close()
        return
    rows = cursor.fetchall()
    column_names = [description[0] for description in cursor.description]
    data = [dict(zip(column_names, row)) for row in rows]
    conn.close()
    with open(csv_file, "w", newline="", encoding="utf-8") as file:
        csv_writer = csv.DictWriter(file, fieldnames=column_names)
        csv_writer.writeheader()
        csv_writer.writerows(data)
    json_file = csv_file.replace(".csv", ".json")
    with open(json_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)


"""


def test_get_async_sqlite_out() -> None:
    """Test get_async_sqlite_out."""
    assert get_async_sqlite_out() == EXPECTED_ASYNC


def test_get_sync_sqlite_out() -> None:
    """Test get_sync_sqlite_out."""
    assert get_sync_sqlite_out() == EXPECTED_SYNC


def test_get_sqlite_out() -> None:
    """Test get_sqlite_out."""
    assert get_sqlite_out(True) == EXPECTED_ASYNC
    assert get_sqlite_out(False) == EXPECTED_SYNC


def test_get_start_logging() -> None:
    """Test get_start_logging."""
    expected = """
def start_logging() -> None:
    \"\"\"Start logging.\"\"\"
    runtime_logging.start(
        logger_type="sqlite",
        config={"dbname": "flow.db"},
    )
"""
    assert get_start_logging(False, 0) == expected


def test_get_start_logging_async() -> None:
    """Test get_start_logging with async."""
    expected = """
def start_logging() -> None:
    \"\"\"Start logging.\"\"\"
    # pylint: disable=import-outside-toplevel
    from anyio.from_thread import start_blocking_portal

    with start_blocking_portal(backend="asyncio") as portal:
        portal.call(
            runtime_logging.start,
            None,
            "sqlite",
            {"dbname": "flow.db"},
        )
"""
    assert get_start_logging(True, 0) == expected


def test_get_stop_logging() -> None:
    """Test get_stop_logging."""
    sync_expected = """
def stop_logging() -> None:
    \"\"\"Stop logging.\"\"\"
    runtime_logging.stop()
    if not os.path.exists("logs"):
        os.makedirs("logs")
    for table in [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]:
        dest = os.path.join("logs", f"{table}.csv")
        get_sqlite_out("flow.db", table, dest)
"""
    async_expected = """
async def stop_logging() -> None:
    \"\"\"Stop logging.\"\"\"
    # pylint: disable=import-outside-toplevel
    from asyncer import asyncify

    await asyncify(runtime_logging.stop)()
    if not os.path.exists("logs"):
        os.makedirs("logs")
    for table in [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]:
        dest = os.path.join("logs", f"{table}.csv")
        await get_sqlite_out("flow.db", table, dest)
"""
    assert get_stop_logging(0, False) == sync_expected
    assert get_stop_logging(0, True) == async_expected
