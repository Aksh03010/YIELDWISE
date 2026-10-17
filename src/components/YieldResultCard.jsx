import { Wheat, MapPin, Calendar } from 'lucide-react';

export default function YieldResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="yield-card">
      <div className="yield-card-header">
        <div className="yield-card-crop">
          <Wheat size={20} />
          <span>{result.crop || result.cropName}{result.variety ? ` — ${result.variety}` : ''}</span>
        </div>
        <div className="yield-card-location">
          <MapPin size={14} />
          <span>
            {[result.location?.city, result.location?.region, result.location?.country]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
        {(result.growingSeason || result.season) && (
          <span className="yield-card-season-badge">
            <Calendar size={12} />
            {result.growingSeason || result.season}
          </span>
        )}
      </div>

      <div className="yield-card-body">
        <div className="yield-card-metrics">
          <div className="yield-metric">
            <span className="yield-metric-label">Estimated Yield</span>
            <span className="yield-metric-value">
              {result.estimatedYield}
              <span className="yield-metric-unit"> t/ha</span>
            </span>
            {result.yieldLow != null && result.yieldHigh != null && (
              <span className="yield-metric-range">
                {result.yieldLow} – {result.yieldHigh} t/ha
              </span>
            )}
          </div>

          <div className="yield-metric">
            <span className="yield-metric-label">Total Production</span>
            <span className="yield-metric-value">
              {result.totalProduction != null ? (
                <>
                  {result.totalProduction}
                  <span className="yield-metric-unit"> tonnes</span>
                </>
              ) : (
                'N/A'
              )}
            </span>
          </div>

          <div className="yield-metric">
            <span className="yield-metric-label">Field Area</span>
            <span className="yield-metric-value">
              {result.fieldArea != null ? (
                <>
                  {result.fieldArea}
                  <span className="yield-metric-unit"> ha</span>
                </>
              ) : (
                'N/A'
              )}
            </span>
          </div>

          <div className="yield-metric">
            <span className="yield-metric-label">Growing Season</span>
            <span className="yield-metric-value">{result.growingSeason || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="yield-card-footer">
        <p className="yield-card-note">
          Your estimated yield is generated from the selected farm inputs and demonstration
          environmental data. Actual results can vary with weather, crop management, pests, and
          other conditions. This is not a genuine forecast for a real farm.
        </p>
      </div>
    </div>
  );
}
