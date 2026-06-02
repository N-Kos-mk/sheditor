import { useState, useCallback } from 'react'

export const useRowHeight = () => {
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({})
  const defaultHeight = 32

  const setRowHeight = useCallback((rowId: number, height: number) => {
    setRowHeights(prev => ({ ...prev, [rowId]: Math.max(20, height) }))
  }, [])

  const getRowHeight = useCallback((rowId: number) => rowHeights[rowId] || defaultHeight, [rowHeights])

  return { rowHeights, setRowHeight, getRowHeight, defaultHeight }
}
