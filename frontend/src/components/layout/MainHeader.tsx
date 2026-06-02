import { Eye, EyeOff } from 'lucide-react'

interface Props {
  sidebarVisible: boolean
  subPanelVisible: boolean
  onSidebarToggle: () => void
  onSubPanelToggle: () => void
  filePath: string | null
}

export const MainHeader = ({ sidebarVisible, subPanelVisible, onSidebarToggle, onSubPanelToggle, filePath }: Props) => (
  <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
    <span className="text-xs text-gray-400 truncate max-w-md">{filePath ?? '—'}</span>
    <div className="flex gap-2">
      <button
        onClick={onSidebarToggle}
        className={`px-2 py-1 rounded flex items-center gap-1 text-sm ${sidebarVisible ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}
      >
        {sidebarVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        <span>サイドバー</span>
      </button>
      <button
        onClick={onSubPanelToggle}
        className={`px-2 py-1 rounded flex items-center gap-1 text-sm ${subPanelVisible ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}
      >
        {subPanelVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        <span>サブパネル</span>
      </button>
    </div>
  </header>
)
