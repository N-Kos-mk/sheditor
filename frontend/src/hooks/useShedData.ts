import { useState, useCallback, useEffect } from 'react'

export interface ShedRow {
  id: number
  [key: string]: string | null | number
}

export interface ShedSheet {
  id: string
  name: string
  sort_state: Record<string, string> | null
  filter_state: Record<string, string[]> | null
  headers: string[]
  data: ShedRow[]
}

const api = () => window.pywebview?.api

function transformSheet(raw: SheetData): ShedSheet {
  return {
    id: raw.sheet_id,
    name: raw.sheet_name,
    sort_state: raw.sort_state ? JSON.parse(raw.sort_state) : null,
    filter_state: raw.filter_state ? JSON.parse(raw.filter_state) : null,
    headers: raw.columns.filter(c => c !== 'internal_row_id'),
    data: raw.rows.map(({ internal_row_id, ...rest }) => ({
      id: Number(internal_row_id),
      ...rest,
    })),
  }
}

export const useShedData = (bridgeReady: boolean) => {
  const [sheets, setSheets] = useState<ShedSheet[]>([])
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeSheet = sheets.find(s => s.id === activeSheetId) ?? null
  const data = activeSheet?.data ?? []
  const headers = activeSheet?.headers ?? []

  const loadAllSheets = useCallback(async () => {
    if (!api()) return
    setLoading(true)
    try {
      const list = await api()!.get_all_sheets()
      if (!list.length) { setSheets([]); setActiveSheetId(null); return }
      const loaded = await Promise.all(list.map(s => api()!.get_sheet(s.sheet_id)))
      const transformed = loaded.filter(Boolean).map(s => transformSheet(s!))
      setSheets(transformed)
      setActiveSheetId(prev => (prev && transformed.find(s => s.id === prev)) ? prev : transformed[0].id)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (bridgeReady) loadAllSheets()
  }, [bridgeReady, loadAllSheets])

  const reloadSheet = useCallback(async (sheetId: string) => {
    if (!api()) return
    const raw = await api()!.get_sheet(sheetId)
    if (!raw) return
    const updated = transformSheet(raw)
    setSheets(prev => prev.map(s => s.id === sheetId ? updated : s))
  }, [])

  const updateCell = useCallback(async (rowId: number, columnName: string, value: string) => {
    if (!api() || !activeSheetId) return
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s
      return { ...s, data: s.data.map(r => r.id === rowId ? { ...r, [columnName]: value } : r) }
    }))
    await api()!.update_cells(activeSheetId, [{ internal_row_id: rowId, column: columnName, value }])
  }, [activeSheetId])

  const updateMultipleCells = useCallback(async (updates: { rowId: number; columnName: string; value: string }[]) => {
    if (!api() || !activeSheetId) return
    setSheets(prev => prev.map(s => {
      if (s.id !== activeSheetId) return s
      const newData = s.data.map(r => {
        const rowUpdates = updates.filter(u => u.rowId === r.id)
        if (!rowUpdates.length) return r
        return rowUpdates.reduce((acc, u) => ({ ...acc, [u.columnName]: u.value }), r)
      })
      return { ...s, data: newData }
    }))
    await api()!.update_cells(activeSheetId, updates.map(u => ({
      internal_row_id: u.rowId, column: u.columnName, value: u.value,
    })))
  }, [activeSheetId])

  const deleteCells = useCallback(async (cellKeys: string[]) => {
    const updates: { rowId: number; columnName: string; value: string }[] = []
    cellKeys.forEach(key => {
      const dash = key.indexOf('-')
      updates.push({ rowId: parseInt(key.slice(0, dash)), columnName: key.slice(dash + 1), value: '' })
    })
    await updateMultipleCells(updates)
  }, [updateMultipleCells])

  const addSheet = useCallback(async (csvText: string, sheetName: string) => {
    if (!api()) return
    setLoading(true)
    try {
      const res = await api()!.load_csv(csvText, sheetName)
      if (!res.ok) { alert(res.error ?? 'インポートに失敗しました'); return }
      await loadAllSheets()
      if (res.sheet_id) setActiveSheetId(res.sheet_id)
    } finally {
      setLoading(false)
    }
  }, [loadAllSheets])

  const renameSheet = useCallback(async (sheetId: string, newName: string) => {
    if (!api()) return
    const res = await (api() as any).rename_sheet?.(sheetId, newName)
    if (res?.ok === false) { alert(res.error ?? 'リネームに失敗しました'); return }
    setSheets(prev => prev.map(s => s.id === sheetId ? { ...s, name: newName } : s))
  }, [])

  const deleteSheet = useCallback(async (sheetId: string) => {
    if (!api()) return
    const res = await (api() as any).delete_sheet?.(sheetId)
    if (res?.ok === false) { alert(res.error ?? '削除に失敗しました'); return }
    await loadAllSheets()
  }, [loadAllSheets])

  return {
    sheets, activeSheetId, setActiveSheetId, data, headers,
    loading, loadAllSheets, reloadSheet,
    updateCell, updateMultipleCells, deleteCells,
    addSheet, renameSheet, deleteSheet,
  }
}
