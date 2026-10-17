import { Thermometer, CloudRain, Mountain, Droplets, TrendingUp, Layers } from 'lucide-react';

export default function EnvironmentalCards({ environmental, data }) {
  const env = environmental || data;
  if (!env) return null;

  const minTemp = env.temperature?.min ?? env.temperature?.avgMin;
  const maxTemp = env.temperature?.max ?? env.temperature?.avgMax;
  const organicMatter = env.soil?.organicMatter;
  const omDisplay = typeof organicMatter === 'number' ? `${organicMatter}%` : (organicMatter ?? '—');

  const cards = [
    {
      icon: Thermometer,
      title: 'Temperature',
      value: env.temperature?.avgGrowingSeason,
      unit: '°C',
      detail: 'Growing season average',
      subRow:
        minTemp != null && maxTemp != null
          ? `Min ${minTemp}°C · Max ${maxTemp}°C`
          : null,
    },
    {
      icon: CloudRain,
      title: 'Rainfall',
      value: env.rainfall?.growingSeasonTotal,
      unit: 'mm',
      detail: 'Seasonal precipitation',
      subRow:
        env.rainfall?.annualTotal != null
          ? `Annual total: ${env.rainfall.annualTotal} mm`
          : null,
    },
    {
      icon: Mountain,
      title: 'Soil Properties',
      value: env.soil?.type,
      unit: null,
      detail: env.soil?.drainage ? `Drainage: ${env.soil.drainage}` : null,
      subRow:
        env.soil
          ? `pH ${env.soil.pH ?? '—'} · Organic matter ${omDisplay}`
          : null,
    },
    {
      icon: Droplets,
      title: 'Soil Moisture',
      value: env.soilMoisture,
      unit: '%',
      detail: 'Available water capacity for crop growth',
      subRow: null,
    },
    {
      icon: TrendingUp,
      title: 'Elevation',
      value: env.elevation,
      unit: 'm',
      detail: 'Above sea level',
      subRow: env.terrain ? `Terrain: ${env.terrain}` : null,
    },
    {
      icon: Layers,
      title: 'Terrain & Topography',
      value: env.terrain || 'Undulating',
      unit: null,
      detail: 'Local landscape profile',
      subRow: null,
    },
  ];

  return (
    <div className="env-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div className="env-card" key={card.title}>
            <div className="env-card-header">
              <div className="env-card-title-group">
                <span className="env-card-icon">
                  <Icon size={18} />
                </span>
                <span className="env-card-title">{card.title}</span>
              </div>
              <span className="env-card-badge demo">Demo data</span>
            </div>
            <div className="env-card-value">
              {card.value ?? '—'}
              {card.unit && <span className="env-card-unit"> {card.unit}</span>}
            </div>
            {card.detail && <div className="env-card-detail">{card.detail}</div>}
            {card.subRow && <div className="env-card-sub-row">{card.subRow}</div>}
          </div>
        );
      })}
    </div>
  );
}
