import { FolderOpen, Plus } from 'lucide-react'

interface OpenFile {
  path: string
  isActive: boolean
}

interface Props {
  openFiles: OpenFile[]
  onSwitch: (path: string) => void
  onClose: (path: string) => void
  onOpen: () => void
  onNew: () => void
}

function basename(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path
}

export const FileTabBar = ({ openFiles, onSwitch, onClose, onOpen, onNew }: Props) => (
  <div className="bg-zinc-800 flex items-end px-2 pt-1 gap-0.5 shrink-0 overflow-x-auto">
    <button
      onClick={onOpen}
      title="ファイルを開く"
      onMouseDown={e => e.preventDefault()}
      className="mb-1 h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors shrink-0 self-center"
    >
      <FolderOpen size={13} />
    </button>
    <div className="w-px h-4 bg-zinc-700 mx-1 self-center shrink-0" />

    {openFiles.map(f => {
      const unsaved = f.path.startsWith('__unsaved__')
      const label = unsaved ? '(未保存)' : basename(f.path)
      return (
        <div
          key={f.path}
          title={f.path}
          onClick={() => !f.isActive && onSwitch(f.path)}
          className={[
            'group flex items-center gap-1 h-8 px-3 text-xs shrink-0 max-w-[200px] rounded-t transition-colors',
            f.isActive
              ? 'bg-zinc-50 text-zinc-900 cursor-default'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 cursor-pointer',
          ].join(' ')}
        >
          <span className={`truncate ${unsaved ? 'italic text-amber-500' : ''}`}>{label}</span>
          <button
            title="閉じる"
            onClick={e => { e.stopPropagation(); onClose(f.path) }}
            onMouseDown={e => e.preventDefault()}
            className={[
              'w-4 h-4 flex items-center justify-center rounded leading-none shrink-0 transition-colors',
              'hover:bg-red-200 hover:text-red-600',
              f.isActive
                ? 'text-zinc-400 opacity-60 hover:opacity-100'
                : 'opacity-0 group-hover:opacity-60 hover:!opacity-100',
            ].join(' ')}
          >×</button>
        </div>
      )
    })}

    <button
      onClick={onNew}
      title="新規作成"
      onMouseDown={e => e.preventDefault()}
      className="mb-1 h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors shrink-0 self-center"
    >
      <Plus size={13} />
    </button>
  </div>
)
