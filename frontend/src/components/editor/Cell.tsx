import { useEffect, useRef, useCallback, memo } from 'react'

interface CopyBorder { top: boolean; bottom: boolean; left: boolean; right: boolean }
interface BorderStyle { top: string; right: string; bottom: string; left: string }

interface Props {
  cellKey: string
  rowId: number
  columnName: string
  value: string
  isSelected: boolean
  isSelectionStart: boolean
  isCopied: boolean
  showCopyBorder: CopyBorder | null
  borderStyle: BorderStyle
  isEditing: boolean
  editValue: string
  width: number
  height: number
  onEditValueChange: (v: string) => void
  onUpdate: (rowId: number, col: string, val: string) => void
  onCellClick: (key: string, e: React.MouseEvent, clickX: number) => void
  onCellMouseDown: (key: string, e: React.MouseEvent) => void
  onCellMouseEnter: (key: string) => void
  onCellMouseUp: (key: string) => void
  onStartEdit?: (init?: string, pos?: number) => void  // 将来の外部起動用（現在未使用）
  onCancelEdit: () => void
}

const DASH_STYLE = `
@keyframes dash-h { to { background-position: 8px 0; } }
@keyframes dash-v { to { background-position: 0 8px; } }
`

export const Cell = memo(function Cell({
  cellKey, rowId, columnName, value, isSelected, isSelectionStart, isCopied,
  showCopyBorder, borderStyle, isEditing, editValue, width, height,
  onEditValueChange, onUpdate, onCellClick, onCellMouseDown, onCellMouseEnter, onCellMouseUp,
  onStartEdit: _onStartEdit, onCancelEdit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus({ preventScroll: true })
  }, [isEditing])

  const handleBlur = useCallback(() => {
    if (!isEditing) return
    if (editValue !== value) onUpdate(rowId, columnName, editValue)
    else onCancelEdit()
  }, [isEditing, editValue, value, onUpdate, rowId, columnName, onCancelEdit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); if (editValue !== value) onUpdate(rowId, columnName, editValue); else onCancelEdit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit() }
  }, [editValue, value, onUpdate, rowId, columnName, onCancelEdit])

  const isAC = columnName.startsWith('AC_')
  const getBg = () => {
    if (isEditing) return isAC ? { backgroundColor: '#eff6ff' } : {}
    if (isCopied) return { backgroundColor: isAC ? '#bfdbfe' : '#eff6ff' }
    if (!isSelected) return isAC ? { backgroundColor: '#dbeafe' } : {}
    if (isSelectionStart) return isAC ? { backgroundColor: '#eff6ff' } : {}
    return { backgroundColor: isAC ? '#b6e9d8' : '#f0fdf4' }
  }

  const dashH = 'repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)'
  const dashV = 'repeating-linear-gradient(180deg, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)'

  return (
    <div
      ref={cellRef}
      className="px-2 py-1 flex items-center cursor-cell select-none"
      style={{
        ...getBg(),
        borderTop: borderStyle.top, borderRight: borderStyle.right,
        borderBottom: borderStyle.bottom, borderLeft: borderStyle.left,
        width, minWidth: width, maxWidth: width, minHeight: height, position: 'relative',
      }}
      onClick={e => { e.stopPropagation(); if (!isEditing) { const rect = cellRef.current!.getBoundingClientRect(); onCellClick(cellKey, e, e.clientX - rect.left - 8) } }}
      onMouseDown={e => onCellMouseDown(cellKey, e)}
      onMouseEnter={() => onCellMouseEnter(cellKey)}
      onMouseUp={() => onCellMouseUp(cellKey)}
    >
      {isEditing ? (
        <input ref={inputRef} type="text" value={editValue}
          onChange={e => onEditValueChange(e.target.value)}
          onBlur={handleBlur} onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none text-sm text-gray-700"
          onClick={e => e.stopPropagation()}
          style={{ caretColor: '#000' }}
        />
      ) : (
        <span className="text-sm text-gray-700 truncate w-full">{value}</span>
      )}
      {showCopyBorder && (
        <>
          <style>{DASH_STYLE}</style>
          {showCopyBorder.top && <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 2, background: dashH, animation: 'dash-h 0.5s linear infinite' }} />}
          {showCopyBorder.bottom && <div style={{ position: 'absolute', bottom: -1, left: -1, right: -1, height: 2, background: dashH, animation: 'dash-h 0.5s linear infinite' }} />}
          {showCopyBorder.left && <div style={{ position: 'absolute', top: -1, left: -1, bottom: -1, width: 2, background: dashV, animation: 'dash-v 0.5s linear infinite' }} />}
          {showCopyBorder.right && <div style={{ position: 'absolute', top: -1, right: -1, bottom: -1, width: 2, background: dashV, animation: 'dash-v 0.5s linear infinite' }} />}
        </>
      )}
    </div>
  )
})
