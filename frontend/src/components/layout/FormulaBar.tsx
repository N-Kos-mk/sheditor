import { useMemo, useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import type { ShedRow } from '../../hooks/useShedData'

interface Props {
  selectedCell: string | null
  value: string
  data: ShedRow[]
  headers: string[]
  onFormulaBarChange: (cellKey: string, value: string) => void
  onFormulaBarInput: (cellKey: string, value: string) => void
  isEditingCell: boolean
  keyField?: string
  keyFieldCopyLabel?: string
}

export const FormulaBar = ({
  selectedCell, value, data, headers, onFormulaBarChange, onFormulaBarInput,
  isEditingCell, keyField = '', keyFieldCopyLabel = 'コピー',
}: Props) => {
  const [localValue, setLocalValue] = useState(value || '')
  const [showCheck, setShowCheck] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) setLocalValue(value || '')
  }, [value, isFocused])

  const cellInfo = useMemo(() => {
    if (!selectedCell) return { display: '', keyValue: null, canCopy: false }
    const [rowId] = selectedCell.split('-')
    const row = data.find(r => r.id === parseInt(rowId))
    if (!row) return { display: '', keyValue: null, canCopy: false }
    const hasKey = headers.includes(keyField)
    const keyValue = hasKey ? String(row[keyField] ?? '') : null
    return { display: keyValue || rowId, keyValue: keyValue || null, canCopy: !!keyValue }
  }, [selectedCell, data, headers, keyField])

  const handleCopy = async () => {
    if (!cellInfo.keyValue) return
    try { await navigator.clipboard.writeText(cellInfo.keyValue); setShowCheck(true); setTimeout(() => setShowCheck(false), 1000) } catch {}
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center gap-2 formula-bar-container">
      <div className="flex items-center gap-1">
        <div className="bg-white border border-gray-300 rounded px-3 flex items-center justify-center" style={{ width: 100, minWidth: 100, height: 28 }}>
          <span className={`text-sm font-medium ${cellInfo.keyValue ? 'text-blue-600' : 'text-gray-800'}`}>{cellInfo.display}</span>
        </div>
        <button
          onMouseDown={e => e.preventDefault()} onClick={handleCopy} disabled={!cellInfo.canCopy}
          className={`p-1.5 rounded ${cellInfo.canCopy ? 'hover:bg-gray-100 text-gray-700 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
          title={cellInfo.canCopy ? keyFieldCopyLabel : 'コピー不可'}
        >
          {showCheck ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <div className="font-bold px-2" style={{ color: '#999', fontStyle: 'italic' }}>f(x)</div>
      <div className="flex-1 border border-gray-300 rounded px-2 py-1">
        <input
          ref={inputRef} type="text" value={localValue}
          onChange={e => { setLocalValue(e.target.value); if (editingCell) onFormulaBarInput(editingCell, e.target.value) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); if (editingCell && localValue !== value) onFormulaBarChange(editingCell, localValue); setIsFocused(false); setEditingCell(null); inputRef.current?.blur() }
            if (e.key === 'Escape') { e.preventDefault(); setLocalValue(value || ''); setIsFocused(false); setEditingCell(null); inputRef.current?.blur() }
          }}
          onBlur={() => { setIsFocused(false); if (editingCell === selectedCell && localValue !== value) onFormulaBarChange(editingCell!, localValue); setEditingCell(null) }}
          onFocus={() => { setIsFocused(true); setEditingCell(selectedCell) }}
          disabled={isEditingCell || !selectedCell}
          className="w-full text-sm outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
