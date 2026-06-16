import { PanelLeft, PanelRight } from 'lucide-react'

interface Props {
  sidebarVisible: boolean
  subPanelVisible: boolean
  onSidebarToggle: () => void
  onSubPanelToggle: () => void
}

export const MainHeader = ({ sidebarVisible, subPanelVisible, onSidebarToggle, onSubPanelToggle }: Props) => (
  <header className="h-10 bg-zinc-900 flex items-center px-3 gap-2 shrink-0 select-none">
    <span className="font-mono text-sm font-bold text-white tracking-tighter">shed</span>
    <div className="flex-1" />
    <button
      onClick={onSidebarToggle}
      title={sidebarVisible ? 'サイドバーを隠す' : 'サイドバーを表示'}
      className={`p-1.5 rounded transition-colors ${sidebarVisible ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
    >
      <PanelLeft size={15} />
    </button>
    <button
      onClick={onSubPanelToggle}
      title={subPanelVisible ? 'サブパネルを隠す' : 'サブパネルを表示'}
      className={`p-1.5 rounded transition-colors ${subPanelVisible ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
    >
      <PanelRight size={15} />
    </button>
  </header>
)
