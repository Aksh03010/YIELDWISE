import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Info, Plus, Sparkles } from 'lucide-react';
import EnvironmentalCards from '../components/EnvironmentalCards';
import ClimateCharts from '../components/ClimateCharts';
import MapPanel from '../components/MapPanel';
import { getDemoPrediction } from '../services/predictionService';

export default function EnvironmentalData() {
  const [predictionResult, setPredictionResult] = useState(() => {
    try {
      const stored = sessionStorage.getItem('predictionResult');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loadingDemo, setLoadingDemo] = useState(false);

  async function handleLoadDemo() {
    setLoadingDemo(true);
    try {
      const demoResult = await getDemoPrediction();
      sessionStorage.setItem('predictionResult', JSON.stringify(demoResult));
      setPredictionResult(demoResult);
    } catch (err) {
      console.error('Failed to load demo data', err);
    } finally {
      setLoadingDemo(false);
    }
  }

  const envData = predictionResult?.environmental || predictionResult?.environmentalData;
  const monthlyClimate = envData?.monthlyClimate || predictionResult?.climateData || [];
  const location = predictionResult?.location;

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="results-header-inner">
          <div className="results-header-top">
            <h1 className="results-header-title">
              Environmental Data &amp; Climate Insights
            </h1>
            <div className="results-header-actions">
              <Link to="/predict" className="results-header-btn results-header-btn-outline">
                <Plus size={16} />
                New Prediction
              </Link>
              {!predictionResult && (
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  disabled={loadingDemo}
                  className="results-header-btn results-header-btn-solid"
                >
                  <Sparkles size={16} />
                  {loadingDemo ? 'Loading...' : 'Load Demo Data'}
                </button>
              )}
            </div>
          </div>
          <div className="results-demo-banner">
            <Info size={16} />
            <span className="results-demo-text">
              Variables and climate records shown below represent demonstration data for illustration.
            </span>
          </div>
        </div>
      </header>

      <div className="results-body">
        {!predictionResult ? (
          <div className="yield-card">
            <div className="yield-card-body" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div className="benefit-icon-wrap" style={{ margin: '0 auto 1.5rem auto' }}>
                <Leaf className="benefit-icon" />
              </div>
              <h2 className="section-title">No Farm Environmental Data Loaded</h2>
              <p className="benefits-subtitle" style={{ marginBottom: '2rem' }}>
                Run a prediction to analyze soil properties, rainfall, temperature, and growing conditions for your specific farm location, or explore with realistic demonstration data.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/predict" className="form-btn-primary" style={{ textDecoration: 'none' }}>
                  <Plus size={18} />
                  Enter Farm Details
                </Link>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  disabled={loadingDemo}
                  className="form-btn-demo"
                >
                  <Sparkles size={18} />
                  {loadingDemo ? 'Loading Demo Data...' : 'Explore Demo Environmental Data'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="section-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <div className="section-overline">Environmental Indicators</div>
              <h2 className="section-title">Location Variables &amp; Soil Profile</h2>
              <p className="section-subtitle" style={{ margin: 0, textAlign: 'left' }}>
                Demonstration values for {[location?.city, location?.region, location?.country].filter(Boolean).join(', ')}
              </p>
            </div>

            <EnvironmentalCards environmental={envData} data={envData} />

            <div className="section-header" style={{ textAlign: 'left', marginTop: '2rem', marginBottom: '1.5rem' }}>
              <div className="section-overline">Seasonal Climate Trends</div>
              <h2 className="section-title">Temperature &amp; Precipitation Dynamics</h2>
            </div>
            <ClimateCharts monthlyClimate={monthlyClimate} data={monthlyClimate} />

            <div className="section-header" style={{ textAlign: 'left', marginTop: '2rem', marginBottom: '1.5rem' }}>
              <div className="section-overline">Geospatial Context</div>
              <h2 className="section-title">Farm Location &amp; Terrain</h2>
            </div>
            <MapPanel location={location} />

            <div className="disclaimer-banner" style={{ marginTop: '2rem' }}>
              <Info className="disclaimer-icon" />
              <div className="disclaimer-text">
                <strong>Data Provenance Notice:</strong> All environmental measurements, climate averages, and terrain profiles shown above are illustrative demonstration data. Real integration will connect to validated meteorological APIs, satellite remote-sensing indices (NDVI/EVI), and localized soil survey databases.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
