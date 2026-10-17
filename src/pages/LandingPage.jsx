import { Link } from 'react-router-dom';
import {
  MapPin,
  BarChart3,
  Target,
  ClipboardList,
  Sprout,
  AlertCircle,
  Leaf,
  TrendingUp,
  Ruler,
  Gauge,
  Calendar,
} from 'lucide-react';

function LandingPage() {
  const handleScrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="hero-topo-lines" />
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">AI-Powered Crop Intelligence</span>
            <h1 className="hero-title">
              Know Your Land.
              <br />
              Predict Your <span className="hero-title-accent">Yield.</span>
            </h1>
            <p className="hero-subtitle">
              Turn location-specific environmental data into crop-yield
              estimates. Understand how soil, weather, and growing conditions
              can influence your next harvest.
            </p>
            <div className="hero-actions">
              <Link to="/predict" className="hero-btn-primary">
                Predict My Yield
              </Link>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={handleScrollToHowItWorks}
              >
                Explore How It Works
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="hero-stat-row">
                <span className="hero-stat-label">
                  <Leaf size={16} /> Crop
                </span>
                <span className="hero-stat-value">Maize</span>
              </div>
              <div className="hero-stat-row">
                <span className="hero-stat-label">
                  <TrendingUp size={16} /> Estimated Yield
                </span>
                <span className="hero-stat-value">
                  4.2 <span className="hero-stat-unit">t/ha</span>
                </span>
              </div>
              <div className="hero-stat-row">
                <span className="hero-stat-label">
                  <Ruler size={16} /> Field Area
                </span>
                <span className="hero-stat-value">
                  50 <span className="hero-stat-unit">ha</span>
                </span>
              </div>
              <div className="hero-stat-row">
                <span className="hero-stat-label">
                  <Gauge size={16} /> Confidence
                </span>
                <span className="hero-stat-value">82%</span>
              </div>
              <div className="hero-stat-row">
                <span className="hero-stat-label">
                  <Calendar size={16} /> Season
                </span>
                <span className="hero-stat-value">Spring 2025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section className="benefits-section">
        <div className="benefits-inner">
          <div className="benefits-header">
            <span className="benefits-overline">WHY YIELD?</span>
            <h2 className="benefits-title">
              Smarter Decisions Start with Better Data
            </h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon-wrap">
                <MapPin className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Location-Based Estimation</h3>
              <p className="benefit-desc">
                Get crop-yield estimates tailored to your farm's specific
                geographical location and local growing conditions.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon-wrap">
                <BarChart3 className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Environmental Insights</h3>
              <p className="benefit-desc">
                Explore historical weather patterns, soil properties, and
                environmental factors that influence crop productivity.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon-wrap">
                <Target className="benefit-icon" />
              </div>
              <h3 className="benefit-title">Informed Planning</h3>
              <p className="benefit-desc">
                Make better-informed decisions about planting, resource
                allocation, and expected harvest outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-header">
            <span className="section-overline">HOW IT WORKS</span>
            <h2 className="section-title">
              From Farm Details to Yield Estimates
            </h2>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-number">
                <ClipboardList size={24} />
              </div>
              <h3 className="how-step-title">Enter Farm Details</h3>
              <p className="how-step-desc">
                Provide your farm location, crop selection, seed variety, and
                growing conditions.
              </p>
            </div>

            <div className="how-connector" aria-hidden="true" />

            <div className="how-step">
              <div className="how-step-number">
                <BarChart3 size={24} />
              </div>
              <h3 className="how-step-title">Analyze Conditions</h3>
              <p className="how-step-desc">
                We analyze environmental data, historical patterns, and soil
                properties for your area.
              </p>
            </div>

            <div className="how-connector" aria-hidden="true" />

            <div className="how-step">
              <div className="how-step-number">
                <Sprout size={24} />
              </div>
              <h3 className="how-step-title">Explore Your Estimate</h3>
              <p className="how-step-desc">
                Review your estimated yield along with the environmental
                factors that influence it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="disclaimer-banner">
        <AlertCircle className="disclaimer-icon" />
        <p className="disclaimer-text">
          Yield estimates are generated using demonstration data and are not
          guarantees of actual crop production. Predictions depend on data
          availability, model quality, and actual farming conditions. Always
          consult local agricultural experts.
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
