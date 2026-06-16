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
    if (editingId && inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
      inputRef.current.select()
    }
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
    <div className="bg-white border-b border-zinc-200 flex items-stretch px-2 gap-0 shrink-0 overflow-x-auto select-none" style={{ minHeight: 35 }}>
      {sheets.map(sheet => {
        const isActive = sheet.id === activeSheetId
        return (
          <div
            key={sheet.id}
            onClick={() => !editingId && onSelectSheet(sheet.id)}
            onDoubleClick={e => {
              if (!onRenameSheet) return
              e.preventDefault()
              setEditingId(sheet.id); setEditName(sheet.name)
            }}
            onMouseDown={e => { if (editingId === sheet.id && e.target !== inputRef.current) e.preventDefault() }}
            className={[
              'group flex items-center gap-1.5 px-3 cursor-pointer text-xs whitespace-nowrap transition-colors border-b-2',
              isActive
                ? 'border-indigo-500 text-indigo-600 font-medium'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300',
            ].join(' ')}
          >
            {editingId === sheet.id ? (
              <input
                ref={inputRef} value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="w-24 text-xs bg-transparent outline-none border-b border-indigo-400"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span>{sheet.name}</span>
            )}
            {sheets.length > 1 && onDeleteSheet && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (window.confirm(`「${sheet.name}」を削除しますか？`)) onDeleteSheet(sheet.id)
                }}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-opacity"
                title="シートを削除"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )
      })}
      {onAddSheet && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-1 my-auto flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors shrink-0"
            title="CSVファイルからシートを追加"
          >
            <Plus size={13} />
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </>
      )}
    </div>
  )
}
