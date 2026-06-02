import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('connecting...')

  useEffect(() => {
    const onReady = async () => {
      const rules = await window.pywebview!.api.list_rules()
      setStatus(`bridge ok — rules: [${rules.join(', ') || 'none'}]`)
    }

    if (window.pywebview) {
      onReady()
    } else {
      window.addEventListener('pywebviewready', onReady)
      const timer = setTimeout(
        () => setStatus('pywebview なし（ブラウザ開発モード）'),
        1000,
      )
      return () => {
        window.removeEventListener('pywebviewready', onReady)
        clearTimeout(timer)
      }
    }
  }, [])

  return <div style={{ padding: 20 }}>{status}</div>
}

export default App
