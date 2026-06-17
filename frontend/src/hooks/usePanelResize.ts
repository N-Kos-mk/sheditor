import { useState, useEffect, useRef } from 'react'

const DEFAULTS = {
  'shed-sidebar-width': 256,
  'shed-subpanel-width': 320,
  'shed-sidebar-visible': true,
  'shed-subpanel-visible': false,  // SubPanel はデフォルト非表示
}

function loadItem<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}

function useSave<T>(key: string, value: T, loadedRef: React.MutableRefObject<boolean>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!loadedRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => localStorage.setItem(key, JSON.stringify(value)), 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const usePanelResize = () => {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULTS['shed-sidebar-width'])
  const [subPanelWidth, setSubPanelWidth] = useState(DEFAULTS['shed-subpanel-width'])
  const [sidebarVisible, setSidebarVisible] = useState(DEFAULTS['shed-sidebar-visible'])
  const [subPanelVisible, setSubPanelVisible] = useState(DEFAULTS['shed-subpanel-visible'])
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    setSidebarWidth(loadItem('shed-sidebar-width', DEFAULTS['shed-sidebar-width']))
    setSubPanelWidth(loadItem('shed-subpanel-width', DEFAULTS['shed-subpanel-width']))
    setSidebarVisible(loadItem('shed-sidebar-visible', DEFAULTS['shed-sidebar-visible']))
    setSubPanelVisible(loadItem('shed-subpanel-visible', DEFAULTS['shed-subpanel-visible']))
    loadedRef.current = true
    setLoaded(true)
  }, [])

  useSave('shed-sidebar-width', sidebarWidth, loadedRef)
  useSave('shed-subpanel-width', subPanelWidth, loadedRef)
  useSave('shed-sidebar-visible', sidebarVisible, loadedRef)
  useSave('shed-subpanel-visible', subPanelVisible, loadedRef)

  return { sidebarWidth, setSidebarWidth, subPanelWidth, setSubPanelWidth, sidebarVisible, setSidebarVisible, subPanelVisible, setSubPanelVisible, loaded }
}
