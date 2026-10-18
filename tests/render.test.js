import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

test('all seven workspace routes render with expected content', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: { getItem: () => null } }
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const paths = [
      ['/', 'Prairie View Farm'],
      ['/outlook', 'Yield outlook'],
      ['/planning', 'Harvest planning'],
      ['/field', 'Field setup'],
      ['/conditions', 'Field conditions'],
      ['/market', 'Supply balance lab'],
      ['/about', 'Data &amp; methodology'],
    ]
    for (const [path, expected] of paths) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)))
      assert.ok(html.includes(expected), `${path} did not render its content`)
      assert.ok(html.includes('Skip to content'))
      assert.ok(html.includes('HARVEST'))
      assert.ok(html.includes('href="/planning"'), `${path} is missing harvest planning navigation`)
      if (path === '/conditions') assert.equal((html.match(/class="day"/g) || []).length, 7, 'Conditions must show seven days even when planning uses 16')
      if (path === '/planning') {
        for (const feature of ['Optimal harvest window', 'Crop quality and marketability', 'Crop risk early warnings', 'Interactive what-if simulator', 'Profit and loss comparison']) assert.ok(html.includes(feature), `Missing planning feature: ${feature}`)
      }
    }
    const { createPlannerState } = await import('../src/services/harvestPlanningService.js')
    const { FARMS } = await import('../src/data/agriculture.js')
    const noEvidence = { ...createPlannerState(FARMS[0]), evidenceMode: 'none' }
    globalThis.window.localStorage = { getItem: key => key.startsWith('harvest:planner:') ? JSON.stringify(noEvidence) : null }
    const noDataHtml = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/planning'] }, createElement(App)))
    assert.ok(noDataHtml.includes('No matching crop-specific grading records are loaded. A probability is unavailable.'))
    assert.ok(noDataHtml.includes('only the standard price is used'))
  } finally {
    globalThis.window = previousWindow
    await server.close()
  }
})
