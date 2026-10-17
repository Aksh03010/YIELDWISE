import { DollarSign, TrendingDown, PiggyBank, BarChart3 } from 'lucide-react';

const financialCards = [
  { label: 'Expected Revenue', icon: DollarSign },
  { label: 'Operating Costs', icon: TrendingDown },
  { label: 'Estimated Profit', icon: PiggyBank },
  { label: 'Price Sensitivity', icon: BarChart3 },
];

export default function FinancialPreview() {
  return (
    <section className="financial-section">
      <div className="financial-header">
        <h2 className="financial-title">Farm Financial Outlook</h2>
        <span className="financial-badge">Coming Soon</span>
      </div>

      <div className="financial-grid">
        {financialCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div className="financial-card" key={idx}>
              <div className="financial-card-overlay">
                <span className="financial-card-coming">Coming soon</span>
              </div>
              <Icon size={24} aria-hidden="true" />
              <span className="financial-card-label">{card.label}</span>
              <span className="financial-card-value">&mdash;</span>
            </div>
          );
        })}
      </div>

      <p className="yield-card-note">
        Financial projections require validated crop price data, regional cost
        inputs, and a calibrated economic model. These features are under
        development and will be available in a future release.
      </p>
    </section>
  );
}
