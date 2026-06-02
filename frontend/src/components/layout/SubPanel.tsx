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
      className="bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto shrink-0"
      style={{ width, minWidth: width }}
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-3">選択行の詳細</h2>
      {!selectedRow ? (
        <p className="text-xs text-gray-400">セルを選択してください</p>
      ) : (
        <div className="space-y-3">
          {acFields.map(field => (
            <div key={field}>
              <div className="text-xs font-medium text-blue-600 mb-1">{field}</div>
              <div className="text-sm text-gray-700 bg-white border border-blue-100 rounded px-2 py-1.5 min-h-8 whitespace-pre-wrap break-all">
                {String(selectedRow[field] ?? '')}
              </div>
            </div>
          ))}
          {acFields.length === 0 && (
            <p className="text-xs text-gray-400">AC_* 列がありません</p>
          )}
        </div>
      )}
    </aside>
  )
}
