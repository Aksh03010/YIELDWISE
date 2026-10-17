# YIELD — Your Environment-based Intelligence for Land Decisions

> An agricultural intelligence platform that helps farmers and agricultural planners estimate crop production per hectare based on farm location, seed variety, historical weather patterns, soil properties, and environmental conditions.

---

## 🌾 Overview

**YIELD** translates complex, multi-source environmental and agronomic datasets into actionable crop-yield forecasts. Built as a precision-agriculture prototype, the application features an end-to-end user journey from farm profile intake to interactive predictions, climate analysis, and factor attribution.

All predictive and environmental values in this release are **clearly labelled demonstration data**, establishing a robust front-end architecture ready for future integration with live meteorological APIs and trained machine learning inference models.

---

## ✨ Features

### 1. Landing Page
- **Hero Presentation**: Headline *"Know Your Land. Predict Your Yield."* with high-contrast precision-agriculture typography, topographic contours, and live demonstration metric card.
- **Value Proposition**: 3 core pillars (Location-Based Estimation, Environmental Insights, Better-Informed Planning).
- **Interactive Explainer**: 3-step workflow (Enter details → Analyze conditions → Explore estimate).
- **Transparency Disclaimer**: Clear advisory regarding model assumptions and data limitations.

### 2. Multi-Section Crop Prediction Form
- **Section A: Farm Location**
  - Country selector (36+ agricultural nations).
  - Region (state / province) and city / local area inputs.
  - Interactive coordinate toggles (Latitude & Longitude) with manual entry and map fallback.
  - One-click **Demo Mode** to test the system with realistic Kenyan Rift Valley maize farming data.
- **Section B: Crop Information**
  - Searchable hierarchical categories (Cereals, Legumes, Tubers, Cash crops, Vegetables).
  - Crop varieties with dynamic filtering and **Custom Variety** entry.
  - Planting season selection and date picker.
- **Section C: Field & Growing Conditions**
  - Field area input with hectare / acre unit conversion.
  - Irrigation methods (Rainfed, Drip, Sprinkler, Center Pivot, Furrow, etc.).
  - Farming practices (No-till, Conservation tillage, Organic, IPM, Precision ag).
  - Soil classification selector (Clay, Sandy, Loam, Silt, Peat, etc.).
- **Form UX**: Multi-step progress bar with backwards navigation, inline field validation, and accessible focus states.

### 3. Yield Prediction Results Dashboard
- **Primary Yield Card**:
  - Estimated yield in tonnes per hectare (**t/ha**).
  - Total production calculation in tonnes (when field area is provided).
  - Illustrative uncertainty intervals (e.g. 3.4 – 4.8 t/ha).
  - Growing season coverage and crop variety summary.
- **Demonstration Notice**: Explicit callout differentiating demonstration estimates from genuine forecasts.

### 4. Environmental Conditions & Climate Visuals
- **Telemetry Indicators**: Cards for temperature averages, precipitation totals, soil profile (pH, texture, organic matter, drainage), soil moisture, elevation, and terrain.
- **Interactive Recharts Charts**:
  - Growing-season temperature dynamics (smooth AreaChart with gradient shading).
  - Monthly precipitation distribution (BarChart in forest green theme).
- **Farm Map Panel**: Geospatial coordinate grid visualization with provider placeholder notice.

### 5. Model Insights ("What Influences Your Yield?")
- **Factor Attribution**: Relative weighting bars for Temperature, Rainfall, Soil Properties, Seed Genetics, Historical Benchmarks, and Topography.
- **Prediction Pipeline**: 5-step transparent architectural explanation from ingestion to uncertainty estimation.

### 6. Historical & Scenario Comparison
- **ComposedChart Benchmark**: Multi-year regional historical yields contrasted with the current estimate via dashed reference threshold lines.

### 7. Farm Financial Outlook (Preview)
- Preview of future financial capabilities including Expected Revenue, Operating Costs, Estimated Profit/Loss, and Sensitivity Analysis — marked as **Coming Soon**.

### 8. About the Technology Page
- Deep dive into YIELD's mission, data pipeline mechanics, data source specifications (Weather & Climate, Soil Surveys, Remote Sensing / Satellite, Official Yield Records), and prototype status.

---

## 🎨 Design & Styling Architecture

- **Palette**: Deep forest green (`#1B4332`), forest light (`#2D6A4F`), muted sage (`#95A88C`), warm cream (`#FAFAF5`), earth tones (`#8B7355`), and crisp borders.
- **Single Stylesheet Architecture**: All styles reside in [`src/app.css`](file:///c:/Users/akshi/Documents/HARVEST/src/app.css) using Tailwind CSS v4 `@apply` rules and custom component classes. **JSX files remain clean and uncluttered by lengthy inline utility classes.**
- **Typography**: Playfair Display for editorial headers paired with Inter for clean, legible numeric dashboards.
- **Icons**: Lucide React.
- **Charts**: Recharts with custom responsive containers and theme-aligned palettes.

---

## 🛠️ Project Structure

```
HARVEST/
├── public/
│   ├── favicon.svg             # Leaf/sprout SVG brand icon
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ClimateCharts.jsx   # Temperature & Rainfall Area/Bar charts
│   │   ├── EnvironmentalCards.jsx # 6 Environmental telemetry cards
│   │   ├── ErrorState.jsx      # Reusable error boundaries
│   │   ├── FinancialPreview.jsx# Future financial outlook cards
│   │   ├── Footer.jsx          # Global brand footer
│   │   ├── HistoricalComparison.jsx # Benchmark comparison chart
│   │   ├── LoadingState.jsx    # 5-step animated model inference simulation
│   │   ├── MapPanel.jsx        # Geospatial map placeholder panel
│   │   ├── ModelInsights.jsx   # Factor attribution & pipeline overview
│   │   ├── Navbar.jsx          # Global navigation with active states & mobile menu
│   │   └── YieldResultCard.jsx # Hero yield metrics card
│   ├── data/
│   │   └── types.js            # Reference taxonomies (crops, soils, countries, etc.)
│   ├── pages/
│   │   ├── AboutPage.jsx       # Technology & data sources explainer
│   │   ├── EnvironmentalData.jsx # Dedicated environmental dashboard
│   │   ├── LandingPage.jsx     # Marketing & value proposition page
│   │   ├── PredictionForm.jsx  # Multi-step prediction intake form
│   │   └── ResultsDashboard.jsx# Full results report page
│   ├── services/
│   │   └── predictionService.js# Decoupled mock prediction engine
│   ├── app.css                 # Master centralized stylesheet with Tailwind
│   ├── App.jsx                 # Router config & scroll-to-top handler
│   └── main.jsx                # React root mount
├── package.json
├── vite.config.js
└── index.html
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
```bash
# Clone or navigate to the repository
cd HARVEST

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

### Code Quality & Linting
```bash
npm run lint
```
The codebase strictly adheres to ESLint rules and React 19 standards (0 errors, 0 warnings).

---

## 🔒 Data Provenance & Ethics Note

YIELD is explicitly designed to maintain trust and data transparency:
- Demonstration numbers are never misrepresented as satellite telemetry or active ML inference.
- Uncertainty intervals are displayed to remind users that agricultural yields depend on variable in-season weather, pest pressures, and field management.
