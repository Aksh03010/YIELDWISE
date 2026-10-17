import { Link } from 'react-router-dom';
import { Info, Plus, Leaf } from 'lucide-react';
import YieldResultCard from '../components/YieldResultCard';
import EnvironmentalCards from '../components/EnvironmentalCards';
import ClimateCharts from '../components/ClimateCharts';
import MapPanel from '../components/MapPanel';
import ModelInsights from '../components/ModelInsights';
import HistoricalComparison from '../components/HistoricalComparison';
import FinancialPreview from '../components/FinancialPreview';

export default function ResultsDashboard() {
  const stored = sessionStorage.getItem('predictionResult');
  const result = stored ? JSON.parse(stored) : null;

  if (!result) {
    return (
      <div className="results-page">
        <div className="results-body">
          <div className="yield-card">
            <div className="yield-card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <h2>No Prediction Results</h2>
              <p style={{ margin: '1rem 0' }}>
                It looks like you haven't run a prediction yet. Head over to the prediction form to
                get started.
              </p>
              <Link to="/predict" className="results-header-btn results-header-btn-solid">
                <Plus size={16} />
                New Prediction
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { environmental, location } = result;
  const monthlyClimate = environmental?.monthlyClimate || result.monthlyClimate || [];

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <div className="results-header-inner">
          <div className="results-header-top">
            <h1 className="results-header-title">Your Yield Prediction</h1>
            <div className="results-header-actions">
              <Link to="/predict" className="results-header-btn results-header-btn-outline">
                <Plus size={16} />
                New Prediction
              </Link>
              <Link to="/environmental" className="results-header-btn results-header-btn-outline">
                <Leaf size={16} />
                View Environmental Data
              </Link>
            </div>
          </div>
          <div className="results-demo-banner">
            <Info size={16} />
            <span className="results-demo-text">
              These results use demonstration data and are for illustration only.
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="results-body">
        <YieldResultCard result={result} />

        <div className="section-overline">Environmental Overview</div>
        <h2 className="section-title">Conditions at Your Location</h2>
        <EnvironmentalCards environmental={environmental} />

        <ClimateCharts monthlyClimate={monthlyClimate} />

        <MapPanel location={location} />

        <ModelInsights result={result} factors={result.factors} />

        <HistoricalComparison
          result={result}
          historicalYields={result.historicalYields}
          currentYield={result.estimatedYield}
          crop={result.crop}
        />

        <FinancialPreview result={result} />
      </div>
    </div>
  );
}
