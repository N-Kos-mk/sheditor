import { useState, useCallback } from 'react'
import type { ShedRow } from './useShedData'

export const useClipboard = () => {
  const [copiedCells, setCopiedCells] = useState(new Set<string>())
  const [copyMode, setCopyMode] = useState(false)
  const [copyData, setCopyData] = useState<unknown>(null)

  const copyToClipboard = useCallback(async (
    selectedCells: Set<string>, data: ShedRow[], headers: string[],
    visibleColumns: Record<string, boolean>, selectionStart: string | null
  ) => {
    if (selectedCells.size === 0) return
    const cellsArray = Array.from(selectedCells)
    const positions = cellsArray.map(key => {
      const [row, col] = key.split('-')
      return { row: parseInt(row), col, key }
    })
    const selectedRowIds = new Set(positions.map(p => p.row))
    const visibleHeaders = headers.filter(h => visibleColumns[h])
    const colIndices: Record<string, number> = {}
    visibleHeaders.forEach((h, i) => { colIndices[h] = i })

    const minCol = Math.min(...positions.map(p => colIndices[p.col] ?? 0))
    const maxCol = Math.max(...positions.map(p => colIndices[p.col] ?? 0))

    const displayRowIds = data.map(r => r.id)
    const selectedDisplayRowIds = displayRowIds.filter(id => selectedRowIds.has(id))

    const gridData: string[][] = []
    selectedDisplayRowIds.forEach(rowId => {
      const rowData: string[] = []
      for (let i = minCol; i <= maxCol; i++) {
        const header = visibleHeaders[i]
        const rowObj = data.find(r => r.id === rowId)
        rowData.push(rowObj ? (String(rowObj[header] ?? '')) : '')
      }
      gridData.push(rowData)
    })

    const clipboardText = gridData.map(row => row.join('\t')).join('\n')
    try { await navigator.clipboard.writeText(clipboardText) } catch {}

    setCopiedCells(new Set(cellsArray))
    setCopyMode(true)
    setCopyData({
      cells: cellsArray, gridData,
      minRow: selectedDisplayRowIds[0], maxRow: selectedDisplayRowIds[selectedDisplayRowIds.length - 1],
      minCol, maxCol, width: maxCol - minCol + 1, height: selectedDisplayRowIds.length,
      headers: visibleHeaders.slice(minCol, maxCol + 1), selectionStart,
    })
  }, [])

  const clearCopyMode = useCallback(() => {
    setCopiedCells(new Set()); setCopyMode(false); setCopyData(null)
  }, [])

  const pasteFromClipboard = useCallback(async (
    selectedCells: Set<string>, data: ShedRow[], headers: string[],
    visibleColumns: Record<string, boolean>, selectionStart: string | null,
    updateMultipleCells: (updates: { rowId: number; columnName: string; value: string }[]) => void,
    selectCellSet: (cells: Set<string>) => void
  ) => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText) return
      const lines = clipboardText.split('\n').filter(l => l.length > 0)
      const gridData = lines.map(l => l.split('\t'))
      const sourceHeight = gridData.length
      const sourceWidth = gridData[0]?.length || 0
      if (sourceHeight === 0 || sourceWidth === 0) return

      const targetCell = selectionStart || Array.from(selectedCells)[0]
      if (!targetCell) return

      const [targetRow, targetCol] = targetCell.split('-')
      const targetRowNum = parseInt(targetRow)
      const visibleHeaders = headers.filter(h => visibleColumns[h])
      const targetColIdx = visibleHeaders.indexOf(targetCol)
      if (targetColIdx === -1) return

      const displayRowIds = data.map(r => r.id)
      const targetRowIndex = displayRowIds.indexOf(targetRowNum)
      if (targetRowIndex === -1) return

      let pasteRowCount = sourceHeight
      let pasteWidth = sourceWidth

      if (selectedCells.size > 1) {
        const cellsArray = Array.from(selectedCells)
        const positions = cellsArray.map(key => {
          const [row, col] = key.split('-')
          return { row: parseInt(row), colIdx: visibleHeaders.indexOf(col) }
        }).filter(p => p.colIdx !== -1)
        const selectedRowIds = new Set(positions.map(p => p.row))
        const selectedDisplayRows = displayRowIds.filter(id => selectedRowIds.has(id))
        const minCol = Math.min(...positions.map(p => p.colIdx))
        const maxCol = Math.max(...positions.map(p => p.colIdx))
        pasteRowCount = selectedDisplayRows.length
        pasteWidth = maxCol - minCol + 1
      }

      const updates: { rowId: number; columnName: string; value: string }[] = []
      const pastedCells = new Set<string>()

      for (let rowOffset = 0; rowOffset < pasteRowCount; rowOffset++) {
        for (let colOffset = 0; colOffset < pasteWidth; colOffset++) {
          const value = gridData[rowOffset % sourceHeight][colOffset % sourceWidth]
          const targetDisplayIndex = targetRowIndex + rowOffset
          if (targetDisplayIndex >= displayRowIds.length) continue
          const newRowId = displayRowIds[targetDisplayIndex]
          const newColIdx = targetColIdx + colOffset
          if (newColIdx < visibleHeaders.length) {
            const newHeader = visibleHeaders[newColIdx]
            updates.push({ rowId: newRowId, columnName: newHeader, value })
            pastedCells.add(`${newRowId}-${newHeader}`)
          }
        }
      }

      updateMultipleCells(updates)
      selectCellSet(pastedCells)
      const hasOverlap = Array.from(pastedCells).some(cell => copiedCells.has(cell))
      if (hasOverlap) clearCopyMode()
    } catch {}
  }, [copiedCells, clearCopyMode])

  return { copiedCells, copyMode, copyData, copyToClipboard, pasteFromClipboard, clearCopyMode }
}
