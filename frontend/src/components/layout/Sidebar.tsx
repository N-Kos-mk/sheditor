interface Props {
  headers: string[]
  visibleColumns: Record<string, boolean>
  onToggleColumn: (col: string) => void
  width: number
}

export const Sidebar = ({ headers, visibleColumns, onToggleColumn, width }: Props) => (
  <aside
    className="bg-zinc-50 border-r border-zinc-200 flex flex-col overflow-hidden shrink-0"
    style={{ width, minWidth: width }}
  >
    <div className="px-4 py-2.5 border-b border-zinc-200 shrink-0">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">列の表示</span>
    </div>
    <div className="flex-1 overflow-y-auto py-1">
      {headers.map(header => {
        const isAC = header.startsWith('AC_')
        return (
          <label
            key={header}
            className="flex items-center gap-2.5 px-4 py-1.5 cursor-pointer hover:bg-zinc-100 transition-colors"
          >
            <input
              type="checkbox"
              checked={visibleColumns[header] || false}
              onChange={() => onToggleColumn(header)}
              className="w-3.5 h-3.5 flex-shrink-0 accent-indigo-500"
            />
            <span className={`text-xs overflow-hidden whitespace-nowrap ${isAC ? 'text-sky-600 font-medium' : 'text-zinc-700'}`}>
              {header}
            </span>
          </label>
        )
      })}
    </div>
  </aside>
)
