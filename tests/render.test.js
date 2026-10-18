import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { readFile } from 'node:fs/promises'

test('workspace renders supported tools without simulated forecasts or missing-data substitutes', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: { getItem: () => null } }
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    for (const [path, title] of [['/', 'Prairie View Farm'], ['/outlook', 'Yield outlook'], ['/planning', 'Harvest planning'], ['/field', 'Field setup'], ['/conditions', 'Field conditions'], ['/about', 'Data &amp; methodology']]) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)))
      assert.ok(html.includes(`class="typing-heading" aria-label="${title}"`), `${path} is missing its accessible title`)
      assert.ok(html.includes('Skip to content'))
      const navigation = html.match(/<nav[^>]*aria-label="Main navigation"[\s\S]*?<\/nav>/)?.[0]
      assert.ok(navigation && !navigation.includes('typing-heading') && !navigation.includes('/market'))
      for (const name of ['Zohaib Mansoor', 'Shubhang Nath Thakur', 'Akshit Mesa']) assert.ok(html.includes(name))
      assert.ok(html.includes('HARVEST™'))
      assert.ok(!html.includes('class="badge'))
      for (const retired of ['vs. sample last season', 'Relative potential', 'Planning horizon', 'Illustrative fixture', 'Interactive what-if simulator']) assert.ok(!html.includes(retired), `${path} exposes a retired fixture`)
      if (path === '/outlook') assert.ok(html.includes('Connecting to the models') && !html.includes('Farm forecast unavailable'))
      if (path === '/conditions') {
        assert.equal((html.match(/class="day"/g) || []).length, 0)
        assert.ok(html.includes('Daily forecast unavailable.'))
      }
      if (path === '/planning') {
        assert.ok(html.includes('class="animated-money"'))
        assert.ok(html.includes('Measured grain check') && html.includes('Scenario A'))
        assert.ok(!html.includes('type="range"') && !html.includes('premiumPrice'))
      }
    }
    const { default: Conditions } = await server.ssrLoadModule('/src/pages/ConditionsPage.jsx')
    const { FARMS } = await import('../src/data/agriculture.js')
    const { default: Outlook } = await server.ssrLoadModule('/src/pages/OutlookPage.jsx')
    const { default: PredictionRunner } = await server.ssrLoadModule('/src/components/PredictionRunner.jsx')
    for (const [crop, filename] of [['corn', 'maize'], ['soybeans', 'soybean']]) {
      const artifact = JSON.parse(await readFile(new URL(`../backend/artifacts/${filename}_research_artifact.json`, import.meta.url), 'utf8'))
      const catalog = { crops: [{ crop, status: 'research_only', scope: artifact.manifest.scope || artifact.manifest.geography,
        targets: Object.entries(artifact.targets).map(([id, target]) => ({ id, ...target })) }] }
      const outlook = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Outlook, { farm: { ...FARMS[0], crop }, catalog, modelStatus: 'ready' })))
      assert.ok(outlook.includes('Your field location') && outlook.includes('Trial examples'))
      assert.ok(!outlook.includes('Recorded G2F trial'), 'Field mode must not silently run trial inputs')
      if (crop === 'corn') {
        assert.ok(outlook.includes('Refresh estimate now') && outlook.includes('NASA POWER'))
        assert.ok(outlook.includes('Automatic updates on') && outlook.includes('Pause automatic updates'))
        assert.ok(outlook.includes('Current weather at this location'), 'Weather must not wait for a model run or planting date')
      }
      const trial = renderToStaticMarkup(createElement(PredictionRunner, { entry: catalog.crops[0] }))
      assert.ok(trial.includes('Run the trained model') && trial.includes('Predicted grain yield'))
    }
    const weather = { modelTime: '2026-10-18T12:00', fetchedAt: '2026-10-18T16:00:00Z', days: Array.from({ length: 16 }, (_, i) => ({ date: `2026-10-${String(18 + i).padStart(2, '0')}`, min: i === 0 ? -1 : 5, max: 20, rain: 0, code: 1 })) }
    const weatherHtml = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Conditions, { farm: FARMS[0], weather, status: 'ready' })))
    assert.equal((weatherHtml.match(/class="day"/g) || []).length, 7)
    assert.ok(weatherHtml.includes('is at or below freezing.'))
    const { default: AnimatedMoney } = await server.ssrLoadModule('/src/components/AnimatedMoney.jsx')
    const { default: HarvestTiming } = await server.ssrLoadModule('/src/components/HarvestTiming.jsx')
    const timingHtml = renderToStaticMarkup(createElement(HarvestTiming, { crop: 'corn', result: { value: 184.43 }, target: { test_metrics: { MAE_in_target_units: 10.5667 } }, plantingDate: '2021-05-22' }))
    assert.ok(timingHtml.includes('Estimated harvest date') && timingHtml.includes('Nov 22, 2021'))
    assert.ok(timingHtml.includes('Nov 11, 2021') && timingHtml.includes('Dec 3, 2021'))
    const maturityHtml = renderToStaticMarkup(createElement(HarvestTiming, { crop: 'soybeans', result: { value: 130 }, target: { test_metrics: { environment_macro_mae: 8.0197 } }, plantingDate: '2013-05-25' }))
    assert.ok(maturityHtml.includes('Estimated R8 maturity date') && !maturityHtml.includes('Estimated harvest date'))
    const { default: TypingHeading } = await server.ssrLoadModule('/src/components/TypingHeading.jsx')
    const amount = renderToStaticMarkup(createElement(AnimatedMoney, { value: -1234 }))
    assert.ok(amount.includes('<span class="sr-only">-$1,234</span>'))
    assert.ok(amount.includes('<span class="money-value" aria-hidden="true">-$1,234</span>'))
    const title = renderToStaticMarkup(createElement(TypingHeading, { text: 'Data & methodology' }))
    assert.equal((title.match(/data-revealed="true"/g) || []).length, Array.from('Data&methodology').length)
    assert.ok(title.includes('data-typing="false"') && !title.includes('data-current="true"'))
  } finally { globalThis.window = previousWindow; await server.close() }
})
