import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'shed-column-widths'
const DEFAULT_WIDTH = 150

export const useColumnWidth = (headers: string[]) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      const merged: Record<string, number> = { ...saved }
      headers.forEach(h => { if (!(h in merged)) merged[h] = DEFAULT_WIDTH })
      setColumnWidths(merged)
    } catch {
      setColumnWidths(headers.reduce((acc, h) => ({ ...acc, [h]: DEFAULT_WIDTH }), {}))
    } finally {
      loadedRef.current = true
      setLoaded(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loadedRef.current) return
    setColumnWidths(prev => {
      const next = { ...prev }
      let changed = false
      headers.forEach(h => { if (!(h in next)) { next[h] = DEFAULT_WIDTH; changed = true } })
      return changed ? next : prev
    })
  }, [headers])

  useEffect(() => {
    if (!loadedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths))
    }, 400)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [columnWidths])

  const setColumnWidth = useCallback((columnName: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnName]: Math.max(50, width) }))
  }, [])

  return { columnWidths, setColumnWidth, loaded }
}
