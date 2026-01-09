# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pylint: disable=missing-param-doc,no-self-use

"""Tests for db_utils module."""

import asyncio
import csv
import json
import sqlite3
from pathlib import Path
from unittest.mock import MagicMock, patch

from waldiez.running.db_utils import a_get_sqlite_out, get_sqlite_out


class TestGetSqliteOut:
    """Tests for get_sqlite_out function."""

    def test_successful_conversion(self, tmp_path: Path) -> None:
        """Test successful conversion of sqlite table to CSV and JSON."""
        # Create test database
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create and populate test table
        cursor.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT,
                age INTEGER
            )
        """
        )

        test_data = [
            (1, "Alice", "alice@example.com", 30),
            (2, "Bob", "bob@example.com", 25),
            (3, "Charlie", "charlie@example.com", 35),
        ]

        cursor.executemany(
            "INSERT INTO users (id, name, email, age) VALUES (?, ?, ?, ?)",
            test_data,
        )
        conn.commit()
        conn.close()

        # Convert to CSV
        csv_path = tmp_path / "users.csv"
        get_sqlite_out(str(db_path), "users", str(csv_path))

        # Verify CSV file
        assert csv_path.exists()
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert len(rows) == 3
        assert rows[0]["name"] == "Alice"
        assert rows[1]["email"] == "bob@example.com"
        assert rows[2]["age"] == "35"

        # Verify JSON file
        json_path = tmp_path / "users.json"
        assert json_path.exists()
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

        assert len(json_data) == 3
        assert json_data[0]["name"] == "Alice"
        assert json_data[1]["age"] == 25
        assert json_data[2]["email"] == "charlie@example.com"

    def test_empty_table(self, tmp_path: Path) -> None:
        """Test conversion of empty table."""
        # Create test database with empty table
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE empty_table (id INTEGER, data TEXT)")
        conn.commit()
        conn.close()

        csv_path = tmp_path / "empty.csv"
        get_sqlite_out(str(db_path), "empty_table", str(csv_path))

        # Verify CSV has headers only
        assert csv_path.exists()
        with open(csv_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "id,data" in content

        # Verify JSON is empty array
        json_path = tmp_path / "empty.json"
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)
        assert json_data == []

    def test_database_connection_error(self, tmp_path: Path) -> None:
        """Test handling of database connection error."""
        csv_path = tmp_path / "output.csv"

        # Non-existent database
        get_sqlite_out("non_existent.db", "table", str(csv_path))

        # Should return without creating files
        assert not csv_path.exists()
        assert not (tmp_path / "output.json").exists()
        if Path("non_existent.db").exists():
            Path("non_existent.db").unlink()

    def test_invalid_table_name(self, tmp_path: Path) -> None:
        """Test handling of invalid table name."""
        # Create test database
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        conn.execute("CREATE TABLE valid_table (id INTEGER)")
        conn.commit()
        conn.close()

        csv_path = tmp_path / "output.csv"

        # Query non-existent table
        get_sqlite_out(str(db_path), "invalid_table", str(csv_path))

        # Should return without creating files
        assert not csv_path.exists()
        assert not (tmp_path / "output.json").exists()

    def test_special_characters_in_data(self, tmp_path: Path) -> None:
        """Test handling of special characters in data."""
        # Create test database
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("CREATE TABLE data (id INTEGER, text TEXT)")

        special_data = [
            (1, 'Line with "quotes"'),
            (2, "Line with\nnewline"),
            (3, "Unicode: 你好, мир, 🚀"),
            (4, None),  # NULL value
        ]

        cursor.executemany("INSERT INTO data VALUES (?, ?)", special_data)
        conn.commit()
        conn.close()

        csv_path = tmp_path / "special.csv"
        get_sqlite_out(str(db_path), "data", str(csv_path))

        # Verify data integrity
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert rows[0]["text"] == 'Line with "quotes"'
        assert rows[2]["text"] == "Unicode: 你好, мир, 🚀"

        # Check JSON handling
        json_path = tmp_path / "special.json"
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

        assert json_data[1]["text"] == "Line with\nnewline"
        assert json_data[3]["text"] is None

    def test_large_dataset(self, tmp_path: Path) -> None:
        """Test conversion of large dataset."""
        # Create test database with many rows
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE large_table (
                id INTEGER PRIMARY KEY,
                value REAL,
                description TEXT
            )
        """
        )

        # Insert 1000 rows
        large_data = [
            (i, i * 0.5, f"Description for item {i}") for i in range(1, 1001)
        ]

        cursor.executemany(
            "INSERT INTO large_table VALUES (?, ?, ?)", large_data
        )
        conn.commit()
        conn.close()

        csv_path = tmp_path / "large.csv"
        get_sqlite_out(str(db_path), "large_table", str(csv_path))

        # Verify all data was converted
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert len(rows) == 1000
        assert rows[499]["id"] == "500"
        assert float(rows[999]["value"]) == 500.0

    @patch("sqlite3.connect")
    def test_connection_close_on_error(self, mock_connect: MagicMock) -> None:
        """Test that connection is closed on error."""
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        mock_conn.execute.side_effect = Exception("Query error")

        get_sqlite_out("test.db", "table", "output.csv")

        # Verify connection was closed
        mock_conn.close.assert_called_once()


class TestAsyncGetSqliteOut:
    """Tests for a_get_sqlite_out function."""

    async def test_successful_async_conversion(self, tmp_path: Path) -> None:
        """Test successful async conversion of sqlite table to CSV and JSON."""
        # Create test database
        db_path = tmp_path / "test_async.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE products (
                id INTEGER PRIMARY KEY,
                name TEXT,
                price REAL
            )
        """
        )

        test_data = [
            (1, "Product A", 19.99),
            (2, "Product B", 29.99),
            (3, "Product C", 39.99),
        ]

        cursor.executemany("INSERT INTO products VALUES (?, ?, ?)", test_data)
        conn.commit()
        conn.close()

        # Convert to CSV asynchronously
        csv_path = tmp_path / "products.csv"
        await a_get_sqlite_out(str(db_path), "products", str(csv_path))

        # Verify CSV file
        assert csv_path.exists()
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert len(rows) == 3
        assert rows[0]["name"] == "Product A"
        assert float(rows[1]["price"]) == 29.99

        # Verify JSON file
        json_path = tmp_path / "products.json"
        assert json_path.exists()
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

        assert len(json_data) == 3
        assert json_data[2]["name"] == "Product C"

    async def test_async_database_connection_error(
        self, tmp_path: Path
    ) -> None:
        """Test async handling of database connection error."""
        csv_path = tmp_path / "output.csv"

        # Non-existent database
        await a_get_sqlite_out("non_existent_async.db", "table", str(csv_path))

        # Should return without creating files
        assert not csv_path.exists()
        assert not (tmp_path / "output.json").exists()
        if Path("non_existent_async.db").exists():
            Path("non_existent_async.db").unlink()

    async def test_async_query_error(self, tmp_path: Path) -> None:
        """Test async handling of query error."""
        # Create test database
        db_path = tmp_path / "test_async.db"
        conn = sqlite3.connect(db_path)
        conn.execute("CREATE TABLE valid_table (id INTEGER)")
        conn.commit()
        conn.close()

        csv_path = tmp_path / "output.csv"

        # Query non-existent table
        await a_get_sqlite_out(str(db_path), "invalid_table", str(csv_path))

        # Should return without creating files
        assert not csv_path.exists()

    async def test_async_concurrent_conversions(self, tmp_path: Path) -> None:
        """Test multiple concurrent async conversions."""
        # Create multiple test databases
        for i in range(3):
            db_path = tmp_path / f"test_{i}.db"
            conn = sqlite3.connect(db_path)
            q = (
                f"CREATE TABLE table_{i} "  # nosemgrep # nosec
                "(id INTEGER,data TEXT)"
            )
            conn.execute(q)
            q = (
                f"INSERT INTO table_{i} VALUES "  # nosemgrep # nosec
                f"(1, 'Data from db {i}'),"  # nosemgrep # nosec
                f"(2, 'More data from db {i}')"  # nosemgrep # nosec
            )
            conn.execute(q)
            conn.commit()
            conn.close()

        # Run conversions concurrently
        tasks = [
            a_get_sqlite_out(
                str(tmp_path / f"test_{i}.db"),
                f"table_{i}",
                str(tmp_path / f"output_{i}.csv"),
            )
            for i in range(3)
        ]

        await asyncio.gather(*tasks)

        # Verify all conversions completed
        for i in range(3):
            csv_path = tmp_path / f"output_{i}.csv"
            json_path = tmp_path / f"output_{i}.json"

            assert csv_path.exists()
            assert json_path.exists()

            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            assert len(data) == 2
            assert f"Data from db {i}" in data[0]["data"]

    async def test_async_empty_table(self, tmp_path: Path) -> None:
        """Test async conversion of empty table."""
        # Create test database with empty table
        db_path = tmp_path / "test_async.db"
        conn = sqlite3.connect(db_path)
        conn.execute("CREATE TABLE empty_async (id INTEGER, data TEXT)")
        conn.commit()
        conn.close()

        csv_path = tmp_path / "empty_async.csv"
        await a_get_sqlite_out(str(db_path), "empty_async", str(csv_path))

        # Verify empty results
        json_path = tmp_path / "empty_async.json"
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)
        assert json_data == []
