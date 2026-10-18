import { calculateHarvestTiming, formatHarvestDate } from '../services/harvestTiming.js'
import { formatNumber as fmt } from '../data/agriculture.js'

export default function HarvestTiming({ crop, result, target, plantingDate, onDateChange, dirty, loading, locationDriven = false }) {
  const maturity = crop === 'soybeans'
  const mae = target?.test_metrics.MAE_in_target_units ?? target?.test_metrics.environment_macro_mae
  const timing = calculateHarvestTiming(plantingDate, result?.value, mae)
  return <section className="card harvest-timing" id="harvest-timing" aria-busy={loading}>
    <div className="tile-head"><h2>{maturity ? 'Maturity timing' : 'Harvest timing'}</h2><span className="source-status">From the trained timing model</span></div>
    <label className="field harvest-planting-date">{locationDriven ? 'Planting date' : 'Planting date for calendar display'}<input type="date" value={plantingDate} onChange={event => onDateChange(event.target.value)} /></label>
    {timing ? <>
      <div className="harvest-date-grid"><div><p className="stat-note">{maturity ? 'Estimated R8 maturity date' : 'Estimated harvest date'}</p><p className="harvest-date-value">{formatHarvestDate(timing.center)}</p><p className="source-note">About {timing.days} days after planting</p></div>
        <div><p className="stat-note">Typical-error planning range</p><p className="harvest-date-range">{formatHarvestDate(timing.start)} to {formatHarvestDate(timing.end)}</p><p className="source-note">±{timing.errorDays} days around the estimated date</p></div></div>
      <p className="source-note">The range uses the held-out average absolute error of {fmt(mae, 1)} days, rounded up. It is a planning guide, not a calibrated confidence interval or a recommendation based on upcoming weather.</p>
    </> : <p className="source-note" role="status">{dirty ? 'Run prediction with the edited inputs to update timing.' : loading ? 'Calculating harvest timing…' : result?.error || (!plantingDate ? 'Enter a planting date to show the estimated calendar dates.' : 'Run the model to calculate timing for these inputs.')}</p>}
    <p className="helper">{maturity ? 'R8 marks physiological maturity. The time from R8 to harvest depends on drying and field conditions; this model does not estimate that gap.' : 'This model estimates when harvest operations occurred in trial data. Confirm grain readiness and the weather before choosing a harvest day.'}</p>
    <p className="helper">{locationDriven ? 'Changing the planting date requires a new location-based estimate and a new 31-day environmental window.' : maturity ? 'Changing the planting day updates the soybean model input. Run prediction again after editing it.' : 'This planting date anchors the calendar display. Changing it does not replace the model’s 31-day weather inputs.'}</p>
  </section>
}
