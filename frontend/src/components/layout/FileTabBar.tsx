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
    <div className="bg-gray-100 border-b border-gray-200 flex items-end px-2 pt-1 gap-0.5 overflow-x-auto shrink-0">
      {openFiles.map(f => (
        <div
          key={f.path}
          title={f.path}
          onClick={() => !f.isActive && onSwitch(f.path)}
          className={[
            'flex items-center gap-1 px-3 py-1.5 text-xs rounded-t border border-b-0 select-none group shrink-0 max-w-[200px]',
            f.isActive
              ? 'bg-white border-gray-300 text-gray-800 font-medium shadow-sm cursor-default'
              : 'bg-gray-200 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 cursor-pointer',
          ].join(' ')}
        >
          <span className="truncate">{basename(f.path)}</span>
          <button
            title="閉じる"
            onClick={e => { e.stopPropagation(); onClose(f.path) }}
            className={[
              'ml-0.5 w-4 h-4 flex items-center justify-center rounded leading-none shrink-0',
              'hover:bg-red-100 hover:text-red-500',
              f.isActive ? 'text-gray-400 opacity-50 hover:opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-60 hover:!opacity-100',
            ].join(' ')}
          >×</button>
        </div>
      ))}
    </div>
  )
}
