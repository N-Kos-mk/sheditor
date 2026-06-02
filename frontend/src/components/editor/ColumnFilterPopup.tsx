import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowDownAZ, ArrowDownZA, Search, FunnelX, X } from 'lucide-react'
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
    const onMove = (e: MouseEvent) => { if (!dragging.current) return; setPos({ top: e.clientY - dragOffset.current.y, left: e.clientX - dragOffset.current.x }) }
    const onUp = () => { dragging.current = false }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const toggle = (value: string) => setSelectedValues(prev => { const n = new Set(prev); if (n.has(value)) n.delete(value); else n.add(value); return n })
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
  const handleClear = () => { setSearchText(''); setSelectedValues(new Set(uniqueValues.map(i => i.value))); setIsInitialState(true); onClearFilter(); onClose() }

  return (
    <div ref={popupRef} className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 filter-popup-container"
      style={{ top: pos.top, left: pos.left, width: 280, maxHeight: 500, display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-slate-200 rounded-t-lg cursor-move select-none"
        onMouseDown={e => { if (e.button !== 0) return; dragging.current = true; dragOffset.current = { x: e.clientX - pos.left, y: e.clientY - pos.top }; e.preventDefault() }}>
        <span className="text-sm font-semibold text-slate-700">{columnName}</span>
        <button onClick={onClose} onMouseDown={e => e.stopPropagation()} className="p-1 hover:bg-slate-300 rounded"><X size={16} className="text-slate-600" /></button>
      </div>
      <div className="flex gap-2 p-2 border-b border-gray-200">
        <button onClick={() => { onSort('asc'); onClose() }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-sm"><ArrowDownAZ size={16} /><span>昇順</span></button>
        <button onClick={() => { onSort('desc'); onClose() }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-sm"><ArrowDownZA size={16} /><span>降順</span></button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">値フィルタ</span>
          <button onClick={handleClear} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-600"><FunnelX size={14} /><span>クリア</span></button>
        </div>
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="検索..."
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" />
            <Search size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 250, minHeight: 250 }}>
          <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" checked={filteredValues.length > 0 && filteredValues.every(i => selectedValues.has(i.value))} onChange={toggleAll} className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">(すべて選択)</span>
          </label>
          {filteredValues.map(item => (
            <label key={item.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" checked={selectedValues.has(item.value)} onChange={() => toggle(item.value)} className="w-4 h-4" />
              <span className="text-sm text-gray-700 flex-1 truncate">{item.value || '(空白)'}</span>
              {item.count > 1 && <span className="text-xs text-gray-400">({item.count})</span>}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between p-2 border-t border-gray-200">
        <button onClick={handleAddApply} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium">追加適用</button>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm">キャンセル</button>
          <button onClick={handleOk} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">OK</button>
        </div>
      </div>
    </div>
  )
}
