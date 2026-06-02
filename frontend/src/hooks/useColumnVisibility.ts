import { useState, useCallback, useEffect } from 'react'

export const useColumnVisibility = (headers: string[]) => {
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const headersKey = headers.join(',')

  useEffect(() => {
    if (headers.length === 0) return
    setVisibleColumns(prev =>
      headers.reduce((acc, h) => ({ ...acc, [h]: prev[h] ?? true }), {} as Record<string, boolean>)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headersKey])

  const toggleColumn = useCallback((columnName: string) => {
    setVisibleColumns(prev => ({ ...prev, [columnName]: !prev[columnName] }))
  }, [])

  const applyColumnSet = useCallback((columns: string[] | null) => {
    setVisibleColumns(prev => {
      const keys = Object.keys(prev)
      if (columns === null) return Object.fromEntries(keys.map(h => [h, true]))
      if (columns.length === 0) return Object.fromEntries(keys.map(h => [h, false]))
      return Object.fromEntries(keys.map(h => [h, columns.includes(h)]))
    })
  }, [])

  return { visibleColumns, toggleColumn, applyColumnSet }
}
