import { useState, useRef, useEffect, type ReactNode } from 'react'
import {
  Copy, ClipboardPaste, Trash2,
  ChevronLeft, ChevronRight, ChevronDown,
  Download, Loader2,
} from 'lucide-react'

interface Step { label: string; columns: string[] }

const Btn = ({ onClick, title, disabled, children }: {
  onClick?: () => void; title?: string; disabled?: boolean; children: ReactNode
}) => (
  <button
    onMouseDown={e => e.preventDefault()} onClick={onClick} disabled={disabled} title={title}
    className="h-7 w-7 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-500"
  >{children}</button>
)

const Divider = () => <div className="w-px h-4 bg-zinc-200 mx-1 shrink-0" />

const StepDropdown = ({ steps = [], workingIndex, specialSelected, onSelectWorking, onSelectSpecial, disabled = false }: {
  steps?: Step[]; workingIndex: number; specialSelected: string | null
  onSelectWorking: (i: number) => void; onSelectSpecial: (k: 'all' | 'none') => void; disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const label = disabled ? '—'
    : specialSelected === 'all' ? '全表示'
    : specialSelected === 'none' ? '全非表示'
    : (steps[workingIndex]?.label ?? '—')

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className="flex items-center gap-1 h-7 px-2.5 text-xs border border-zinc-200 rounded bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 select-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ minWidth: 96 }}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={11} className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-zinc-200 rounded-md shadow-lg py-1 min-w-[140px]">
          <button onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onSelectSpecial('all') }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 ${specialSelected === 'all' ? 'text-indigo-600 font-semibold' : 'text-zinc-600'}`}>
            全表示
          </button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onSelectSpecial('none') }}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 ${specialSelected === 'none' ? 'text-indigo-600 font-semibold' : 'text-zinc-600'}`}>
            全非表示
          </button>
          {steps.length > 0 && <div className="my-1 border-t border-zinc-100" />}
          {steps.map((step, i) => (
            <button key={step.label} onMouseDown={e => e.preventDefault()}
              onClick={() => { setOpen(false); onSelectWorking(i) }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 ${!specialSelected && i === workingIndex ? 'text-indigo-600 font-semibold' : 'text-zinc-700'}`}>
              {step.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  hasFile: boolean
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
  hasFile,
  onCopy, onPaste, onDelete, onDownload, isDownloading = false,
  steps = [], workingIndex = 0, specialSelected = null,
  onApplyWorking = () => {}, onApplySpecial = () => {}, stepsReady = true,
}: Props) => {
  const canPrev = !specialSelected && workingIndex > 0 && steps.length > 0
  const canNext = !specialSelected && workingIndex < steps.length - 1 && steps.length > 0
  return (
    <div className="h-9 bg-white border-b border-zinc-200 px-2 flex items-center gap-0.5 shrink-0">
      <Btn title="CSVダウンロード" onClick={onDownload} disabled={!hasFile || isDownloading}>
        {isDownloading
          ? <Loader2 size={15} className="text-emerald-500 animate-spin" />
          : <Download size={15} className="text-emerald-500" />}
      </Btn>
      <Divider />
      <Btn title="コピー (Ctrl+C)" onClick={onCopy} disabled={!hasFile}><Copy size={15} /></Btn>
      <Btn title="貼り付け (Ctrl+V)" onClick={onPaste} disabled={!hasFile}><ClipboardPaste size={15} /></Btn>
      <Btn title="削除 (Delete)" onClick={onDelete} disabled={!hasFile}><Trash2 size={15} /></Btn>
      <Divider />
      <div className="flex items-center gap-0.5">
        <Btn title="前のステップ" onClick={() => onApplyWorking(workingIndex - 1)} disabled={!canPrev}><ChevronLeft size={14} /></Btn>
        <StepDropdown
          steps={steps} workingIndex={workingIndex} specialSelected={specialSelected}
          onSelectWorking={onApplyWorking} onSelectSpecial={onApplySpecial}
          disabled={!stepsReady || !hasFile}
        />
        <Btn title="次のステップ" onClick={() => onApplyWorking(workingIndex + 1)} disabled={!canNext}><ChevronRight size={14} /></Btn>
      </div>
    </div>
  )
}
