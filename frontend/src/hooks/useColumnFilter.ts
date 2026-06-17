import { useState, useCallback, useRef, useEffect } from 'react'
import type { ShedRow } from './useShedData'

export const useColumnFilter = (data: ShedRow[], _headers: string[]) => {
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [filterRowIds, setFilterRowIds] = useState<Record<string, Set<number>>>({})
  const [sorts, setSorts] = useState<Record<string, string>>({})
  const [sortedRowIds, setSortedRowIds] = useState<number[] | null>(null)

  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
  const filterRowIdsRef = useRef(filterRowIds)
  useEffect(() => { filterRowIdsRef.current = filterRowIds }, [filterRowIds])

  const setColumnFilter = useCallback((columnName: string, values: string[]) => {
    const allowedIds = new Set(
      dataRef.current.filter(row => values.includes(String(row[columnName] ?? ''))).map(row => row.id)
    )
    setFilterRowIds(prev => ({ ...prev, [columnName]: allowedIds }))
    setFilters(prev => ({ ...prev, [columnName]: values }))
  }, [])

  const clearColumnFilter = useCallback((columnName: string) => {
    setFilterRowIds(prev => { const n = { ...prev }; delete n[columnName]; return n })
    setFilters(prev => { const n = { ...prev }; delete n[columnName]; return n })
  }, [])

  const clearAllFilters = useCallback(({ saveToServer: _save = true } = {}) => {
    setFilterRowIds({}); setFilters({}); setSorts({}); setSortedRowIds(null)
  }, [])

  const setColumnSort = useCallback((columnName: string, direction: string) => {
    let baseRows = [...dataRef.current]
    Object.values(filterRowIdsRef.current).forEach(allowedIds => {
      baseRows = baseRows.filter(row => allowedIds.has(row.id))
    })
    baseRows.sort((a, b) => {
      const aVal = String(a[columnName] ?? ''); const bVal = String(b[columnName] ?? '')
      return direction === 'asc' ? aVal.localeCompare(bVal, 'ja') : bVal.localeCompare(aVal, 'ja')
    })
    setSortedRowIds(baseRows.map(r => r.id))
    setSorts({ [columnName]: direction })
  }, [])

  const clearColumnSort = useCallback((_columnName: string) => {
    setSorts({}); setSortedRowIds(null)
  }, [])

  const initFromServerState = useCallback((
    sortState: Record<string, string> | null,
    filterState: Record<string, string[]> | null
  ) => {
    const newFilters: Record<string, string[]> = {}
    const newFilterRowIds: Record<string, Set<number>> = {}

    if (filterState && typeof filterState === 'object') {
      for (const [col, values] of Object.entries(filterState)) {
        if (Array.isArray(values) && values.length > 0) {
          newFilters[col] = values
          newFilterRowIds[col] = new Set(
            dataRef.current.filter(row => values.includes(String(row[col] ?? ''))).map(r => r.id)
          )
        }
      }
    }
    setFilters(newFilters); setFilterRowIds(newFilterRowIds)

    if (sortState?.column && sortState?.direction) {
      let baseRows = [...dataRef.current]
      for (const allowedIds of Object.values(newFilterRowIds))
        baseRows = baseRows.filter(row => allowedIds.has(row.id))
      baseRows.sort((a, b) => {
        const aVal = String(a[sortState.column] ?? ''); const bVal = String(b[sortState.column] ?? '')
        return sortState.direction === 'asc' ? aVal.localeCompare(bVal, 'ja') : bVal.localeCompare(aVal, 'ja')
      })
      setSortedRowIds(baseRows.map(r => r.id))
      setSorts({ [sortState.column]: sortState.direction })
    } else {
      setSorts({}); setSortedRowIds(null)
    }
  }, [])

  const getFilteredAndSortedData = useCallback(() => {
    let result = [...data]
    Object.values(filterRowIds).forEach(allowedIds => {
      result = result.filter(row => allowedIds.has(row.id))
    })
    if (sortedRowIds && sortedRowIds.length > 0) {
      const rank = new Map(sortedRowIds.map((id, i) => [id, i]))
      result.sort((a, b) => {
        const ar = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER
        const br = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER
        return ar - br
      })
    }
    return result
  }, [data, filterRowIds, sortedRowIds])

  const hasFilter = useCallback((columnName: string) => columnName in filterRowIds, [filterRowIds])

  return { filters, sorts, setColumnFilter, clearColumnFilter, clearAllFilters, setColumnSort, clearColumnSort, getFilteredAndSortedData, hasFilter, initFromServerState }
}
