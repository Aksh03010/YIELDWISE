import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

test('all six workspace routes render with expected content', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: { getItem: () => null } }
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const paths = [['/', 'Your farm, in focus.'], ['/results', 'Look ahead. Plan with perspective.'], ['/predict', 'Good forecasts start here.'], ['/environmental', 'A closer look at your land.'], ['/market', 'From field to bigger picture.'], ['/about', 'Know what’s behind the numbers.']]
    for (const [path, expected] of paths) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)))
      assert.ok(html.includes(expected), `${path} did not render its content`)
      assert.ok(html.includes('Skip to content'))
      assert.ok(html.includes('HARVEST'))
    }
  } finally {
    globalThis.window = previousWindow
    await server.close()
  }
})
