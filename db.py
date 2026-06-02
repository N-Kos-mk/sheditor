import sqlite3
import uuid
from datetime import datetime, timezone

AC_COLUMNS = [
    "AC_format_description",
    "AC_format_enabled",
    "AC_url",
    "AC_memo",
    "AC_data",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_sheet_id() -> str:
    return "sheet_" + uuid.uuid4().hex[:8]


class ShedDB:
    def __init__(self, path: str):
        self.path = path
        self._conn = sqlite3.connect(path)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS table_info (
                sheet_id     TEXT PRIMARY KEY,
                sheet_name   TEXT NOT NULL UNIQUE,
                created_at   TEXT,
                updated_at   TEXT,
                sort_state   TEXT DEFAULT NULL,
                filter_state TEXT DEFAULT NULL
            )
        """)
        self._conn.commit()

    def create_sheet(self, sheet_name: str, columns: list[str]) -> str:
        sheet_id = _new_sheet_id()
        now = _now()
        col_defs = ", ".join(f'"{c}" TEXT' for c in columns + AC_COLUMNS)
        self._conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{sheet_id}" (
                internal_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
                {col_defs}
            )
        """)
        self._conn.execute(
            "INSERT INTO table_info (sheet_id, sheet_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (sheet_id, sheet_name, now, now),
        )
        self._conn.commit()
        return sheet_id

    def get_all_sheets(self) -> list[dict]:
        rows = self._conn.execute(
            "SELECT sheet_id, sheet_name, created_at, updated_at FROM table_info ORDER BY created_at"
        ).fetchall()
        return [dict(r) for r in rows]

    def get_sheet(self, sheet_id: str) -> dict | None:
        info = self._conn.execute(
            "SELECT * FROM table_info WHERE sheet_id = ?", (sheet_id,)
        ).fetchone()
        if not info:
            return None
        cursor = self._conn.execute(f'SELECT * FROM "{sheet_id}" LIMIT 0')
        columns = [d[0] for d in cursor.description]
        rows = self._conn.execute(
            f'SELECT * FROM "{sheet_id}" ORDER BY internal_row_id'
        ).fetchall()
        return {
            "sheet_id": info["sheet_id"],
            "sheet_name": info["sheet_name"],
            "sort_state": info["sort_state"],
            "filter_state": info["filter_state"],
            "columns": columns,
            "rows": [dict(r) for r in rows],
        }

    def insert_rows(self, sheet_id: str, columns: list[str], rows: list[dict]) -> None:
        if not rows:
            return
        col_names = ", ".join(f'"{c}"' for c in columns)
        placeholders = ", ".join("?" for _ in columns)
        self._conn.executemany(
            f'INSERT INTO "{sheet_id}" ({col_names}) VALUES ({placeholders})',
            [[row.get(c, "") for c in columns] for row in rows],
        )
        self._conn.commit()

    def update_cells(self, sheet_id: str, updates: list[dict]) -> None:
        """updates: [{"internal_row_id": int, "column": str, "value": str}, ...]"""
        for u in updates:
            self._conn.execute(
                f'UPDATE "{sheet_id}" SET "{u["column"]}" = ? WHERE internal_row_id = ?',
                (u["value"], u["internal_row_id"]),
            )
        self._conn.execute(
            "UPDATE table_info SET updated_at = ? WHERE sheet_id = ?",
            (_now(), sheet_id),
        )
        self._conn.commit()

    def close(self) -> None:
        self._conn.close()
