import os

from db import ShedDB


class ShedAPI:
    def __init__(self, file_path: str | None = None, user_data_dir: str = "."):
        self._dbs: dict[str, ShedDB] = {}
        self._active_path: str | None = None
        self._user_data_dir = user_data_dir
        if file_path:
            self._dbs[file_path] = ShedDB(file_path)
            self._active_path = file_path

    @property
    def _db(self) -> ShedDB | None:
        if self._active_path is None:
            return None
        return self._dbs.get(self._active_path)

    # ── ファイル管理 ──────────────────────────────────────────────

    def get_open_files(self) -> list:
        return [
            {"path": path, "is_active": path == self._active_path}
            for path in self._dbs
        ]

    def open_file(self) -> dict:
        import webview
        paths = webview.windows[0].create_file_dialog(
            webview.FileDialog.OPEN,
            file_types=('Shed Files (*.shed)',),
        )
        if not paths:
            return {"ok": False}
        path = paths[0] if isinstance(paths, (list, tuple)) else paths
        if path not in self._dbs:
            self._dbs[path] = ShedDB(path)
        self._active_path = path
        return {"ok": True, "path": path, "sheets": self._dbs[path].get_all_sheets()}

    def new_file(self) -> dict:
        import webview
        paths = webview.windows[0].create_file_dialog(
            webview.FileDialog.SAVE,
            save_filename='untitled.shed',
        )
        if not paths:
            return {"ok": False}
        path = paths[0] if isinstance(paths, (list, tuple)) else paths
        if not path.endswith('.shed'):
            path += '.shed'
        self._dbs[path] = ShedDB(path)
        self._active_path = path
        return {"ok": True, "path": path}

    def switch_file(self, path: str) -> dict:
        if path not in self._dbs:
            return {"ok": False, "error": "file not open"}
        self._active_path = path
        return {"ok": True, "path": path}

    def close_file(self, path: str) -> dict:
        if path not in self._dbs:
            return {"ok": False, "error": "file not open"}
        self._dbs[path].close()
        del self._dbs[path]
        if self._active_path == path:
            self._active_path = next(iter(self._dbs), None)
        return {"ok": True, "new_active": self._active_path}

    # ── シートデータ ──────────────────────────────────────────────

    def get_all_sheets(self) -> list:
        if not self._db:
            return []
        return self._db.get_all_sheets()

    def get_sheet(self, sheet_id: str) -> dict | None:
        if not self._db:
            return None
        return self._db.get_sheet(sheet_id)

    def update_cells(self, sheet_id: str, updates: list) -> dict:
        if not self._db:
            return {"ok": False, "error": "no file open"}
        self._db.update_cells(sheet_id, updates)
        return {"ok": True}

    def load_csv(self, csv_text: str, sheet_name: str) -> dict:
        import csv, io

        if not self._db:
            return {"ok": False, "error": "ファイルが開かれていません"}

        reader = csv.DictReader(io.StringIO(csv_text))
        columns = list(reader.fieldnames or [])
        rows = list(reader)

        existing = {s["sheet_name"] for s in self._db.get_all_sheets()}
        name, n = sheet_name, 1
        while name in existing:
            name = f"{sheet_name} ({n})"
            n += 1

        sheet_id = self._db.create_sheet(name, columns)
        self._db.insert_rows(sheet_id, columns, rows)
        return {"ok": True, "sheet_id": sheet_id, "sheet_name": name}

    def save_csv(self, sheet_id: str) -> str:
        import csv, io
        from db import AC_COLUMNS

        if not self._db:
            return ""
        sheet = self._db.get_sheet(sheet_id)
        if not sheet:
            return ""

        exclude = {"internal_row_id"} | set(AC_COLUMNS)
        columns = [c for c in sheet["columns"] if c not in exclude]

        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=columns, extrasaction="ignore", lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(sheet["rows"])
        return buf.getvalue()

    def rename_sheet(self, sheet_id: str, new_name: str) -> dict:
        if not self._db:
            return {"ok": False, "error": "no file open"}
        try:
            self._db.rename_sheet(sheet_id, new_name)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    def delete_sheet(self, sheet_id: str) -> dict:
        if not self._db:
            return {"ok": False, "error": "no file open"}
        try:
            self._db.delete_sheet(sheet_id)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ── プラグイン ────────────────────────────────────────────────

    def apply_rule(self, rule_name: str, sheet_id: str) -> dict:
        # TODO: rules/ からモジュールを読み込んで apply() を実行する
        return {"ok": True}

    def list_rules(self) -> list:
        rules_dir = os.path.join(self._user_data_dir, "rules")
        if not os.path.isdir(rules_dir):
            return []
        result = []
        for fname in sorted(os.listdir(rules_dir)):
            if fname.endswith(".py") and not fname.startswith("_"):
                result.append(fname[:-3])
        return result
