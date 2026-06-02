class ShedAPI:
    def __init__(self, file_path: str | None = None):
        self.file_path = file_path

    def get_all_sheets(self) -> list:
        return []

    def get_sheet(self, sheet_id: str) -> dict | None:
        return None

    def update_cells(self, sheet_id: str, updates: list) -> dict:
        return {"ok": True}

    def load_csv(self, csv_text: str, sheet_name: str) -> dict:
        return {"ok": True}

    def save_csv(self, sheet_id: str) -> str:
        return ""

    def apply_rule(self, rule_name: str, sheet_id: str) -> dict:
        return {"ok": True}

    def list_rules(self) -> list:
        return []
