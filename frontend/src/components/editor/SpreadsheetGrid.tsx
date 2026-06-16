import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Cell } from './Cell'
import { ChevronDown } from 'lucide-react'
import { ColumnFilterPopup } from './ColumnFilterPopup'
import type { ShedRow } from '../../hooks/useShedData'

const HEADER_HEIGHT = 34
const ROW_NUM_WIDTH = 52
const BORDER = { top: '1px solid #e4e4e7', right: '1px solid #e4e4e7', bottom: '1px solid #e4e4e7', left: '1px solid #e4e4e7' }
const SEL_COLOR = '#6366f1'

interface CopyBounds { minRow: number; maxRow: number; minCol: number; maxCol: number }
interface FilterPopup { columnName: string; position: { top: number; left: number } }

interface Props {
  data: ShedRow[]
  originalData: ShedRow[]
  headers: string[]
  visibleColumns: Record<string, boolean>
  columnWidths: Record<string, number>
  setColumnWidth: (col: string, w: number) => void
  rowHeights: Record<number, number>
  setRowHeight: (id: number, h: number) => void
  selectedCells: Set<string>
  selectionStart: string | null
  copiedCells: Set<string>
  copyBounds: CopyBounds | null
  editingCell: string | null
  editValue: string
  filters: Record<string, string[]>
  hasFilter: (col: string) => boolean
  onApplyFilter: (col: string, values: string[]) => void
  onClearFilter: (col: string) => void
  onSort: (col: string, dir: string) => void
  onEditValueChange: (v: string) => void
  onCellClick: (key: string, e: React.MouseEvent, clickX: number) => void
  onUpdateCell: (rowId: number, col: string, val: string) => void
  onCellMouseDown: (key: string, e: React.MouseEvent) => void
  onCellMouseEnter: (key: string) => void
  onCellMouseUp: (key: string) => void
  onGridClick: (e: React.MouseEvent) => void
  onStartEdit: (init?: string, pos?: number) => void
  onCancelEdit: () => void
  onHiddenInputFocus: () => void
  onSelectRow: (id: number) => void
  onSelectColumn: (col: string) => void
}

export const SpreadsheetGrid = ({
  data, originalData, headers, visibleColumns, columnWidths, setColumnWidth,
  rowHeights, setRowHeight, selectedCells, selectionStart, copiedCells, copyBounds,
  editingCell, editValue, filters, hasFilter, onApplyFilter, onClearFilter, onSort,
  onEditValueChange, onCellClick, onUpdateCell, onCellMouseDown, onCellMouseEnter,
  onCellMouseUp, onGridClick, onStartEdit, onCancelEdit, onHiddenInputFocus,
  onSelectRow, onSelectColumn,
}: Props) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [filterPopup, setFilterPopup] = useState<FilterPopup | null>(null)

  const visibleHeaders = useMemo(() => headers.filter(h => visibleColumns[h]), [headers, visibleColumns])

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback((i: number) => rowHeights[data[i]?.id] ?? 30, [rowHeights, data]),
    overscan: 25,
  })
  const colVirtualizer = useVirtualizer({
    count: visibleHeaders.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback((i: number) => columnWidths[visibleHeaders[i]] || 150, [columnWidths, visibleHeaders]),
    overscan: 5,
    horizontal: true,
  })

  useEffect(() => { colVirtualizer.measure() }, [columnWidths]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { rowVirtualizer.measure() }, [rowHeights]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editingCell && hiddenInputRef.current)
      setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 0)
  }, [selectionStart, editingCell])
  useEffect(() => { hiddenInputRef.current?.focus({ preventScroll: true }) }, [])

  const rowIndexById = useMemo(() => {
    const m: Record<string, number> = {}
    data.forEach((r, i) => { m[String(r.id)] = i })
    return m
  }, [data])

  const selectionBounds = useMemo(() => {
    if (selectedCells.size === 0) return null
    const positions = Array.from(selectedCells).map(key => {
      const dash = key.indexOf('-')
      return { row: rowIndexById[key.slice(0, dash)], col: visibleHeaders.indexOf(key.slice(dash + 1)) }
    }).filter(p => p.row !== undefined && p.col >= 0)
    if (!positions.length) return null
    return {
      minRow: Math.min(...positions.map(p => p.row)),
      maxRow: Math.max(...positions.map(p => p.row)),
      minCol: Math.min(...positions.map(p => p.col)),
      maxCol: Math.max(...positions.map(p => p.col)),
    }
  }, [selectedCells, visibleHeaders, rowIndexById])

  const getCellBorderStyle = useCallback((rowId: number, colIndex: number) => {
    const cellKey = `${rowId}-${visibleHeaders[colIndex]}`
    if (!selectedCells.has(cellKey)) return BORDER
    if (!selectionBounds) return BORDER
    const rowIdx = rowIndexById[String(rowId)]
    if (rowIdx === undefined) return BORDER
    const { minRow, maxRow, minCol, maxCol } = selectionBounds
    return {
      top: rowIdx === minRow ? `2px solid ${SEL_COLOR}` : '1px solid #e4e4e7',
      right: colIndex === maxCol ? `2px solid ${SEL_COLOR}` : '1px solid #e4e4e7',
      bottom: rowIdx === maxRow ? `2px solid ${SEL_COLOR}` : '1px solid #e4e4e7',
      left: colIndex === minCol ? `2px solid ${SEL_COLOR}` : '1px solid #e4e4e7',
    }
  }, [selectedCells, selectionBounds, visibleHeaders, rowIndexById])

  const getCopyBorder = useCallback((rowId: number, colIndex: number) => {
    const cellKey = `${rowId}-${visibleHeaders[colIndex]}`
    if (!copiedCells.has(cellKey) || !copyBounds) return null
    const { minRow, maxRow, minCol, maxCol } = copyBounds
    return { top: rowId === minRow, bottom: rowId === maxRow, left: colIndex === minCol, right: colIndex === maxCol }
  }, [copiedCells, copyBounds, visibleHeaders])

  const totalRowSize = rowVirtualizer.getTotalSize()
  const totalColSize = colVirtualizer.getTotalSize()

  return (
    <div className="flex-1 overflow-auto bg-white" onClick={onGridClick} ref={scrollRef} style={{ position: 'relative' }}>
      <input
        ref={hiddenInputRef} type="text"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0, zIndex: -1 }}
        onInput={e => {
          const v = (e.target as HTMLInputElement).value
          if (v && selectionStart && !editingCell) { onStartEdit(v); (e.target as HTMLInputElement).value = '' }
        }}
        onCompositionStart={() => { if (selectionStart && !editingCell) onStartEdit('') }}
        onCompositionEnd={e => {
          const v = (e.target as HTMLInputElement).value
          if (v && selectionStart && !editingCell) { onStartEdit(v); (e.target as HTMLInputElement).value = '' }
        }}
        onBlur={() => {
          if (!editingCell && hiddenInputRef.current) setTimeout(() => {
            const active = document.activeElement
            if (active && active !== document.body && active !== hiddenInputRef.current) {
              const tag = (active as HTMLElement).tagName
              if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (active as HTMLElement).isContentEditable) return
            }
            if ((active as HTMLElement)?.closest('.formula-bar-container') || (active as HTMLElement)?.closest('.filter-popup-container')) return
            hiddenInputRef.current?.focus({ preventScroll: true })
          }, 0)
        }}
        onFocus={onHiddenInputFocus}
        disabled={editingCell !== null}
      />

      <div style={{ width: ROW_NUM_WIDTH + totalColSize, height: HEADER_HEIGHT + totalRowSize, position: 'relative' }}>
        {/* ヘッダー行 */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, height: HEADER_HEIGHT, width: '100%' }}>
          {/* 左上角 */}
          <div
            className="border-b border-r border-zinc-300 text-xs font-medium text-zinc-400 flex items-center justify-center"
            style={{ position: 'sticky', left: 0, top: 0, width: ROW_NUM_WIDTH, height: HEADER_HEIGHT, zIndex: 20, display: 'inline-flex', backgroundColor: '#f4f4f5' }}
          >
            #
          </div>
          <div style={{ position: 'absolute', top: 0, left: ROW_NUM_WIDTH, height: HEADER_HEIGHT, width: totalColSize }}>
            {colVirtualizer.getVirtualItems().map(vc => {
              const header = visibleHeaders[vc.index]
              const width = columnWidths[header] || 150
              const filtered = hasFilter(header)
              const isAC = header.startsWith('AC_')
              return (
                <div
                  key={vc.key}
                  className="border-b border-r border-zinc-300 text-xs font-semibold relative cursor-pointer select-none overflow-hidden group"
                  style={{
                    position: 'absolute', left: vc.start, top: 0, width, height: HEADER_HEIGHT,
                    paddingLeft: 8, paddingRight: 28, display: 'flex', alignItems: 'center',
                    backgroundColor: isAC ? '#e0f2fe' : '#f4f4f5',
                    color: isAC ? '#0369a1' : '#52525b',
                  }}
                  onClick={() => onSelectColumn(header)}
                >
                  <span className="truncate">{header}</span>
                  {/* フィルタボタン */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      const rect = e.currentTarget.getBoundingClientRect()
                      setFilterPopup({ columnName: header, position: { top: rect.bottom + 4, left: rect.left } })
                    }}
                    className={[
                      'absolute top-1/2 -translate-y-1/2 right-1.5 w-5 h-5 flex items-center justify-center rounded transition-colors',
                      filtered
                        ? 'text-indigo-600 bg-indigo-100 opacity-100'
                        : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-600',
                    ].join(' ')}
                    style={{ minWidth: 20 }}
                  >
                    <ChevronDown size={12} />
                  </button>
                  {/* 列幅リサイズハンドル */}
                  <div
                    className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400 hover:opacity-60"
                    onMouseDown={e => {
                      e.preventDefault(); e.stopPropagation()
                      const startX = e.clientX; const startW = columnWidths[header] || 150
                      const onMove = (e: MouseEvent) => setColumnWidth(header, Math.max(40, startW + e.clientX - startX))
                      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* データ行 */}
        <div style={{ position: 'absolute', top: HEADER_HEIGHT, left: 0, width: '100%', height: totalRowSize }}>
          {rowVirtualizer.getVirtualItems().map(vr => {
            const row = data[vr.index]
            if (!row) return null
            const rowH = rowHeights[row.id] || 30
            return (
              <div key={vr.key} style={{ position: 'absolute', top: vr.start, left: 0, width: ROW_NUM_WIDTH + totalColSize, height: rowH, willChange: 'transform' }}>
                {/* 行番号 */}
                <div
                  className="border-b border-r border-zinc-200 text-xs text-zinc-400 font-medium flex items-center justify-center relative cursor-pointer select-none hover:bg-zinc-100 transition-colors"
                  style={{ position: 'sticky', left: 0, width: ROW_NUM_WIDTH, height: rowH, zIndex: 5, display: 'inline-flex', backgroundColor: '#fafafa' }}
                  onClick={() => onSelectRow(row.id)}
                >
                  {vr.index + 1}
                  {/* 行高さリサイズハンドル */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-indigo-400 hover:opacity-60"
                    onMouseDown={e => {
                      e.preventDefault(); e.stopPropagation()
                      const startY = e.clientY; const startH = rowHeights[row.id] || 30
                      const onMove = (e: MouseEvent) => setRowHeight(row.id, Math.max(20, startH + e.clientY - startY))
                      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {/* セル群 */}
                <div style={{ position: 'absolute', top: 0, left: ROW_NUM_WIDTH, width: totalColSize, height: rowH }}>
                  {colVirtualizer.getVirtualItems().map(vc => {
                    const header = visibleHeaders[vc.index]
                    const cellKey = `${row.id}-${header}`
                    const width = columnWidths[header] || 150
                    return (
                      <div key={vc.key} style={{ position: 'absolute', left: vc.start, top: 0, width, height: rowH }}>
                        <Cell
                          cellKey={cellKey} rowId={row.id} columnName={header}
                          value={String(row[header] ?? '')}
                          isSelected={selectedCells.has(cellKey)}
                          isSelectionStart={cellKey === selectionStart}
                          isCopied={copiedCells.has(cellKey)}
                          isEditing={cellKey === editingCell}
                          editValue={editValue}
                          width={width} height={rowH}
                          onEditValueChange={onEditValueChange}
                          showCopyBorder={getCopyBorder(row.id, vc.index)}
                          borderStyle={getCellBorderStyle(row.id, vc.index)}
                          onUpdate={onUpdateCell}
                          onCellClick={onCellClick}
                          onCellMouseDown={onCellMouseDown}
                          onCellMouseEnter={onCellMouseEnter}
                          onCellMouseUp={onCellMouseUp}
                          onStartEdit={onStartEdit}
                          onCancelEdit={onCancelEdit}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {filterPopup && (
        <ColumnFilterPopup
          columnName={filterPopup.columnName}
          data={originalData || data}
          displayData={data}
          currentFilter={filters[filterPopup.columnName]}
          onApplyFilter={values => onApplyFilter(filterPopup.columnName, values)}
          onClearFilter={() => onClearFilter(filterPopup.columnName)}
          onSort={dir => onSort(filterPopup.columnName, dir)}
          onClose={() => setFilterPopup(null)}
          position={filterPopup.position}
        />
      )}
    </div>
  )
}
