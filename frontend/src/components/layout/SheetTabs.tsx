import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import type { ShedSheet } from '../../hooks/useShedData'

interface Props {
  sheets: ShedSheet[]
  activeSheetId: string | null
  onSelectSheet: (id: string) => void
  onAddSheet?: ((text: string, name: string) => void) | null
  onRenameSheet?: ((id: string, name: string) => void) | null
  onDeleteSheet?: ((id: string) => void) | null
}

export const SheetTabs = ({ sheets, activeSheetId, onSelectSheet, onAddSheet, onRenameSheet, onDeleteSheet }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) { inputRef.current.focus({ preventScroll: true }); inputRef.current.select() }
  }, [editingId])

  const commitRename = useCallback(() => {
    if (editingId && editName.trim() && onRenameSheet) onRenameSheet(editingId, editName.trim())
    setEditingId(null)
  }, [editingId, editName, onRenameSheet])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAddSheet) return
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let text: string
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
    catch { text = new TextDecoder('shift-jis').decode(bytes) }
    onAddSheet(text, file.name.replace(/\.csv$/i, ''))
    e.target.value = ''
  }, [onAddSheet])

  return (
    <div className="flex items-end bg-slate-300 border-b border-slate-400 px-2 pt-1 gap-px select-none overflow-x-auto shrink-0" style={{ minHeight: 34 }}>
      {sheets.map(sheet => {
        const isActive = sheet.id === activeSheetId
        return (
          <div
            key={sheet.id}
            onClick={() => !editingId && onSelectSheet(sheet.id)}
            onDoubleClick={e => { if (!onRenameSheet) return; e.preventDefault(); setEditingId(sheet.id); setEditName(sheet.name) }}
            onMouseDown={e => { if (editingId === sheet.id && e.target !== inputRef.current) e.preventDefault() }}
            className={[
              'group relative flex items-center gap-1 px-3 text-sm cursor-pointer border border-b-0 rounded-t whitespace-nowrap transition-colors',
              isActive ? 'bg-white text-gray-800 border-slate-400 z-10 shadow-sm' : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-white/70 hover:text-gray-700',
            ].join(' ')}
            style={{ paddingTop: 5, paddingBottom: isActive ? 6 : 5, marginBottom: isActive ? -1 : 0 }}
          >
            {editingId === sheet.id ? (
              <input
                ref={inputRef} value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitRename() } if (e.key === 'Escape') setEditingId(null) }}
                className="w-28 text-sm bg-transparent outline-none border-b border-blue-500"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span>{sheet.name}</span>
            )}
            {sheets.length > 1 && onDeleteSheet && (
              <button
                onClick={e => { e.stopPropagation(); if (window.confirm(`「${sheet.name}」を削除しますか？`)) onDeleteSheet(sheet.id) }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-opacity"
                title="シートを削除"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )
      })}
      {onAddSheet && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-7 h-7 mb-px ml-1 text-slate-500 hover:text-gray-700 hover:bg-slate-200 rounded transition-colors shrink-0"
            title="CSVファイルからシートを追加"
          >
            <Plus size={15} />
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </>
      )}
    </div>
  )
}
