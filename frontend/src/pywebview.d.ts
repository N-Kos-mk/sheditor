interface ShedAPI {
  get_all_sheets(): Promise<unknown[]>
  get_sheet(sheet_id: string): Promise<unknown>
  update_cells(sheet_id: string, updates: unknown[]): Promise<{ ok: boolean }>
  load_csv(csv_text: string, sheet_name: string): Promise<{ ok: boolean }>
  save_csv(sheet_id: string): Promise<string>
  apply_rule(rule_name: string, sheet_id: string): Promise<{ ok: boolean }>
  list_rules(): Promise<string[]>
}

interface Window {
  pywebview?: { api: ShedAPI }
}
