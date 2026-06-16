import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowDownAZ, ArrowDownZA, Search, X } from 'lucide-react'
import type { ShedRow } from '../../hooks/useShedData'

interface Props {
  columnName: string
  data: ShedRow[]
  displayData: ShedRow[]
  currentFilter?: string[]
  onApplyFilter: (values: string[]) => void
  onClearFilter: () => void
  onSort: (direction: string) => void
  onClose: () => void
  position: { top: number; left: number }
}

export const ColumnFilterPopup = ({
  columnName, data, displayData, currentFilter, onApplyFilter, onClearFilter, onSort, onClose, position,
}: Props) => {
  const [searchText, setSearchText] = useState('')
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [isInitialState, setIsInitialState] = useState(!currentFilter || currentFilter.length === 0)
  const [pos, setPos] = useState(position)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const uniqueValues = useMemo(() => {
    const values: Record<string, number> = {}
    data.forEach(row => { const v = String(row[columnName] ?? ''); values[v] = (values[v] ?? 0) + 1 })
    return Object.keys(values).map(v => ({ value: v, count: values[v] })).sort((a, b) => a.value.localeCompare(b.value, 'ja'))
  }, [data, columnName])

  const filteredValues = useMemo(() => {
    if (!searchText) return uniqueValues
    return uniqueValues.filter(item => item.value.toLowerCase().includes(searchText.toLowerCase()))
  }, [uniqueValues, searchText])

  useEffect(() => {
    const displayValues = new Set<string>()
    displayData?.forEach(row => displayValues.add(String(row[columnName] ?? '')))
    if (displayValues.size > 0) {
      setSelectedValues(displayValues); setIsInitialState(displayValues.size === uniqueValues.length)
    } else if (!currentFilter || currentFilter.length === 0) {
      setSelectedValues(new Set(uniqueValues.map(i => i.value))); setIsInitialState(true)
    } else {
      setSelectedValues(new Set(currentFilter)); setIsInitialState(false)
    }
  }, [uniqueValues, currentFilter, displayData, columnName])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ top: e.clientY - dragOffset.current.y, left: e.clientX - dragOffset.current.x })
    }
    const onUp = () => { dragging.current = false }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const toggle = (value: string) => setSelectedValues(prev => {
    const n = new Set(prev)
    if (n.has(value)) n.delete(value); else n.add(value)
    return n
  })

  const toggleAll = () => {
    const all = filteredValues.map(i => i.value)
    const allSel = all.every(v => selectedValues.has(v))
    setSelectedValues(prev => { const n = new Set(prev); all.forEach(v => allSel ? n.delete(v) : n.add(v)); return n })
  }

  const handleAddApply = () => {
    const visibleSel = filteredValues.filter(i => selectedValues.has(i.value)).map(i => i.value)
    const newSel = isInitialState ? new Set(visibleSel) : new Set([...selectedValues, ...visibleSel])
    setSelectedValues(newSel); setIsInitialState(false); setSearchText('')
  }

  const handleOk = () => {
    const visSel = filteredValues.filter(i => selectedValues.has(i.value)).map(i => i.value)
    const all = searchText ? visSel : Array.from(selectedValues)
    if (all.length === uniqueValues.length) onClearFilter(); else onApplyFilter(all)
    onClose()
  }

  const handleClear = () => {
    setSearchText(''); setSelectedValues(new Set(uniqueValues.map(i => i.value)))
    setIsInitialState(true); onClearFilter(); onClose()
  }

  return (
    <div
      ref={popupRef}
      className="fixed bg-white border border-zinc-200 rounded-lg shadow-xl z-50 filter-popup-container overflow-hidden"
      style={{ top: pos.top, left: pos.left, width: 272, maxHeight: 480, display: 'flex', flexDirection: 'column' }}
    >
      {/* ドラッグヘッダー */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-zinc-800 cursor-move select-none shrink-0"
        onMouseDown={e => {
          if (e.button !== 0) return
          dragging.current = true
          dragOffset.current = { x: e.clientX - pos.left, y: e.clientY - pos.top }
          e.preventDefault()
        }}
      >
        <span className="text-xs font-semibold text-zinc-100 truncate">{columnName}</span>
        <button
          onClick={onClose}
          onMouseDown={e => e.stopPropagation()}
          className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* ソートボタン */}
      <div className="flex gap-1.5 p-2 border-b border-zinc-100 shrink-0">
        <button
          onClick={() => { onSort('asc'); onClose() }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-600 transition-colors"
        >
          <ArrowDownAZ size={14} /><span>昇順</span>
        </button>
        <button
          onClick={() => { onSort('desc'); onClose() }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-600 transition-colors"
        >
          <ArrowDownZA size={14} /><span>降順</span>
        </button>
      </div>

      {/* フィルタ本体 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 検索 */}
        <div className="p-2 border-b border-zinc-100 shrink-0">
          <div className="relative">
            <input
              type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="検索..."
              className="w-full pl-3 pr-8 py-1.5 border border-zinc-200 rounded text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* 値リスト */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 220, minHeight: 120 }}>
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100">
            <input
              type="checkbox"
              checked={filteredValues.length > 0 && filteredValues.every(i => selectedValues.has(i.value))}
              onChange={toggleAll}
              className="w-3.5 h-3.5 accent-indigo-500"
            />
            <span className="text-xs font-medium text-zinc-600">(すべて選択)</span>
          </label>
          {filteredValues.map(item => (
            <label key={item.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 cursor-pointer">
              <input
                type="checkbox" checked={selectedValues.has(item.value)}
                onChange={() => toggle(item.value)}
                className="w-3.5 h-3.5 accent-indigo-500 shrink-0"
              />
              <span className="text-xs text-zinc-700 flex-1 truncate">{item.value || <span className="text-zinc-400 italic">(空白)</span>}</span>
              {item.count > 1 && <span className="text-xs text-zinc-400 shrink-0">({item.count})</span>}
            </label>
          ))}
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100 bg-zinc-50 shrink-0">
        <button
          onClick={handleClear}
          className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors"
        >
          クリア
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={handleAddApply}
            className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition-colors"
          >
            追加
          </button>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleOk}
            className="px-2.5 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
