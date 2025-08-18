# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Logging related string generation functions.

Functions
---------
get_logging_start_string
    Get the string to start logging.
get_logging_stop_string
    Get the string to stop logging.
get_sqlite_to_csv_string
    Get the sqlite to csv conversion code string.
get_sqlite_to_csv_call_string
    Get the string to call the sqlite to csv conversion.
"""

from ...core import get_comment


def get_start_logging(is_async: bool, for_notebook: bool) -> str:
    r"""Get the logging start call string.

    Parameters
    ----------
    is_async : bool
        Whether to use async mode.
    for_notebook : bool
        Whether the logging is for a notebook or a script.

    Returns
    -------
    str
        The logging start string.

    Example
    -------
    ```python
    >>> get_start_logging()
    def start_logging() -> None:
        \"\"\"Start logging.\"\"\"
        runtime_logging.start(
            logger_type="sqlite",
            config={"dbname": "flow.db"},
        )
    """
    tab = ""
    comment = get_comment(
        "Start logging.",
        for_notebook=for_notebook,
    )
    if not is_async:
        return f'''
{tab}{comment}
{tab}def start_logging() -> None:
{tab}    """Start logging."""
{tab}    runtime_logging.start(
{tab}        logger_type="sqlite",
{tab}        config={{"dbname": "flow.db"}},
{tab}    )
{tab}
{tab}
{tab}start_logging()
'''
    return f'''
{tab}{comment}
{tab}def start_logging() -> None:
{tab}    """Start logging."""
{tab}    # pylint: disable=import-outside-toplevel
{tab}    from anyio.from_thread import start_blocking_portal

{tab}    with start_blocking_portal(backend="asyncio") as portal:
{tab}        portal.call(
{tab}            runtime_logging.start,
{tab}            None,
{tab}            "sqlite",
{tab}            {{"dbname": "flow.db"}},
{tab}        )
{tab}
{tab}
{tab}start_logging()
'''


# pylint: disable=differing-param-doc,differing-type-doc
# noinspection PyUnresolvedReferences
def get_sync_sqlite_out() -> str:
    r"""Get the sqlite to csv and json conversion code string.

    Returns
    -------
    str
        The sqlite to csv and json conversion code string.

    Example
    -------
    ```python
    >>> get_sqlite_outputs()
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
        cursor = conn.execute(query)
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        conn.close()
        with open(csv_file, "w", newline="", encoding="utf-8") as file:
            csv_writer = csv.DictWriter(file, fieldnames=column_names)
            csv_writer.writeheader()
            csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        with open(json_file, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    ```
    """
    content = "\n\n"
    content += (
        "def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:\n"
    )
    content += '    """Convert a sqlite table to csv and json files.\n\n'
    content += "    Parameters\n"
    content += "    ----------\n"
    content += "    dbname : str\n"
    content += "        The sqlite database name.\n"
    content += "    table : str\n"
    content += "        The table name.\n"
    content += "    csv_file : str\n"
    content += "        The csv file name.\n"
    content += '    """\n'
    content += "    conn = sqlite3.connect(dbname)\n"
    content += '    query = f"SELECT * FROM {table}"  # nosec\n'
    content += "    try:\n"
    content += "        cursor = conn.execute(query)\n"
    content += "    except sqlite3.OperationalError:\n"
    content += "        conn.close()\n"
    content += "        return\n"
    content += "    rows = cursor.fetchall()\n"
    content += "    column_names = [description[0] for description "
    content += "in cursor.description]\n"
    # pylint: disable=line-too-long
    content += "    data = [dict(zip(column_names, row, strict=True)) for row in rows]\n"
    content += "    conn.close()\n"
    content += (
        '    with open(csv_file, "w", newline="", encoding="utf-8") as file:\n'
    )
    content += (
        "        csv_writer = csv.DictWriter(file, fieldnames=column_names)\n"
    )
    content += "        csv_writer.writeheader()\n"
    content += "        csv_writer.writerows(data)\n"
    content += '    json_file = csv_file.replace(".csv", ".json")\n'
    content += '    with open(json_file, "w", encoding="utf-8") as file:\n'
    content += "        json.dump(data, file, indent=4, ensure_ascii=False)\n"
    content += "\n"
    return content


# pylint: disable=differing-param-doc,differing-type-doc,line-too-long
# noinspection PyUnresolvedReferences
def get_async_sqlite_out() -> str:
    r"""Get the sqlite to csv and json conversion code string.

    Returns
    -------
    str
        The sqlite to csv and json conversion code string.

    Example
    -------
    ```python
    >>> get_sqlite_outputs()
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
        except BaseException:  # pylint: disable=broad-exception-caught
            await conn.close()
            return
        rows = await cursor.fetchall()
        column_names = [description[0] for description in cursor.description]
        data = [dict(zip(column_names, row, strict=True)) for row in rows]
        await cursor.close()
        await conn.close()
        async with aiofiles.open(csv_file, "w", newline="", encoding="utf-8") as file:
            csv_writer = csv.DictWriter(file, fieldnames=column_names)
            csv_writer.writeheader()
            csv_writer.writerows(data)
        json_file = csv_file.replace(".csv", ".json")
        async with aiofiles.open(json_file, "w", encoding="utf-8") as file:
            await file.write(json.dumps(data, indent=4, ensure_ascii=False)
    ```
    """
    # fmt: off
    content = "\n\n"
    content += "async def get_sqlite_out(dbname: str, table: str, csv_file: str) -> None:\n"
    content += '    """Convert a sqlite table to csv and json files.\n\n'
    content += "    Parameters\n"
    content += "    ----------\n"
    content += "    dbname : str\n"
    content += "        The sqlite database name.\n"
    content += "    table : str\n"
    content += "        The table name.\n"
    content += "    csv_file : str\n"
    content += "        The csv file name.\n"
    content += '    """\n'
    content += "    conn = await aiosqlite.connect(dbname)\n"
    content += '    query = f"SELECT * FROM {table}"  # nosec\n'
    content += "    try:\n"
    content += "        cursor = await conn.execute(query)\n"
    content += "    except BaseException:  # pylint: disable=broad-exception-caught\n"
    content += "        await conn.close()\n"
    content += "        return\n"
    content += "    rows = await cursor.fetchall()\n"
    content += "    column_names = [description[0] for description "
    content += "in cursor.description]\n"
    content += "    data = [dict(zip(column_names, row, strict=True)) for row in rows]\n"
    content += "    await cursor.close()\n"
    content += "    await conn.close()\n"
    content += '    async with aiofiles.open(csv_file, "w", newline="", encoding="utf-8") as file:\n'
    content += '        csv_writer = AsyncDictWriter(file, fieldnames=column_names, dialect="unix")\n'
    content += "        await csv_writer.writeheader()\n"
    content += "        await csv_writer.writerows(data)\n"
    content += '    json_file = csv_file.replace(".csv", ".json")\n'
    content += '    async with aiofiles.open(json_file, "w", encoding="utf-8") as file:\n'
    content += "        await file.write(json.dumps(data, indent=4, ensure_ascii=False))\n"
    content += "\n"
    # fmt: on
    return content


def get_sqlite_out(is_async: bool) -> str:
    """Get the sqlite to csv and json conversion code string.

    Parameters
    ----------
    is_async : bool
        Whether to use async mode.

    Returns
    -------
    str
        The sqlite to csv and json conversion code string.
    """
    if is_async:
        return get_async_sqlite_out()
    return get_sync_sqlite_out()


def get_sqlite_out_call(tabs: int, is_async: bool) -> str:
    """Get the sqlite to csv and json conversion call string.

    Parameters
    ----------
    tabs : int
        The number of tabs to use for indentation
    is_async : bool
        Whether to use async mode

    Returns
    -------
    str
        The sqlite to csv conversion call string.

    Example
    -------
    ```python
    >>> get_sqlite_out_call()
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
    ```
    """
    table_names = [
        "chat_completions",
        "agents",
        "oai_wrappers",
        "oai_clients",
        "version",
        "events",
        "function_calls",
    ]
    tab = "    " * tabs
    content = ""
    content += tab + 'if not os.path.exists("logs"):\n'
    content += tab + '    os.makedirs("logs")\n'
    content += tab + "for table in [\n"
    for table in table_names:
        content += tab + f'    "{table}",' + "\n"
    content += tab + "]:\n"
    content += tab + '    dest = os.path.join("logs", f"{table}.csv")' + "\n"
    if is_async:
        content += tab + '    await get_sqlite_out("flow.db", table, dest)\n'
    else:
        content += tab + '    get_sqlite_out("flow.db", table, dest)\n'
    return content


# noinspection PyUnresolvedReferences
def get_stop_logging(is_async: bool, tabs: int = 0) -> str:
    r"""Get the function to stop logging and gather logs.

    Parameters
    ----------
    is_async : bool
        Whether to use async mode
    tabs : int, optional
        The number of tabs to use for indentation, by default 0

    Returns
    -------
    str
        The logging stop string.

    Example
    -------
    ```python
    >>> get_stop_logging()
    def stop_logging() -> None:
        \"\"\"Stop logging.\"\"\"
        runtime_logging.stop()
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
    tab = "    " * tabs
    content = "\n" + tab
    if is_async:
        content += "async "
    content += "def stop_logging() -> None:\n"
    content += '    """Stop logging."""\n'
    if is_async:
        content += f"{tab}    await asyncio.to_thread(runtime_logging.stop)\n"
    else:
        content += f"{tab}    runtime_logging.stop()\n"
    content += get_sqlite_out_call(tabs + 1, is_async)
    return content
