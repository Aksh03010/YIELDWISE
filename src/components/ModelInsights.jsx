import {
  Thermometer,
  Droplets,
  Mountain,
  Sprout,
  TrendingUp,
} from 'lucide-react';

const iconMap = {
  temperature: Thermometer,
  rainfall: Droplets,
  water: Droplets,
  soil: Mountain,
  seed: Sprout,
  historical: TrendingUp,
  elevation: Mountain,
};

function getIcon(factorName) {
  const name = (factorName || '').toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return Icon;
  }
  return Sprout;
}

const pipelineSteps = [
  'Collect farm and crop information from user inputs.',
  'Assemble environmental and historical data for the farm location.',
  'Prepare and normalize inputs for the prediction model.',
  'Generate the yield estimate using the trained model.',
  'Display the estimate alongside uncertainty and data context.',
];

export default function ModelInsights({ factors, result }) {
  const factorList = factors || result?.factors || [];
  return (
    <section className="insights-section">
      <div className="insights-header">
        <h2 className="insights-title">What Influences Your Yield?</h2>
        <p className="insights-subtitle">
          Understanding the environmental and crop-related factors associated
          with yield predictions.
        </p>
        <span className="insights-badge">Illustrative factor overview</span>
      </div>

      <div className="factor-list">
        {factorList.map((factor, idx) => {
          const Icon = getIcon(factor.name);
          return (
            <div className="factor-item" key={idx}>
              <div className="factor-icon-wrap">
                <Icon className="factor-icon" />
              </div>
              <div className="factor-content">
                <div className="factor-name-row">
                  <span className="factor-name">{factor.name}</span>
                  <span
                    className={`factor-impact ${(factor.impact || 'medium').toLowerCase()}`}
                  >
                    {factor.impact || 'medium'}
                  </span>
                </div>
                <p className="factor-desc">{factor.description}</p>
                <div className="factor-bar-bg">
                  <div
                    className="factor-bar-fill"
                    style={{ width: `${factor.relativeWeight || 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pipeline-section">
        <h3 className="pipeline-title">How the Prediction Pipeline Works</h3>
        <ol className="pipeline-steps">
          {pipelineSteps.map((step, idx) => (
            <li className="pipeline-step" key={idx}>
              <span className="pipeline-step-number">{idx + 1}</span>
              <span className="pipeline-step-text">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
