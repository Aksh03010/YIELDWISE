export async function predictTargets({ crop, targets, inputs, siteId, signal }) {
  return Promise.all(targets.map(async target => {
    try {
      const response = await fetch('/api/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ crop, target, inputs, ...(siteId ? { site_id: siteId } : {}), research_only: true }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'The model could not accept these inputs.')
      if (data.crop !== crop || data.target !== target || !Number.isFinite(data.value) || data.research_only !== true) throw new Error('The model returned an incomplete result.')
      return { ...data, target }
    } catch (error) {
      if (signal?.aborted) throw error
      return { target, error: error.message }
    }
  }))
}
