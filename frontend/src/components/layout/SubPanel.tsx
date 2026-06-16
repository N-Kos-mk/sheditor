import { useMemo } from 'react'
import type { ShedRow } from '../../hooks/useShedData'

const AC_PREFIX = 'AC_'

interface Props {
  data: ShedRow[]
  selectedCells: Set<string>
  width: number
}

export const SubPanel = ({ data, selectedCells, width }: Props) => {
  const selectedRow = useMemo(() => {
    if (selectedCells.size === 0) return null
    const firstKey = Array.from(selectedCells)[0]
    const rowId = parseInt(firstKey.split('-')[0])
    return data.find(r => r.id === rowId) ?? null
  }, [selectedCells, data])

  const acFields = useMemo(() => {
    if (!selectedRow) return []
    return Object.keys(selectedRow).filter(k => k.startsWith(AC_PREFIX))
  }, [selectedRow])

  return (
    <aside
      className="bg-zinc-50 border-l border-zinc-200 flex flex-col overflow-hidden shrink-0"
      style={{ width, minWidth: width }}
    >
      <div className="px-4 py-2.5 border-b border-zinc-200 shrink-0">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">詳細</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {!selectedRow ? (
          <p className="text-xs text-zinc-400 mt-2">セルを選択してください</p>
        ) : acFields.length === 0 ? (
          <p className="text-xs text-zinc-400 mt-2">AC_* 列がありません</p>
        ) : (
          <div className="space-y-3">
            {acFields.map(field => (
              <div key={field}>
                <div className="text-xs font-medium text-sky-600 mb-1">{field}</div>
                <div className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded px-2.5 py-2 min-h-7 whitespace-pre-wrap break-all leading-relaxed">
                  {String(selectedRow[field] ?? '') || <span className="text-zinc-300">(空)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
