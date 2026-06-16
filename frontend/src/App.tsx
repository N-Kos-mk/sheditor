import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useShedData } from './hooks/useShedData'
import { useSelection } from './hooks/useSelection'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import { useClipboard } from './hooks/useClipboard'
import { usePanelResize } from './hooks/usePanelResize'
import { useColumnWidth } from './hooks/useColumnWidth'
import { useRowHeight } from './hooks/useRowHeight'
import { useColumnFilter } from './hooks/useColumnFilter'
import { useStepState } from './hooks/useStepState'
import { MainHeader } from './components/layout/MainHeader'
import { FileTabBar } from './components/layout/FileTabBar'
import { Toolbar } from './components/layout/Toolbar'
import { FormulaBar } from './components/layout/FormulaBar'
import { Sidebar } from './components/layout/Sidebar'
import { SubPanel } from './components/layout/SubPanel'
import { SheetTabs } from './components/layout/SheetTabs'
import { StatusBar } from './components/layout/StatusBar'
import { SpreadsheetGrid } from './components/editor/SpreadsheetGrid'
import { ResizeHandle } from './components/ResizeHandle'

const AC_PREFIX = 'AC_'

// config は将来 pywebview API から取得する。現時点はデフォルト値。
const DEFAULT_CONFIG = { keyField: '', keyFieldCopyLabel: 'コピー', steps: [] as { label: string; columns: string[] }[] }

function App() {
  const [bridgeReady, setBridgeReady] = useState(false)
  const [openFiles, setOpenFiles] = useState<{ path: string; isActive: boolean }[]>([])
  const [status, setStatus] = useState('接続中...')
  const [isDownloading, setIsDownloading] = useState(false)

  const activeFilePath = openFiles.find(f => f.isActive)?.path ?? null
  const isUnsaved = activeFilePath?.startsWith('__unsaved__') ?? false

  // pywebview ブリッジ接続待ち
  useEffect(() => {
    const onReady = () => { setBridgeReady(true); setStatus('') }
    if (window.pywebview) { onReady() }
    else {
      window.addEventListener('pywebviewready', onReady)
      const t = setTimeout(() => setStatus('ブラウザ開発モード'), 1000)
      return () => { window.removeEventListener('pywebviewready', onReady); clearTimeout(t) }
    }
  }, [])

  const { sheets, activeSheetId, setActiveSheetId, data, headers, loading, loadAllSheets, updateCell, updateMultipleCells, deleteCells, addSheet, renameSheet, deleteSheet } = useShedData(bridgeReady)

  // 起動時にバックエンドの開いているファイル一覧と同期（パス付き起動対応）
  useEffect(() => {
    if (!bridgeReady || !window.pywebview) return
    window.pywebview.api.get_open_files().then(files => {
      if (files.length > 0) {
        setOpenFiles(files.map(f => ({ path: f.path, isActive: f.is_active })))
      }
    })
  }, [bridgeReady])

  const activeSheet = sheets.find(s => s.id === activeSheetId) ?? null

  const { selectedCells, selectionStart, focusCell, selectCell, selectRange, selectCellSet, clearSelection, setIsSelecting } = useSelection()
  const { visibleColumns, toggleColumn, applyColumnSet } = useColumnVisibility(headers)
  const { workingIndex, specialSelected, applyWorking, applySpecial, loaded: stepLoaded } = useStepState({ steps: DEFAULT_CONFIG.steps, applyColumnSet })
  const { copiedCells, copyToClipboard, pasteFromClipboard, clearCopyMode } = useClipboard()
  const { sidebarWidth, setSidebarWidth, subPanelWidth, setSubPanelWidth, sidebarVisible, setSidebarVisible, subPanelVisible, setSubPanelVisible, loaded: panelLoaded } = usePanelResize()
  const { columnWidths, setColumnWidth, loaded: colWidthsLoaded } = useColumnWidth(headers)
  const { rowHeights, setRowHeight } = useRowHeight()
  const { filters, sorts, setColumnFilter, clearColumnFilter, clearAllFilters, setColumnSort, getFilteredAndSortedData, hasFilter, initFromServerState } = useColumnFilter(data, headers)

  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [, setCursorPosition] = useState(0)

  const lastClickRef = useRef({ cellKey: null as string | null, time: 0 })
  const isSelectingRef = useRef(false)
  const dragStartRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastHoverRef = useRef<string | null>(null)

  const visibleHeaders = useMemo(() => {
    const filtered = headers.filter(h => visibleColumns[h])
    return [...filtered.filter(h => !h.startsWith(AC_PREFIX)), ...filtered.filter(h => h.startsWith(AC_PREFIX))]
  }, [headers, visibleColumns])

  const displayData = useMemo(() => getFilteredAndSortedData(), [getFilteredAndSortedData])

  // フィルタ・ソート・列表示変更時に選択リセット
  useEffect(() => { clearSelection(); clearCopyMode(); setIsSelecting(false) }, [filters, sorts, visibleColumns]) // eslint-disable-line react-hooks/exhaustive-deps

  // シート切替時にサーバー保存済み状態を復元
  const restoredSheetIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (loading || !activeSheet || restoredSheetIdRef.current === activeSheetId) return
    restoredSheetIdRef.current = activeSheetId
    initFromServerState(activeSheet.sort_state, activeSheet.filter_state)
  }, [activeSheetId, loading, activeSheet, initFromServerState])

  const handleSelectSheet = useCallback((sheetId: string) => {
    if (sheetId === activeSheetId) return
    clearSelection(); clearCopyMode(); setIsSelecting(false)
    setEditingCell(null); setEditValue('')
    clearAllFilters({ saveToServer: false })
    setActiveSheetId(sheetId)
  }, [activeSheetId, setActiveSheetId, clearSelection, clearCopyMode, setIsSelecting, clearAllFilters])

  const allCellKeys = useMemo(() => {
    const keys: string[] = []
    displayData.forEach(row => visibleHeaders.forEach(h => keys.push(`${row.id}-${h}`)))
    return keys
  }, [displayData, visibleHeaders])

  const isEditMode = editingCell !== null

  const copyBounds = useMemo(() => {
    if (copiedCells.size === 0) return null
    const positions = Array.from(copiedCells).map(key => {
      const dash = key.indexOf('-')
      return { row: parseInt(key.slice(0, dash)), col: visibleHeaders.indexOf(key.slice(dash + 1)) }
    }).filter(p => p.col !== -1)
    if (!positions.length) return null
    return { minRow: Math.min(...positions.map(p => p.row)), maxRow: Math.max(...positions.map(p => p.row)), minCol: Math.min(...positions.map(p => p.col)), maxCol: Math.max(...positions.map(p => p.col)) }
  }, [copiedCells, visibleHeaders])

  const handleStartEdit = useCallback((initialValue?: string, position?: number) => {
    if (!selectionStart) return
    const [rowId, columnName] = selectionStart.split('-')
    const row = data.find(r => r.id === parseInt(rowId))
    const currentValue = row ? String(row[columnName] ?? '') : ''
    setEditingCell(selectionStart)
    setEditValue(initialValue !== undefined ? initialValue : currentValue)
    const pos = position !== undefined ? position : (initialValue ?? currentValue).length
    setCursorPosition(pos)
    setTimeout(() => { const inp = document.querySelector<HTMLInputElement>('input[type="text"]'); if (inp) inp.setSelectionRange(pos, pos) }, 0)
    clearCopyMode()
  }, [selectionStart, data, clearCopyMode])

  const handleCancelEdit = useCallback(() => { setEditingCell(null); setEditValue(''); setCursorPosition(0) }, [])

  const handleCellUpdate = useCallback((rowId: number, columnName: string, value: string) => {
    updateCell(rowId, columnName, value)
    setEditingCell(null); setEditValue(''); setCursorPosition(0)
  }, [updateCell])

  const moveSelection = useCallback((direction: string, extend = false) => {
    if (!selectionStart) return
    const base = extend && focusCell ? focusCell : selectionStart
    const [rowId, columnName] = base.split('-')
    const currentRowNum = parseInt(rowId)
    const currentColIdx = visibleHeaders.indexOf(columnName)
    const displayRowIds = displayData.map(r => r.id)
    const currentRowIndex = displayRowIds.indexOf(currentRowNum)
    let newRowIndex = currentRowIndex, newColIdx = currentColIdx
    if (direction === 'up') newRowIndex = Math.max(0, currentRowIndex - 1)
    if (direction === 'down') newRowIndex = Math.min(displayRowIds.length - 1, currentRowIndex + 1)
    if (direction === 'left') newColIdx = Math.max(0, currentColIdx - 1)
    if (direction === 'right') newColIdx = Math.min(visibleHeaders.length - 1, currentColIdx + 1)
    const newRowNum = displayRowIds[newRowIndex]
    if (newRowNum === undefined) return
    const newKey = `${newRowNum}-${visibleHeaders[newColIdx]}`
    if (extend) selectRange(selectionStart, newKey, allCellKeys)
    else selectCell(newKey, false, false)
  }, [selectionStart, focusCell, displayData, visibleHeaders, selectCell, selectRange, allCellKeys])

  const handleSaveAs = useCallback(async () => {
    if (!activeFilePath) return
    const res = await window.pywebview!.api.save_as()
    if (!res.ok || !res.path) return
    const newPath = res.path
    setOpenFiles(prev => prev.map(f =>
      f.path === activeFilePath ? { ...f, path: newPath } : f
    ))
  }, [activeFilePath])

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (isEditMode) return
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (isUnsaved) handleSaveAs(); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); await copyToClipboard(selectedCells, displayData, headers, visibleColumns, selectionStart) }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); await pasteFromClipboard(selectedCells, displayData, headers, visibleColumns, selectionStart, updateMultipleCells, selectCellSet) }
      else if (e.key === 'Delete' && selectedCells.size > 0) { e.preventDefault(); deleteCells(Array.from(selectedCells).filter(k => visibleColumns[k.split('-')[1]])) }
      else if (e.key === 'Escape') { e.preventDefault(); clearSelection(); clearCopyMode() }
      else if (e.key === 'Enter' && selectionStart) { e.preventDefault(); moveSelection('down', false) }
      else if (e.key === 'F2' && selectionStart) { e.preventDefault(); handleStartEdit() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection('up', e.shiftKey) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection('down', e.shiftKey) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSelection('left', e.shiftKey) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveSelection('right', e.shiftKey) }
      else if (e.key === 'Tab') { e.preventDefault(); moveSelection('right', false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedCells, displayData, headers, visibleColumns, selectionStart, isEditMode, isUnsaved, copyToClipboard, pasteFromClipboard, deleteCells, clearSelection, clearCopyMode, updateMultipleCells, selectCellSet, handleStartEdit, moveSelection, handleSaveAs])

  const handleCellClick = useCallback((cellKey: string, e: React.MouseEvent, clickX: number) => {
    if (e.shiftKey && selectionStart) { e.preventDefault(); selectRange(selectionStart, cellKey, allCellKeys); return }
    const now = Date.now()
    const timeSinceLast = now - lastClickRef.current.time
    if (cellKey === lastClickRef.current.cellKey && timeSinceLast < 300) {
      if (!isEditMode) { selectCell(cellKey, false, false); setTimeout(() => { const row = data.find(r => r.id === parseInt(cellKey.split('-')[0])); handleStartEdit(String(row?.[cellKey.split('-')[1]] ?? '')) }, 0) }
      lastClickRef.current = { cellKey: null, time: 0 }; return
    }
    if (cellKey === lastClickRef.current.cellKey && selectedCells.size === 1 && selectedCells.has(cellKey) && timeSinceLast > 300 && !isEditMode) {
      const row = data.find(r => r.id === parseInt(cellKey.split('-')[0]))
      const val = String(row?.[cellKey.split('-')[1]] ?? '')
      handleStartEdit(val, Math.min(Math.max(0, Math.round(clickX / 7)), val.length))
      lastClickRef.current = { cellKey: null, time: 0 }; return
    }
    selectCell(cellKey, e.ctrlKey || e.metaKey, false)
    lastClickRef.current = { cellKey, time: now }
  }, [selectCell, selectRange, selectionStart, allCellKeys, selectedCells, isEditMode, data, handleStartEdit])

  const handleCellMouseDown = useCallback((cellKey: string, e: React.MouseEvent) => {
    if (isEditMode || e.shiftKey) return
    isSelectingRef.current = true; dragStartRef.current = cellKey
    setIsSelecting(true); selectCell(cellKey, false, false)
  }, [selectCell, setIsSelecting, isEditMode])

  const handleCellMouseEnter = useCallback((cellKey: string) => {
    if (!isSelectingRef.current || !dragStartRef.current) return
    lastHoverRef.current = cellKey
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (isSelectingRef.current && dragStartRef.current && lastHoverRef.current)
        selectRange(dragStartRef.current, lastHoverRef.current, allCellKeys)
    })
  }, [selectRange, allCellKeys])

  const handleCellMouseUp = useCallback(() => {
    isSelectingRef.current = false; dragStartRef.current = null
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    setIsSelecting(false)
  }, [setIsSelecting])

  // ファイル操作
  const resetUIState = useCallback(() => {
    clearSelection(); clearCopyMode(); setIsSelecting(false)
    setEditingCell(null); setEditValue('')
    clearAllFilters({ saveToServer: false })
  }, [clearSelection, clearCopyMode, setIsSelecting, clearAllFilters])

  const handleOpenFile = useCallback(async () => {
    const res = await window.pywebview!.api.open_file()
    if (!res.ok) return
    const path = res.path!
    resetUIState()
    setOpenFiles(prev => {
      const exists = prev.some(f => f.path === path)
      if (exists) return prev.map(f => ({ ...f, isActive: f.path === path }))
      return [...prev.map(f => ({ ...f, isActive: false })), { path, isActive: true }]
    })
    await loadAllSheets()
  }, [loadAllSheets, resetUIState])

  const handleNewFile = useCallback(async () => {
    const res = await window.pywebview!.api.new_file()
    if (!res.ok) return
    const path = res.path!
    resetUIState()
    setOpenFiles(prev => [...prev.map(f => ({ ...f, isActive: false })), { path, isActive: true }])
    await loadAllSheets()
  }, [loadAllSheets, resetUIState])

  const handleSwitchFile = useCallback(async (path: string) => {
    const res = await window.pywebview!.api.switch_file(path)
    if (!res.ok) return
    resetUIState()
    setOpenFiles(prev => prev.map(f => ({ ...f, isActive: f.path === path })))
    await loadAllSheets()
  }, [loadAllSheets, resetUIState])

  const handleCloseFile = useCallback(async (path: string) => {
    const res = await window.pywebview!.api.close_file(path)
    if (!res.ok) return
    resetUIState()
    setOpenFiles(prev => {
      const remaining = prev.filter(f => f.path !== path)
      if (remaining.length === 0) return []
      const wasActive = prev.find(f => f.path === path)?.isActive
      if (wasActive && res.new_active) {
        return remaining.map(f => ({ ...f, isActive: f.path === res.new_active }))
      }
      return remaining
    })
    await loadAllSheets()
  }, [loadAllSheets, resetUIState])

  const handleDownload = useCallback(async () => {
    if (!activeSheetId) return
    setIsDownloading(true)
    try {
      const csv = await window.pywebview!.api.save_csv(activeSheetId)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${activeSheet?.name ?? 'sheet'}.csv`
      a.click(); URL.revokeObjectURL(url)
    } finally { setIsDownloading(false) }
  }, [activeSheetId, activeSheet])

  const handleAddSheet = useCallback(async (csvText: string, sheetName: string) => {
    await addSheet(csvText, sheetName)
    applySpecial('all')
  }, [addSheet, applySpecial])

  const contentReady = !loading && panelLoaded && colWidthsLoaded && stepLoaded

  const selectedCellValue = useMemo(() => {
    if (isEditMode && editingCell === selectionStart) return editValue
    if (!selectionStart) return ''
    const [rowId, col] = selectionStart.split('-')
    const row = data.find(r => r.id === parseInt(rowId))
    return row ? String(row[col] ?? '') : ''
  }, [selectionStart, data, isEditMode, editingCell, editValue])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <MainHeader
        sidebarVisible={sidebarVisible} subPanelVisible={subPanelVisible}
        onSidebarToggle={() => setSidebarVisible(!sidebarVisible)}
        onSubPanelToggle={() => setSubPanelVisible(!subPanelVisible)}
      />
      <FileTabBar
        openFiles={openFiles}
        onSwitch={handleSwitchFile}
        onClose={handleCloseFile}
      />
      <Toolbar
        hasFile={activeFilePath !== null}
        onOpenFile={handleOpenFile} onNewFile={handleNewFile}
        onCopy={() => copyToClipboard(selectedCells, displayData, headers, visibleColumns, selectionStart)}
        onPaste={() => pasteFromClipboard(selectedCells, displayData, headers, visibleColumns, selectionStart, updateMultipleCells, selectCellSet)}
        onDelete={() => deleteCells(Array.from(selectedCells).filter(k => visibleColumns[k.split('-')[1]]))}
        onDownload={handleDownload} isDownloading={isDownloading}
        isUnsaved={isUnsaved} onSaveAs={handleSaveAs}
        steps={DEFAULT_CONFIG.steps} workingIndex={workingIndex} specialSelected={specialSelected}
        onApplyWorking={applyWorking} onApplySpecial={applySpecial} stepsReady={stepLoaded}
      />
      <StatusBar loading={loading || isDownloading} />
      <FormulaBar
        selectedCell={selectionStart} value={selectedCellValue}
        data={data} headers={headers}
        onFormulaBarChange={(key, val) => { const [rowId, col] = key.split('-'); updateCell(parseInt(rowId), col, val) }}
        onFormulaBarInput={() => {}}
        isEditingCell={isEditMode}
        keyField={DEFAULT_CONFIG.keyField} keyFieldCopyLabel={DEFAULT_CONFIG.keyFieldCopyLabel}
      />

      <div className="flex-1 flex overflow-hidden">
        {!contentReady ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-gray-400 text-sm">
              {status || (activeFilePath === null ? 'ファイルを開いてください' : 'データを読み込み中...')}
            </div>
          </div>
        ) : (
          <>
            {sidebarVisible && (
              <>
                <Sidebar headers={headers} visibleColumns={visibleColumns}
                  onToggleColumn={col => { toggleColumn(col); clearSelection(); clearCopyMode(); setIsSelecting(false) }}
                  width={sidebarWidth}
                />
                <ResizeHandle direction="horizontal" onResize={d => setSidebarWidth(p => Math.max(150, Math.min(500, p + d)))} />
              </>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <SheetTabs
                sheets={sheets} activeSheetId={activeSheetId}
                onSelectSheet={handleSelectSheet}
                onAddSheet={handleAddSheet}
                onRenameSheet={renameSheet}
                onDeleteSheet={deleteSheet}
              />
              {sheets.length === 0 ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">CSVをインポートしてください</p>
                    <p className="text-xs mt-1">シートタブの「＋」からCSVファイルを追加できます</p>
                  </div>
                </div>
              ) : (
                <SpreadsheetGrid
                  data={displayData} originalData={data}
                  headers={headers} visibleColumns={visibleColumns}
                  columnWidths={columnWidths} setColumnWidth={setColumnWidth}
                  rowHeights={rowHeights} setRowHeight={setRowHeight}
                  selectedCells={selectedCells} selectionStart={selectionStart}
                  copiedCells={copiedCells} copyBounds={copyBounds}
                  editingCell={editingCell} editValue={editValue}
                  filters={filters} hasFilter={hasFilter}
                  onApplyFilter={setColumnFilter} onClearFilter={clearColumnFilter} onSort={setColumnSort}
                  onEditValueChange={setEditValue}
                  onCellClick={handleCellClick} onUpdateCell={handleCellUpdate}
                  onCellMouseDown={handleCellMouseDown} onCellMouseEnter={handleCellMouseEnter} onCellMouseUp={handleCellMouseUp}
                  onGridClick={e => { if (e.target === e.currentTarget) { clearSelection(); handleCancelEdit() } }}
                  onStartEdit={handleStartEdit} onCancelEdit={handleCancelEdit}
                  onHiddenInputFocus={() => {}}
                  onSelectRow={id => selectCellSet(new Set(visibleHeaders.map(h => `${id}-${h}`)))}
                  onSelectColumn={col => selectCellSet(new Set(displayData.map(r => `${r.id}-${col}`)))}
                />
              )}
            </div>
            {subPanelVisible && (
              <>
                <ResizeHandle direction="horizontal" onResize={d => setSubPanelWidth(p => Math.max(200, Math.min(600, p - d)))} />
                <SubPanel data={data} selectedCells={selectedCells} width={subPanelWidth} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
