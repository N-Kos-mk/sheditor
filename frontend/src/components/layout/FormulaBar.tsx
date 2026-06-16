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
    try {
      await navigator.clipboard.writeText(cellInfo.keyValue)
      setShowCheck(true)
      setTimeout(() => setShowCheck(false), 1000)
    } catch {}
  }

  return (
    <div className="h-9 bg-white border-b border-zinc-200 px-3 flex items-center gap-2 formula-bar-container shrink-0">
      <div
        className="font-mono text-xs bg-zinc-50 border border-zinc-200 rounded px-2 h-6 flex items-center justify-center shrink-0"
        style={{ minWidth: 88 }}
      >
        <span className={`truncate ${cellInfo.keyValue ? 'text-indigo-600 font-medium' : 'text-zinc-700'}`}>
          {cellInfo.display || <span className="text-zinc-300">—</span>}
        </span>
      </div>
      <button
        onMouseDown={e => e.preventDefault()} onClick={handleCopy} disabled={!cellInfo.canCopy}
        title={cellInfo.canCopy ? keyFieldCopyLabel : undefined}
        className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
      >
        {showCheck ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      </button>
      <div className="w-px h-4 bg-zinc-200 shrink-0" />
      <input
        ref={inputRef} type="text" value={localValue}
        onChange={e => { setLocalValue(e.target.value); if (editingCell) onFormulaBarInput(editingCell, e.target.value) }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (editingCell && localValue !== value) onFormulaBarChange(editingCell, localValue)
            setIsFocused(false); setEditingCell(null); inputRef.current?.blur()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            setLocalValue(value || ''); setIsFocused(false); setEditingCell(null); inputRef.current?.blur()
          }
        }}
        onBlur={() => {
          setIsFocused(false)
          if (editingCell === selectedCell && localValue !== value) onFormulaBarChange(editingCell!, localValue)
          setEditingCell(null)
        }}
        onFocus={() => { setIsFocused(true); setEditingCell(selectedCell) }}
        disabled={isEditingCell || !selectedCell}
        placeholder={selectedCell ? undefined : 'セルを選択してください'}
        className="flex-1 text-sm text-zinc-800 outline-none bg-transparent placeholder:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed min-w-0"
      />
    </div>
  )
}
