import { useEffect, useRef, useState } from 'react'
import { CROPS, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import { HARVEST_PROFILES, getSampleGradeRecords } from '../data/harvestProfiles.js'
import { addDays, calculateHarvestPlan, createPlannerState, dateKey, daysBetween, formatDate, isDateKey, loadPlanner } from '../services/harvestPlanningService.js'
import { downloadText, gradingCsv, parseGradingCsv } from '../services/gradingCsv.js'
import { SAMPLE_WEATHER } from '../services/weatherService.js'

const money = value => Number.isFinite(value) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : 'N/A'
const percent = value => value == null ? 'Unavailable' : `${fmt(value * 100, 0)}%`
const shortDate = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const sections = [['harvest-window', 'Harvest window'], ['grade-target', 'Grade probability'], ['crop-risks', 'Risk warnings'], ['what-if', 'What-if simulator'], ['profit', 'Profit and loss']]

export default function HarvestPlanner({ farm, weather, status, refreshWeather }) {
  const [asOf] = useState(() => dateKey())
  const [planner, setPlanner] = useState(() => loadPlanner(farm, window.localStorage, asOf))
  const [fileMessage, setFileMessage] = useState('')
  const [storageMessage, setStorageMessage] = useState('')
  const fileInput = useRef(null)
  const { settings, target, evidenceMode, importedRecords, compareDate } = planner
  const profile = HARVEST_PROFILES[farm.crop]
  const crop = CROPS.find(item => item.id === farm.crop)
  const records = evidenceMode === 'sample' ? getSampleGradeRecords(farm.crop) : evidenceMode === 'uploaded' ? importedRecords : []
  const weatherInputs = weather || SAMPLE_WEATHER
  const params = { farm, settings, target, records, weatherDays: weatherInputs.days, asOf }
  const plan = calculateHarvestPlan(params)
  const errors = plan.errors
  const valid = !Object.keys(errors).length
  const alternatePlan = isDateKey(compareDate) ? calculateHarvestPlan({ ...params, settings: { ...settings, harvestDate: compareDate } }) : null
  const alternate = alternatePlan?.current
  const adjusted = Number(settings.rainfallChange) !== 0 || Number(settings.temperatureChange) !== 0
  const activeWarnings = valid ? plan.warnings.filter(warning => warning.state === 'triggered' && warning.exposed) : []

  useEffect(() => {
    if (Object.keys(errors).length || !alternate) return
    try {
      localStorage.setItem(`harvest:planner:v1:${farm.id}:${farm.crop}`, JSON.stringify(planner))
      setStorageMessage('')
    } catch { setStorageMessage('This scenario is available for this visit. Browser storage could not save it for next time.') }
  }, [planner, farm.id, farm.crop]) // Validation is derived from the same planner snapshot.

  function setting(key, value) {
    setPlanner(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } }))
  }
  function limit(key, value) {
    setPlanner(previous => ({ ...previous, target: { ...previous.target, limits: { ...previous.target.limits, [key]: value } } }))
  }
  function shiftHarvest(amount) {
    if (!isDateKey(settings.harvestDate)) return
    const next = addDays(settings.harvestDate, amount)
    if (next >= asOf && next <= addDays(asOf, 365)) setting('harvestDate', next)
  }
  function reset() {
    setPlanner(createPlannerState(farm, asOf)); setFileMessage('')
    if (fileInput.current) fileInput.current.value = ''
  }
  function numberField(key, label, unit, min = 0, max = 100000, step = 'any') {
    return <label className="form-field" htmlFor={`plan-${key}`}>
      <span>{label} <small>{unit}</small></span>
      <input id={`plan-${key}`} type="number" min={min} max={max} step={step} value={settings[key]} onChange={event => setting(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `plan-error-${key}` : undefined} />
      {errors[key] && <small className="field-error" id={`plan-error-${key}`}>{errors[key]}</small>}
    </label>
  }
  function dateField(key, label) {
    return <label className="form-field" htmlFor={`plan-${key}`}>{label}
      <input id={`plan-${key}`} type="date" min={key === 'harvestDate' ? asOf : addDays(asOf, -60)} max={addDays(asOf, 365)} value={settings[key]} onChange={event => setting(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `plan-error-${key}` : undefined} />
      {errors[key] && <small className="field-error" id={`plan-error-${key}`}>{errors[key]}</small>}
    </label>
  }
  function rangeField(key, label, unit, min, max, step) {
    return <div className="planner-range">
      <label htmlFor={`plan-${key}`}>{label}<output htmlFor={`plan-${key}`}>{Number(settings[key]) > 0 && min < 0 ? '+' : ''}{settings[key]}{unit}</output></label>
      <input id={`plan-${key}`} type="range" min={min} max={max} step={step} value={settings[key]} onChange={event => setting(key, Number(event.target.value))} />
      <div><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  }
  async function importRecords(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileMessage('Reading grading records…')
    try {
      if (file.size > 200000) throw new Error('Use a CSV file smaller than 200 KB.')
      const parsed = parseGradingCsv(await file.text(), farm.crop)
      setPlanner(previous => ({ ...previous, evidenceMode: 'uploaded', importedRecords: parsed }))
      setFileMessage(`Loaded ${parsed.length} ${crop.name.toLowerCase()} grading records. These stay in this browser; no file is uploaded to a server.`)
    } catch (error) { setFileMessage(`Import failed: ${error.message} Previous grading data has been kept.`) }
    event.target.value = ''
  }
  function exportPlan() {
    if (!valid) return
    const rows = [
      ['HARVEST harvest plan', 'ILLUSTRATIVE FRONTEND SCENARIO; NOT A VALIDATED FORECAST'],
      ['Field', farm.name], ['Crop', crop.name], ['Area (ha)', fieldHectares(farm)], ['As of', asOf],
      ['Weather source', weather ? 'Open-Meteo weather model' : 'Example weather'], ['Weather adjusted', adjusted], ['Grading evidence', evidenceMode],
      ['Window start', plan.window.start], ['Window end', plan.window.end], ['Window provisional', plan.window.provisional], ['Selected date', settings.harvestDate],
      ['Grade target', target.name], ['Grading records', plan.evidence.count], ['Illustrative target probability', plan.current.probability ?? 'Unavailable'],
      ['Retained yield (t/ha)', plan.current.retainedYield], ['Production (tonnes)', plan.current.tonnes],
      ['Gross revenue (USD)', plan.current.revenue], ['Operating cost (USD)', plan.current.costs.operating], ['Harvest cost (USD)', plan.current.costs.harvesting],
      ['Added irrigation cost (USD)', plan.current.costs.irrigation], ['Drying cost (USD)', plan.current.costs.drying], ['Holding cost (USD)', plan.current.costs.holding], ['Net operating result (USD)', plan.current.net],
      ['Alternative date', compareDate], ['Alternative net operating result (USD)', alternate?.net ?? 'Unavailable'],
      ...Object.entries(settings).map(([key, value]) => [`Input: ${key}`, value]), ...Object.entries(target.limits).map(([key, value]) => [`Target: ${key}`, value]),
    ]
    const escape = value => `"${String(value).replace(/^[=+@\t\r-]/, "'$&").replaceAll('"', '""')}"`
    downloadText('harvest-planning-scenario.csv', '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n'))
  }

  return <>
    <div className="page-heading"><div><h1>Harvest planning</h1><p>{farm.name} · {crop.name} · {fmt(fieldHectares(farm))} ha</p></div><div className="planner-actions"><button className="button button-outline" onClick={reset}>Reset scenario</button><button className="button button-outline" onClick={exportPlan} disabled={!valid}>Export plan</button></div></div>
    <div className="preview-notice planner-disclosure"><span><strong>Planning prototype.</strong> Dates, grade chances, crop-loss responses and returns use illustrative calculations. Live weather can supply conditions, but no trained harvest or grade model is connected. Targets and prices are editable examples.</span></div>
    <div className="planner-source-line"><p>Weather: <strong>{weather ? `Open-Meteo${adjusted ? ' with what-if adjustments' : ' model forecast'}` : 'example weather, not a forecast'}</strong>{weather && <> · retrieved {new Date(weather.fetchedAt).toLocaleString()}</>}</p><button className="text-button" onClick={refreshWeather} disabled={status === 'loading'}>{status === 'loading' ? 'Updating weather…' : 'Refresh weather'}</button></div>
    {storageMessage && <p className="notice" role="status">{storageMessage}</p>}
    {Object.keys(errors).length > 0 && <div className="notice error-notice" role="alert">Complete the highlighted inputs to update results. No result is shown for invalid assumptions.</div>}
    <nav className="planner-navigation" aria-label="Harvest planning sections">{sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>

    <section id="harvest-window" className="panel planner-section">
      <div className="panel-heading"><div><h2>Optimal harvest window</h2><p>Compare readiness, weather exposure, grade potential and operating costs.</p></div></div>
      {valid ? <>
        <div className="harvest-window-summary"><div><p className="planner-result-label">{!weather ? 'Example harvest window' : plan.window.provisional ? 'Provisional scenario window' : 'Suggested scenario window'}</p><strong className="planner-window-dates">{shortDate(plan.window.start)}{plan.window.end !== plan.window.start ? ` to ${shortDate(plan.window.end)}` : ''}</strong><p>Best modeled date: {formatDate(plan.best.date)}. Net operating result: {money(plan.best.net)}.</p><button className="button button-outline" onClick={() => setting('harvestDate', plan.best.date)}>Use best scenario date</button></div><div className="window-reasons"><h3>Why these dates?</h3><ul><li>At least 90% of the demo readiness response, using your maturity date.</li><li>Contiguous dates within 3% of the best modeled net result, capped at four days.</li><li>{plan.window.provisional ? 'No mature candidate has complete weather coverage. The window is provisional.' : 'Only dates with complete available weather coverage are ranked when any are available.'}</li></ul></div></div>
        <p className="planner-delay-note">Waiting until {formatDate(plan.later.date)} gives an illustrative net result of <strong>{money(plan.later.net)}</strong>, {money(Math.abs(plan.later.net - plan.best.net))} {plan.later.net >= plan.best.net ? 'higher' : 'lower'} than the best scenario date. {plan.later.frostDays > plan.best.frostDays ? 'Additional frost-trigger days occur before that later harvest. ' : ''}{!plan.later.weatherComplete && 'Weather coverage is incomplete for that later date.'}</p>
        <div className="harvest-calendar" aria-label="Candidate harvest dates">{plan.candidates.map(day => <button key={day.date} type="button" className={`harvest-day ${day.date >= plan.window.start && day.date <= plan.window.end ? 'in-window' : ''}`} aria-pressed={day.date === settings.harvestDate} aria-label={`Select ${formatDate(day.date)}; illustrative net ${money(day.net)}; ${day.weatherComplete ? 'weather available' : 'weather incomplete'}`} onClick={() => setting('harvestDate', day.date)}><span>{shortDate(day.date)}</span><strong>{money(day.net)}</strong><small>{day.date >= plan.window.start && day.date <= plan.window.end ? 'In window' : day.weatherComplete ? 'Weather available' : 'Provisional'}</small></button>)}</div>
        <details className="planner-details"><summary>Compare all candidate dates</summary><div className="table-scroll"><table><thead><tr><th>Date</th><th>Readiness response</th><th>Target chance</th><th>Net result (USD)</th><th>Weather coverage</th></tr></thead><tbody>{plan.candidates.map(day => <tr key={day.date}><td><button className="text-button" onClick={() => setting('harvestDate', day.date)}>{formatDate(day.date)}</button></td><td>{percent(day.maturity)}</td><td>{percent(day.probability)}</td><td>{money(day.net)}</td><td>{day.weatherComplete ? 'Available' : 'Incomplete'}</td></tr>)}</tbody></table></div></details>
      </> : <p className="panel-note">Enter valid scenario and grade-target inputs to compare harvest dates.</p>}
    </section>

    <section id="what-if" className="panel planner-section">
      <div className="panel-heading"><div><h2>Interactive what-if simulator</h2><p>Changes update the harvest window, grade chance, warnings and profit comparison together.</p></div></div>
      <div className="planner-control-grid"><fieldset><legend>Readiness and harvest</legend><div className="form-grid">{dateField('maturityDate', 'Estimated crop-ready date')}{dateField('harvestDate', 'Planned harvest date')}{numberField('baselineYield', 'Baseline harvest yield', 't/ha', 0.01, 50)}{numberField('grainMoisture', 'Moisture at readiness', '%', 0, 70)}</div><div className="planner-date-actions"><button className="button button-outline" onClick={() => shiftHarvest(-7)} disabled={!isDateKey(settings.harvestDate) || addDays(settings.harvestDate, -7) < asOf}>Harvest 7 days earlier</button><button className="button button-outline" onClick={() => shiftHarvest(7)} disabled={!isDateKey(settings.harvestDate) || addDays(settings.harvestDate, 7) > addDays(asOf, 365)}>Delay by 7 days</button></div><p className="panel-note">Readiness is your estimate, not a maturity prediction. The baseline yield starts from the app’s illustrative outlook.</p></fieldset><fieldset><legend>Growing-condition changes</legend>{rangeField('rainfallChange', 'Rainfall relative to weather inputs', '%', -100, 100, 5)}{rangeField('temperatureChange', 'Temperature adjustment', '°C', -15, 15, 0.5)}{rangeField('extraIrrigation', 'Additional irrigation', ' mm', 0, 100, 5)}<button className="text-button" onClick={() => setPlanner(previous => ({ ...previous, settings: { ...previous.settings, rainfallChange: 0, temperatureChange: 0, extraIrrigation: 0 } }))}>Reset weather and irrigation adjustments</button></fieldset></div>
      {valid && <div className="table-scroll planner-baseline"><table><caption>Baseline versus your scenario</caption><thead><tr><th>Outcome</th><th>Baseline</th><th>Your scenario</th><th>Change</th></tr></thead><tbody><tr><th>Harvest date</th><td>{formatDate(plan.baseline.date)}</td><td>{formatDate(plan.current.date)}</td><td>{daysBetween(plan.baseline.date, plan.current.date)} days</td></tr><tr><th>Retained yield</th><td>{fmt(plan.baseline.retainedYield, 2)} t/ha</td><td>{fmt(plan.current.retainedYield, 2)} t/ha</td><td>{fmt(plan.current.retainedYield - plan.baseline.retainedYield, 2)} t/ha</td></tr><tr><th>Target-grade chance</th><td>{percent(plan.baseline.probability)}</td><td>{percent(plan.current.probability)}</td><td>{plan.current.probability == null ? 'No grading data' : `${fmt((plan.current.probability - plan.baseline.probability) * 100)} percentage points`}</td></tr><tr><th>Net operating result</th><td>{money(plan.baseline.net)}</td><td>{money(plan.current.net)}</td><td>{money(plan.current.net - plan.baseline.net)}</td></tr></tbody></table></div>}
      <p className="panel-note">Baseline: your readiness date, or today if already past, without weather or irrigation adjustments. Prices, costs and grade criteria are shared. Scenario yield response is illustrative, not a calibrated crop model.</p>
    </section>

    <section id="grade-target" className="panel planner-section">
      <div className="panel-heading"><div><h2>Crop quality and marketability</h2><p>Define a crop-specific target and supply grading records before estimating a chance.</p></div></div>
      <div className="planner-control-grid"><div><label className="form-field" htmlFor="grade-target-name">Target / buyer requirement name<input id="grade-target-name" maxLength={80} value={target.name} onChange={event => setPlanner(previous => ({ ...previous, target: { ...previous.target, name: event.target.value } }))} aria-invalid={!!errors.targetName} />{errors.targetName && <small className="field-error">{errors.targetName}</small>}</label><div className="grade-limit-grid">{profile.metrics.map(metric => <label className="form-field" htmlFor={`grade-${metric.key}`} key={metric.key}><span>{metric.label} ({metric.unit})<small>{metric.direction === 'min' ? 'Minimum required' : 'Maximum permitted'}</small></span><input id={`grade-${metric.key}`} type="number" min="0" max={metric.max} step="any" value={target.limits[metric.key]} onChange={event => limit(metric.key, event.target.value)} aria-invalid={!!errors[metric.key]} aria-describedby={errors[metric.key] ? `grade-error-${metric.key}` : undefined} />{errors[metric.key] && <small id={`grade-error-${metric.key}`} className="field-error">{errors[metric.key]}</small>}</label>)}</div><p className="panel-note">These defaults are custom example targets, not official grades or a buyer’s guaranteed requirements. Replace them with the specifications for your crop and market. Only the entered criteria are evaluated; other buyer requirements are not checked.</p></div><div className="grade-evidence"><label className="form-field" htmlFor="grading-evidence">Grading data<select id="grading-evidence" value={evidenceMode} onChange={event => setPlanner(previous => ({ ...previous, evidenceMode: event.target.value }))}><option value="sample">Illustrative {crop.name.toLowerCase()} records (16)</option><option value="uploaded">My crop-specific CSV records</option><option value="none">No grading data</option></select></label><label className="form-field" htmlFor="grading-file">Import local grading CSV<input ref={fileInput} id="grading-file" type="file" accept=".csv,text/csv" onChange={importRecords} /></label><button className="text-button" onClick={() => downloadText(`${farm.crop}-grading-example.csv`, gradingCsv(farm.crop, getSampleGradeRecords(farm.crop)))}>Download example CSV for {crop.name.toLowerCase()}</button>{fileMessage && <p className="panel-note" role="status">{fileMessage}</p>}{valid && <div className="grade-probability"><span className="planner-result-label">Illustrative chance of meeting this target</span><strong>{percent(plan.current.probability)}</strong><p>{plan.evidence.count ? `${plan.evidence.passes} of ${plan.evidence.count} ${evidenceMode === 'sample' ? 'example' : 'imported'} records meet every criterion (${percent(plan.evidence.observedRate)} observed pass rate).` : 'No matching crop-specific grading records are loaded. A probability is unavailable.'}</p><p>Probability applies to the selected harvest date, {formatDate(settings.harvestDate)}.</p></div>}</div></div>
      <p className="panel-note">The displayed chance uses a smoothed record pass rate with explicit demo maturity, moisture, weather and delay adjustments. Even with your own records, it is an uncalibrated scenario estimate, not a validated probability forecast.</p>
      {records.length > 0 && <details className="planner-details"><summary>Inspect {records.length} grading records</summary><div className="table-scroll"><table><thead><tr><th>Record</th>{profile.metrics.map(metric => <th key={metric.key}>{metric.label} ({metric.unit})</th>)}</tr></thead><tbody>{records.map((record, index) => <tr key={index}><td>{index + 1}</td>{profile.metrics.map(metric => <td key={metric.key}>{fmt(record[metric.key])}</td>)}</tr>)}</tbody></table></div></details>}
    </section>

    <section id="crop-risks" className="panel planner-section">
      <div className="panel-heading"><div><h2>Crop risk early warnings</h2><p>{valid ? `${activeWarnings.length} trigger${activeWarnings.length === 1 ? '' : 's'} before the selected harvest.` : 'Complete scenario inputs to calculate exposure.'} Threshold-based signals, not crop-damage probabilities.</p></div></div>
      {valid && <div className="risk-warning-list">{plan.warnings.map(warning => <article key={warning.type} className="risk-warning-row"><div><h3>{warning.label}</h3><p>{warning.detail}</p></div><div className={warning.state === 'triggered' && warning.exposed ? 'risk-active' : ''}><strong>{warning.state === 'unknown' ? 'Insufficient data' : warning.state === 'triggered' ? warning.exposed ? 'Before harvest' : 'After planned harvest' : 'No trigger found'}</strong>{warning.date && <span>{formatDate(warning.date)}{warning.leadDays === 0 ? ' · today or already overdue' : ` · in ${warning.leadDays} days`}</span>}</div></article>)}</div>}
      <details className="planner-details"><summary>Edit crop risk triggers</summary><p className="panel-note">These are example planning thresholds. Crop stage, variety, duration and field conditions affect actual damage; use locally appropriate triggers.</p><div className="planner-thresholds">{numberField('frostThreshold', 'Frost: daily minimum at or below', '°C', -15, 15)}{numberField('heatThreshold', 'Heat: daily maximum at or above', '°C', 15, 55)}{numberField('rainThreshold', 'Rain: daily total at or above', 'mm/day', 1, 200)}{numberField('waterThreshold', 'Low water: 7-day total below', 'mm / 7 days', 0, 100)}{numberField('delayThreshold', 'Delay after readiness greater than', 'days', 1, 30, 1)}</div></details>
      <p className="panel-note">Warnings run inside this app only. Low-water screening combines a complete seven-day rainfall forecast with your added irrigation; it does not assess soil water balance. Conditions outside forecast coverage remain unknown.</p>
    </section>

    <section id="profit" className="panel planner-section">
      <div className="panel-heading"><div><h2>Profit and loss comparison</h2><p>Compare expected sale value and itemized operating costs for two harvest dates. All prices and costs are in USD.</p></div></div>
      <div className="planner-compare-dates"><label className="form-field" htmlFor="profit-date-a">Date A: your selected harvest<input id="profit-date-a" type="date" min={asOf} max={addDays(asOf, 365)} value={settings.harvestDate} onChange={event => setting('harvestDate', event.target.value)} aria-invalid={!!errors.harvestDate} />{errors.harvestDate && <small className="field-error">{errors.harvestDate}</small>}</label><label className="form-field" htmlFor="profit-date-b">Date B: alternative harvest<input id="profit-date-b" type="date" min={asOf} max={addDays(asOf, 365)} value={compareDate} onChange={event => setPlanner(previous => ({ ...previous, compareDate: event.target.value }))} aria-invalid={!alternate} />{!alternate && <small className="field-error">Choose a valid alternative date within the next year.</small>}</label></div>
      {valid && alternate && <><div className="table-scroll"><table className="profit-table"><thead><tr><th>Outcome / expense</th><th>{formatDate(plan.current.date)}</th><th>{formatDate(alternate.date)}</th></tr></thead><tbody>{[
        ['Retained yield', `${fmt(plan.current.retainedYield, 2)} t/ha`, `${fmt(alternate.retainedYield, 2)} t/ha`],
        ['Harvest quantity', `${fmt(plan.current.tonnes)} t`, `${fmt(alternate.tonnes)} t`],
        ['Target-grade chance', percent(plan.current.probability), percent(alternate.probability)],
        ['Expected sale price / tonne', money(plan.current.expectedPrice), money(alternate.expectedPrice)],
        ['Gross revenue', money(plan.current.revenue), money(alternate.revenue)],
        ['Operating expenses', money(plan.current.costs.operating), money(alternate.costs.operating)],
        ['Harvesting', money(plan.current.costs.harvesting), money(alternate.costs.harvesting)],
        ['Additional irrigation', money(plan.current.costs.irrigation), money(alternate.costs.irrigation)],
        ['Drying to target moisture', money(plan.current.costs.drying), money(alternate.costs.drying)],
        ['Holding / delay costs', money(plan.current.costs.holding), money(alternate.costs.holding)],
        ['Total expenses', money(plan.current.totalCost), money(alternate.totalCost)],
        ['Net operating result', money(plan.current.net), money(alternate.net)],
        ['Net result / hectare', money(plan.current.net / fieldHectares(farm)), money(alternate.net / fieldHectares(farm))],
        ['Break-even sale price / tonne', money(plan.current.totalCost / plan.current.tonnes), money(alternate.totalCost / alternate.tonnes)],
        ['Weather coverage', plan.current.weatherComplete ? 'Available' : 'Incomplete: provisional', alternate.weatherComplete ? 'Available' : 'Incomplete: provisional'],
      ].map(([label, a, b]) => <tr key={label} className={label === 'Net operating result' ? 'profit-total' : ''}><th>{label}</th><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div><p className="profit-conclusion">{formatDate(plan.current.net >= alternate.net ? plan.current.date : alternate.date)} has a <strong>{money(Math.abs(plan.current.net - alternate.net))} higher modeled net operating result</strong> under these assumptions.{(!plan.current.weatherComplete || !alternate.weatherComplete) && ' This comparison is provisional because weather coverage is incomplete.'}</p></>}
      <details className="planner-details" open><summary>Edit price and expense assumptions</summary><div className="planner-cost-inputs">{numberField('standardPrice', 'Standard-grade sale price', 'USD / t')}{numberField('premiumPrice', 'Target-grade sale price', 'USD / t')}{numberField('operatingCost', 'Growing / other operating expenses', 'USD / ha')}{numberField('harvestingCost', 'Harvesting expense', 'USD / ha')}{numberField('irrigationCost', 'Additional irrigation expense', 'USD / mm / ha', 0, 1000)}{numberField('dryingCost', 'Drying expense', 'USD / t / moisture point', 0, 1000)}{numberField('holdingCost', 'Holding after readiness', 'USD / ha / day', 0, 10000)}</div></details>
      <p className="panel-note">Expected sale price blends target and standard prices using the illustrative target-grade chance. With no grading data, only the standard price is used. Operating expenses exclude separately entered harvesting, added irrigation, drying and holding costs. Taxes, finance and other costs are included only if you add them to operating expenses. This is a scenario comparison, not a profit guarantee.</p>
    </section>
  </>
}
