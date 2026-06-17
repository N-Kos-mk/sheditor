import { useState, useCallback } from 'react'

export const useSelection = () => {
  const [selectedCells, setSelectedCells] = useState(new Set<string>())
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  const [focusCell, setFocusCell] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const selectCell = useCallback((cellKey: string, isCtrl = false, isShift = false) => {
    setSelectedCells(prev => {
      if (isCtrl) {
        const next = new Set(prev)
        if (next.has(cellKey)) next.delete(cellKey); else next.add(cellKey)
        return next
      }
      return new Set([cellKey])
    })
    if (!isShift) { setSelectionStart(cellKey); setFocusCell(cellKey) }
  }, [])

  const selectRange = useCallback((startKey: string, endKey: string, allCells: string[]) => {
    const displayRows: string[] = []
    const seenRows = new Set<string>()
    const colIndices: Record<string, number> = {}

    allCells.forEach(key => {
      const dash = key.indexOf('-')
      const row = key.slice(0, dash)
      const col = key.slice(dash + 1)
      if (!seenRows.has(row)) { seenRows.add(row); displayRows.push(row) }
      if (!(col in colIndices)) colIndices[col] = Object.keys(colIndices).length
    })

    const startDash = startKey.indexOf('-')
    const startRowId = startKey.slice(0, startDash)
    const startCol = startKey.slice(startDash + 1)
    const endDash = endKey.indexOf('-')
    const endRowId = endKey.slice(0, endDash)
    const endCol = endKey.slice(endDash + 1)

    const startRowIdx = displayRows.indexOf(startRowId)
    const endRowIdx = displayRows.indexOf(endRowId)
    if (startRowIdx === -1 || endRowIdx === -1) return

    const minRowIdx = Math.min(startRowIdx, endRowIdx)
    const maxRowIdx = Math.max(startRowIdx, endRowIdx)
    const selectedRowIds = new Set(displayRows.slice(minRowIdx, maxRowIdx + 1))

    const startColIdx = colIndices[startCol] ?? 0
    const endColIdx = colIndices[endCol] ?? 0
    const minColIdx = Math.min(startColIdx, endColIdx)
    const maxColIdx = Math.max(startColIdx, endColIdx)

    const selectedKeys = new Set<string>()
    allCells.forEach(key => {
      const dash = key.indexOf('-')
      const row = key.slice(0, dash)
      const col = key.slice(dash + 1)
      if (selectedRowIds.has(row) && colIndices[col] >= minColIdx && colIndices[col] <= maxColIdx)
        selectedKeys.add(key)
    })

    setSelectedCells(selectedKeys)
    setFocusCell(endKey)
  }, [])

  const selectCellSet = useCallback((cellSet: Set<string>) => {
    setSelectedCells(new Set(cellSet))
    if (cellSet.size > 0) {
      const first = Array.from(cellSet)[0]
      setSelectionStart(first); setFocusCell(first)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set())
    setSelectionStart(null)
    setFocusCell(null)
  }, [])

  return { selectedCells, selectionStart, focusCell, selectCell, selectRange, selectCellSet, clearSelection, isSelecting, setIsSelecting }
}
