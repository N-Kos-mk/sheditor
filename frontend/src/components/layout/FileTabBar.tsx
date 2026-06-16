interface OpenFile {
  path: string
  isActive: boolean
}

interface Props {
  openFiles: OpenFile[]
  onSwitch: (path: string) => void
  onClose: (path: string) => void
}

function basename(path: string): string {
  return path.split(/[\\/]/).at(-1) ?? path
}

export const FileTabBar = ({ openFiles, onSwitch, onClose }: Props) => {
  if (openFiles.length === 0) return null
  return (
    <div className="bg-zinc-800 flex items-end px-2 pt-1 gap-0.5 shrink-0 overflow-x-auto">
      {openFiles.map(f => (
        <div
          key={f.path}
          title={f.path}
          onClick={() => !f.isActive && onSwitch(f.path)}
          className={[
            'group flex items-center gap-1.5 h-8 px-3 text-xs shrink-0 max-w-[200px] rounded-t transition-colors',
            f.isActive
              ? 'bg-zinc-50 text-zinc-900 cursor-default'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 cursor-pointer',
          ].join(' ')}
        >
          <span className="truncate">{basename(f.path)}</span>
          <button
            title="閉じる"
            onClick={e => { e.stopPropagation(); onClose(f.path) }}
            className={[
              'w-4 h-4 flex items-center justify-center rounded leading-none shrink-0 transition-colors',
              'hover:bg-red-200 hover:text-red-600',
              f.isActive
                ? 'text-zinc-400 opacity-50 hover:opacity-100'
                : 'opacity-0 group-hover:opacity-60 hover:!opacity-100',
            ].join(' ')}
          >×</button>
        </div>
      ))}
    </div>
  )
}
