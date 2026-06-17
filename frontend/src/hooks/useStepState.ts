import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'shed-step-state'

interface Step { label: string; columns: string[] }

export const useStepState = (
  { steps, applyColumnSet }: { steps: Step[]; applyColumnSet: (cols: string[] | null) => void }
) => {
  const [workingIndex, setWorkingIndex] = useState(0)
  const [specialSelected, setSpecialSelected] = useState<'all' | 'none' | null>(null)
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (saved && typeof saved === 'object') {
        const idx = saved.workingIndex ?? 0
        const special = saved.specialSelected ?? null
        setWorkingIndex(idx); setSpecialSelected(special)
        if (special === 'all') applyColumnSet(null)
        else if (special === 'none') applyColumnSet([])
        else if (steps.length > 0) applyColumnSet(steps[idx]?.columns ?? null)
      }
    } catch {}
    loadedRef.current = true; setLoaded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loaded) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ workingIndex, specialSelected }))
    }, 300)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [workingIndex, specialSelected, loaded])

  const applyWorking = useCallback((index: number) => {
    const bounded = Math.max(0, Math.min(steps.length - 1, index))
    setWorkingIndex(bounded); setSpecialSelected(null)
    applyColumnSet(steps[bounded]?.columns ?? null)
  }, [steps, applyColumnSet])

  const applySpecial = useCallback((kind: 'all' | 'none') => {
    setSpecialSelected(kind)
    applyColumnSet(kind === 'all' ? null : [])
  }, [applyColumnSet])

  return { workingIndex, specialSelected, applyWorking, applySpecial, loaded }
}
