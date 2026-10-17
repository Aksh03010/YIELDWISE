import {
  Leaf,
  CloudSun,
  Layers,
  Satellite,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

const pipelineSteps = [
  {
    title: 'Data Collection',
    description:
      'The platform gathers farm location, crop type, planting season, and other user-provided parameters to define the prediction context.',
  },
  {
    title: 'Environmental Assembly',
    description:
      'Historical and recent environmental data — including temperature, rainfall, humidity, and soil properties — are assembled for the specified location and time period.',
  },
  {
    title: 'Feature Engineering',
    description:
      'Raw inputs are transformed into normalized features, including growing-degree-day accumulations, moisture indices, and soil fertility scores suitable for model consumption.',
  },
  {
    title: 'Model Inference',
    description:
      'The prepared feature set is passed through a trained machine learning model that generates a yield estimate along with confidence intervals reflecting prediction uncertainty.',
  },
  {
    title: 'Result Presentation',
    description:
      'The yield estimate is presented alongside environmental context, factor analysis, and data transparency notes so users can interpret predictions with full awareness of the underlying assumptions.',
  },
];

const dataSources = [
  {
    icon: CloudSun,
    title: 'Weather & Climate',
    description:
      'Historical temperature, rainfall, and humidity patterns sourced from meteorological datasets.',
  },
  {
    icon: Layers,
    title: 'Soil Properties',
    description:
      'Soil type, pH, organic matter, drainage characteristics derived from regional soil surveys.',
  },
  {
    icon: Satellite,
    title: 'Satellite Imagery',
    description:
      'Land use, vegetation indices, and field boundaries obtained from remote sensing platforms.',
  },
  {
    icon: BarChart3,
    title: 'Historical Yields',
    description:
      'Regional crop yield records and agricultural statistics from government and institutional sources.',
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <Leaf size={40} aria-hidden="true" />
        <h1 className="about-hero-title">About YIELD Technology</h1>
        <p className="about-hero-subtitle">
          Learn how the YIELD platform combines environmental science, machine
          learning, and agricultural data to generate crop yield predictions.
        </p>
      </header>

      <div className="about-body">
        {/* What is YIELD */}
        <section className="about-section">
          <h2 className="about-section-title">What is YIELD?</h2>
          <p className="about-text">
            YIELD — <strong>Your Environment-based Intelligence for Land
            Decisions</strong> — is a crop yield prediction platform that
            integrates environmental, geospatial, and historical agricultural
            data to estimate expected harvest outcomes. By combining
            climate patterns, soil characteristics, and satellite-derived
            land-use information with machine learning models, YIELD provides
            farmers, researchers, and agricultural planners with data-driven
            insights to support decision-making around planting, resource
            allocation, and risk management.
          </p>
        </section>

        {/* How It Works */}
        <section className="about-section">
          <h2 className="about-section-title">How It Works</h2>
          <p className="about-text">
            The prediction pipeline follows five key stages from data collection
            through result presentation:
          </p>
          <ol className="pipeline-steps">
            {pipelineSteps.map((step, idx) => (
              <li className="pipeline-step" key={idx}>
                <span className="pipeline-step-number">{idx + 1}</span>
                <div className="pipeline-step-text">
                  <strong>{step.title}:</strong> {step.description}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Data Sources */}
        <section className="about-section">
          <h2 className="about-section-title">Data Sources</h2>
          <p className="about-text">
            YIELD draws on multiple categories of geospatial and agricultural
            data to build a comprehensive picture of the growing environment:
          </p>
          <div className="about-tech-grid">
            {dataSources.map((source, idx) => {
              const Icon = source.icon;
              return (
                <div className="about-tech-card" key={idx}>
                  <Icon size={28} aria-hidden="true" />
                  <h3 className="about-tech-card-title">{source.title}</h3>
                  <p className="about-tech-card-desc">{source.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Current Status */}
        <section className="about-section">
          <h2 className="about-section-title">Current Status</h2>
          <p className="about-text">
            YIELD is currently a <strong>demonstration prototype</strong>. The
            models, data pipelines, and user interface are under active
            development. Predictions generated by the platform should be treated
            as illustrative estimates rather than operational forecasts.
            Validated, production-grade models will be integrated as the
            platform matures through testing and calibration against real-world
            agricultural outcomes.
          </p>
        </section>

        {/* Disclaimer */}
        <div className="disclaimer-banner">
          <AlertTriangle className="disclaimer-icon" size={24} />
          <p className="disclaimer-text">
            <strong>Data Transparency Notice:</strong> All data presented in
            YIELD is sourced from publicly available datasets and is used for
            demonstration purposes only. Predictions are generated by
            experimental models and should not be used as the sole basis for
            agricultural, financial, or land management decisions. We are
            committed to transparency about data origins, model limitations,
            and prediction uncertainty.
          </p>
        </div>
      </div>
    </div>
  );
}
