import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  Copy, ClipboardPaste, Trash2,
  ChevronLeft, ChevronRight, ChevronDown,
  Download, Loader2, FolderOpen, FilePlus,
} from 'lucide-react'

interface Step { label: string; columns: string[] }

const ToolBtn = ({ onClick, title, disabled, children }: { onClick?: () => void; title?: string; disabled?: boolean; children: ReactNode }) => (
  <button
    onMouseDown={e => e.preventDefault()} onClick={onClick} disabled={disabled} title={title}
    className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
  >{children}</button>
)

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-0.5 shrink-0" />

const StepDropdown = ({ steps = [], workingIndex, specialSelected, onSelectWorking, onSelectSpecial, disabled = false }:
  { steps?: Step[]; workingIndex: number; specialSelected: string | null; onSelectWorking: (i: number) => void; onSelectSpecial: (k: 'all' | 'none') => void; disabled?: boolean }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const label = disabled ? '' : specialSelected === 'all' ? '全表示' : specialSelected === 'none' ? '全非表示' : (steps[workingIndex]?.label ?? '—')
  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={e => e.preventDefault()} onClick={() => !disabled && setOpen(v => !v)} disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ minWidth: 90 }}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 top-full mt-0.5 z-50 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[130px]">
          <button onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onSelectSpecial('all') }} className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${specialSelected === 'all' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>全表示</button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onSelectSpecial('none') }} className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${specialSelected === 'none' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>全非表示</button>
          {steps.length > 0 && <div className="my-1 border-t border-gray-200" />}
          {steps.map((step, i) => (
            <button key={step.label} onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onSelectWorking(i) }}
              className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${!specialSelected && i === workingIndex ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'}`}
            >{step.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  hasFile: boolean
  onOpenFile: () => void
  onNewFile: () => void
  onCopy: () => void
  onPaste: () => void
  onDelete: () => void
  onDownload: () => void
  isDownloading?: boolean
  steps?: Step[]
  workingIndex?: number
  specialSelected?: string | null
  onApplyWorking?: (i: number) => void
  onApplySpecial?: (k: 'all' | 'none') => void
  stepsReady?: boolean
}

export const Toolbar = ({
  hasFile, onOpenFile, onNewFile,
  onCopy, onPaste, onDelete, onDownload, isDownloading = false,
  steps = [], workingIndex = 0, specialSelected = null,
  onApplyWorking = () => {}, onApplySpecial = () => {}, stepsReady = true,
}: Props) => {
  const canPrev = !specialSelected && workingIndex > 0 && steps.length > 0
  const canNext = !specialSelected && workingIndex < steps.length - 1 && steps.length > 0
  return (
    <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center gap-0.5 flex-wrap min-h-[34px]">
      <ToolBtn title="ファイルを開く" onClick={onOpenFile}><FolderOpen size={16} className="text-blue-500" /></ToolBtn>
      <ToolBtn title="新規作成" onClick={onNewFile}><FilePlus size={16} className="text-violet-500" /></ToolBtn>
      <ToolBtn title="CSVダウンロード" onClick={onDownload} disabled={!hasFile || isDownloading}>
        {isDownloading ? <Loader2 size={16} className="text-green-600 animate-spin" /> : <Download size={16} className="text-green-600" />}
      </ToolBtn>
      <Divider />
      <ToolBtn title="コピー (Ctrl+C)" onClick={onCopy} disabled={!hasFile}><Copy size={16} className="text-gray-600" /></ToolBtn>
      <ToolBtn title="貼り付け (Ctrl+V)" onClick={onPaste} disabled={!hasFile}><ClipboardPaste size={16} className="text-gray-600" /></ToolBtn>
      <ToolBtn title="削除 (Delete)" onClick={onDelete} disabled={!hasFile}><Trash2 size={16} className="text-gray-600" /></ToolBtn>
      <Divider />
      <div className="flex items-center gap-0.5">
        <ToolBtn title="前のステップ" onClick={() => onApplyWorking(workingIndex - 1)} disabled={!canPrev}><ChevronLeft size={15} className="text-gray-600" /></ToolBtn>
        <StepDropdown steps={steps} workingIndex={workingIndex} specialSelected={specialSelected} onSelectWorking={onApplyWorking} onSelectSpecial={onApplySpecial} disabled={!stepsReady || !hasFile} />
        <ToolBtn title="次のステップ" onClick={() => onApplyWorking(workingIndex + 1)} disabled={!canNext}><ChevronRight size={15} className="text-gray-600" /></ToolBtn>
      </div>
    </div>
  )
}
