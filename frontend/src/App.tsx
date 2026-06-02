import { useEffect, useState } from 'react'

const AC_PREFIX = 'AC_'

function App() {
  const [sheets, setSheets] = useState<SheetInfo[]>([])
  const [activeSheet, setActiveSheet] = useState<SheetData | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [status, setStatus] = useState('接続中...')
  const [bridgeReady, setBridgeReady] = useState(false)

  useEffect(() => {
    const onReady = async () => {
      setBridgeReady(true)
      const list = await window.pywebview!.api.get_all_sheets()
      setSheets(list)
      if (list.length > 0) {
        await loadSheet(list[0].sheet_id)
        setStatus('')
      } else {
        setStatus('CSVをインポートしてください')
      }
    }

    if (window.pywebview) {
      onReady()
    } else {
      window.addEventListener('pywebviewready', onReady)
      const t = setTimeout(() => setStatus('pywebview なし（ブラウザ開発モード）'), 1000)
      return () => {
        window.removeEventListener('pywebviewready', onReady)
        clearTimeout(t)
      }
    }
  }, [])

  const loadSheet = async (sheetId: string) => {
    const data = await window.pywebview!.api.get_sheet(sheetId)
    setActiveSheet(data)
  }

  const handleOpenFile = async () => {
    const res = await window.pywebview!.api.open_file()
    if (!res.ok) return
    setFilePath(res.path ?? null)
    const list = await window.pywebview!.api.get_all_sheets()
    setSheets(list)
    if (list.length > 0) { await loadSheet(list[0].sheet_id); setStatus('') }
    else setStatus('CSVをインポートしてください')
  }

  const handleNewFile = async () => {
    const res = await window.pywebview!.api.new_file()
    if (!res.ok) return
    setFilePath(res.path ?? null)
    setSheets([])
    setActiveSheet(null)
    setStatus('CSVをインポートしてください')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      text = new TextDecoder('shift-jis').decode(bytes)
    }
    const name = file.name.replace(/\.csv$/i, '')
    const res = await window.pywebview!.api.load_csv(text, name)
    if (!res.ok) { alert(res.error); return }
    const list = await window.pywebview!.api.get_all_sheets()
    setSheets(list)
    await loadSheet(res.sheet_id!)
    setStatus('')
    e.target.value = ''
  }

  const handleExport = async () => {
    if (!activeSheet) return
    const csv = await window.pywebview!.api.save_csv(activeSheet.sheet_id)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeSheet.sheet_name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const displayColumns = activeSheet?.columns.filter(c => c !== 'internal_row_id') ?? []

  return (
    <div className="h-screen flex flex-col">
      {/* ツールバー */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border-b border-gray-300 shrink-0">
        {bridgeReady && !filePath && <>
          <Btn onClick={handleOpenFile} variant="blue">ファイルを開く</Btn>
          <Btn onClick={handleNewFile} variant="violet">新規作成</Btn>
          <Sep />
        </>}
        {bridgeReady && filePath && <>
          <label className="px-2.5 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer">
            CSV インポート
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Btn onClick={handleExport} variant="green" disabled={!activeSheet}>
            CSV ダウンロード
          </Btn>
          <Sep />
          <span className="text-[11px] text-gray-500 max-w-xs truncate">{filePath}</span>
        </>}
        {status && <span className="text-xs text-gray-500">{status}</span>}
      </div>

      {/* シートタブ */}
      {sheets.length > 0 && (
        <div className="flex gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200 shrink-0">
          {sheets.map(s => (
            <button
              key={s.sheet_id}
              onClick={() => loadSheet(s.sheet_id)}
              className={`px-3 py-0.5 text-xs border border-gray-300 rounded cursor-pointer
                ${activeSheet?.sheet_id === s.sheet_id
                  ? 'bg-white font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {s.sheet_name}
            </button>
          ))}
        </div>
      )}

      {/* テーブル */}
      <div className="flex-1 overflow-auto">
        {activeSheet ? (
          <table className="border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr>
                {displayColumns.map(col => (
                  <th
                    key={col}
                    className={`px-2 py-1 text-left font-semibold sticky top-0 border border-gray-300
                      ${col.startsWith(AC_PREFIX) ? 'bg-blue-100' : 'bg-gray-100'}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSheet.rows.map((row, i) => (
                <tr key={row.internal_row_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {displayColumns.map(col => (
                    <td
                      key={col}
                      className={`px-2 py-0.5 border border-gray-200
                        ${col.startsWith(AC_PREFIX) ? 'bg-blue-50' : ''}`}
                    >
                      {row[col] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-gray-400">{status}</p>
        )}
      </div>
    </div>
  )
}

type BtnVariant = 'blue' | 'violet' | 'green'

const variantClass: Record<BtnVariant, string> = {
  blue:   'bg-blue-600 hover:bg-blue-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
  green:  'bg-green-600 hover:bg-green-700',
}

function Btn({ onClick, variant, disabled, children }: {
  onClick?: () => void
  variant: BtnVariant
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 text-xs text-white rounded
        ${disabled ? 'bg-gray-400 cursor-default' : `${variantClass[variant]} cursor-pointer`}`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5" />
}

export default App
