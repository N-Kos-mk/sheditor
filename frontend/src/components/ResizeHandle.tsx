import { useState, useCallback, useRef } from 'react'

interface Props {
  direction?: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  className?: string
}

export const ResizeHandle = ({ direction = 'horizontal', onResize, className = '' }: Props) => {
  const [isResizing, setIsResizing] = useState(false)
  const startPosRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY

    const handleMouseMove = (e: MouseEvent) => {
      const current = direction === 'horizontal' ? e.clientX : e.clientY
      onResize(current - startPosRef.current)
      startPosRef.current = current
    }
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [direction, onResize])

  return (
    <div
      className={`${className} ${direction === 'horizontal'
        ? 'w-1 cursor-col-resize hover:bg-blue-400'
        : 'h-1 cursor-row-resize hover:bg-blue-400'
      } ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
      onMouseDown={handleMouseDown}
    />
  )
}
