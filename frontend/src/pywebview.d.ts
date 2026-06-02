interface SheetInfo {
  sheet_id: string
  sheet_name: string
  created_at: string
  updated_at: string
}

interface SheetData {
  sheet_id: string
  sheet_name: string
  sort_state: string | null
  filter_state: string | null
  columns: string[]
  rows: Record<string, string | null>[]
}

interface CellUpdate {
  internal_row_id: number
  column: string
  value: string
}

interface ShedAPI {
  get_all_sheets(): Promise<SheetInfo[]>
  get_sheet(sheet_id: string): Promise<SheetData | null>
  update_cells(sheet_id: string, updates: CellUpdate[]): Promise<{ ok: boolean; error?: string }>
  load_csv(csv_text: string, sheet_name: string): Promise<{ ok: boolean; sheet_id?: string; sheet_name?: string; error?: string }>
  save_csv(sheet_id: string): Promise<string>
  open_file(): Promise<{ ok: boolean; path?: string; sheets?: SheetInfo[] }>
  new_file(): Promise<{ ok: boolean; path?: string }>
  apply_rule(rule_name: string, sheet_id: string): Promise<{ ok: boolean }>
  list_rules(): Promise<string[]>
}

interface Window {
  pywebview?: { api: ShedAPI }
}
