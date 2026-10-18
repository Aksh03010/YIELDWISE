import { useEffect, useState } from 'react'

export function useModelCatalog() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(null)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    fetch('/api/models', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Model service unavailable'); return response.json() })
      .then(catalog => { if (!Array.isArray(catalog.crops)) throw new Error('Invalid model catalog'); if (active && !controller.signal.aborted) setState({ catalog, modelStatus: 'ready', attempt }) })
      .catch(() => { if (active) setState({ catalog: null, modelStatus: 'error', attempt }) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [attempt])
  const current = state?.attempt === attempt ? state : { catalog: null, modelStatus: 'loading' }
  return { ...current, refreshModels: () => setAttempt(value => value + 1) }
}
