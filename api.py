from db import ShedDB


class ShedAPI:
    def __init__(self, file_path: str | None = None):
        self._db: ShedDB | None = None
        if file_path:
            self._db = ShedDB(file_path)

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
        return {"ok": True}

    def save_csv(self, sheet_id: str) -> str:
        return ""

    def apply_rule(self, rule_name: str, sheet_id: str) -> dict:
        return {"ok": True}

    def list_rules(self) -> list:
        return []
