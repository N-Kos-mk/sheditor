interface Props {
  headers: string[]
  visibleColumns: Record<string, boolean>
  onToggleColumn: (col: string) => void
  width: number
}

export const Sidebar = ({ headers, visibleColumns, onToggleColumn, width }: Props) => (
  <aside
    className="bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto shrink-0"
    style={{ width, minWidth: width }}
  >
    <h2 className="text-sm font-semibold text-gray-700 mb-3">列の表示/非表示</h2>
    <div className="space-y-2">
      {headers.map(header => (
        <label key={header} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
          <input
            type="checkbox"
            checked={visibleColumns[header] || false}
            onChange={() => onToggleColumn(header)}
            className="w-4 h-4 flex-shrink-0"
          />
          <span className={`text-sm overflow-hidden whitespace-nowrap ${header.startsWith('AC_') ? 'text-blue-600' : 'text-gray-700'}`}>
            {header}
          </span>
        </label>
      ))}
    </div>
  </aside>
)
