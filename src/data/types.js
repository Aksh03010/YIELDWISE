/**
 * YIELD Platform — Type Definitions
 * 
 * These types define the data structures used throughout the application.
 * They serve as documentation and can be used with JSDoc type annotations.
 */

/**
 * @typedef {Object} FarmLocation
 * @property {string} country
 * @property {string} region - State, province, or region
 * @property {string} city - City or local area
 * @property {number|null} latitude
 * @property {number|null} longitude
 */

/**
 * @typedef {Object} CropInfo
 * @property {string} category - e.g., "Cereals", "Legumes"
 * @property {string} crop - e.g., "Maize", "Wheat"
 * @property {string} variety - Seed variety
 * @property {string} plantingSeason - e.g., "Spring", "Kharif"
 * @property {string} plantingDate - ISO date string
 */

/**
 * @typedef {Object} FieldConditions
 * @property {number|null} fieldArea
 * @property {string} areaUnit - "hectares" | "acres"
 * @property {string} irrigationMethod
 * @property {string} farmingMethod
 * @property {string} soilType
 */

/**
 * @typedef {Object} FarmInput
 * @property {FarmLocation} location
 * @property {CropInfo} crop
 * @property {FieldConditions} field
 */

/**
 * @typedef {Object} PredictionResult
 * @property {string} id
 * @property {string} crop
 * @property {string} variety
 * @property {FarmLocation} location
 * @property {number} estimatedYield - t/ha
 * @property {number} yieldLow - Lower bound t/ha
 * @property {number} yieldHigh - Upper bound t/ha
 * @property {number|null} fieldArea - hectares
 * @property {number|null} totalProduction - tonnes
 * @property {string} growingSeason
 * @property {string} unit - "t/ha"
 * @property {string} dataSource - "demonstration" | "model" | "api"
 * @property {string} generatedAt - ISO timestamp
 * @property {EnvironmentalData} environmental
 * @property {FactorInsight[]} factors
 * @property {HistoricalYield[]} historicalYields
 */

/**
 * @typedef {Object} EnvironmentalData
 * @property {TemperatureData} temperature
 * @property {RainfallData} rainfall
 * @property {SoilData} soil
 * @property {number} elevation - meters
 * @property {string} terrain
 * @property {number} soilMoisture - percentage
 * @property {MonthlyClimate[]} monthlyClimate
 */

/**
 * @typedef {Object} TemperatureData
 * @property {number} avgGrowingSeason - °C
 * @property {number} avgMin - °C
 * @property {number} avgMax - °C
 * @property {string} source
 */

/**
 * @typedef {Object} RainfallData
 * @property {number} annualTotal - mm
 * @property {number} growingSeasonTotal - mm
 * @property {string} source
 */

/**
 * @typedef {Object} SoilData
 * @property {string} type
 * @property {number} pH
 * @property {string} organicMatter
 * @property {string} texture
 * @property {string} drainage
 * @property {string} source
 */

/**
 * @typedef {Object} MonthlyClimate
 * @property {string} month
 * @property {number} avgTemp - °C
 * @property {number} rainfall - mm
 * @property {number} humidity - %
 */

/**
 * @typedef {Object} FactorInsight
 * @property {string} name
 * @property {string} description
 * @property {"high"|"medium"|"low"} impact
 * @property {number} relativeWeight - 0 to 100
 * @property {string} icon
 */

/**
 * @typedef {Object} HistoricalYield
 * @property {number} year
 * @property {number} yield - t/ha
 * @property {string} source
 */

// Crop data structures for the form
export const CROP_CATEGORIES = [
  {
    id: 'cereals',
    name: 'Cereals & Grains',
    crops: [
      { id: 'maize', name: 'Maize (Corn)', varieties: ['Pioneer P1197', 'DeKalb DKC 61-88', 'Syngenta NK Falcon', 'Local variety', 'Custom'] },
      { id: 'wheat', name: 'Wheat', varieties: ['HD-2967', 'PBW-343', 'Borlaug 100', 'Local variety', 'Custom'] },
      { id: 'rice', name: 'Rice', varieties: ['IR-64', 'Basmati 370', 'NERICA-L19', 'Jasmine 85', 'Local variety', 'Custom'] },
      { id: 'sorghum', name: 'Sorghum', varieties: ['NK 300', 'CSH-16', 'ICSV 745', 'Local variety', 'Custom'] },
      { id: 'barley', name: 'Barley', varieties: ['Champion', 'Pinnacle', 'Local variety', 'Custom'] },
      { id: 'millet', name: 'Millet', varieties: ['Pearl millet HHB-67', 'Finger millet GPU-28', 'Local variety', 'Custom'] },
    ],
  },
  {
    id: 'legumes',
    name: 'Legumes & Pulses',
    crops: [
      { id: 'soybeans', name: 'Soybeans', varieties: ['Williams 82', 'Asgrow AG36X6', 'JS-335', 'Local variety', 'Custom'] },
      { id: 'groundnut', name: 'Groundnut (Peanut)', varieties: ['ICGV 91114', 'JL-24', 'Local variety', 'Custom'] },
      { id: 'chickpea', name: 'Chickpea', varieties: ['Desi type', 'Kabuli type', 'ICCV 10', 'Local variety', 'Custom'] },
      { id: 'lentil', name: 'Lentil', varieties: ['Richlea', 'CDC Maxim', 'Local variety', 'Custom'] },
    ],
  },
  {
    id: 'tubers',
    name: 'Root Crops & Tubers',
    crops: [
      { id: 'potato', name: 'Potato', varieties: ['Russet Burbank', 'Kennebec', 'Kufri Jyoti', 'Local variety', 'Custom'] },
      { id: 'cassava', name: 'Cassava', varieties: ['TME 419', 'IITA TMS 30572', 'Local variety', 'Custom'] },
      { id: 'sweetpotato', name: 'Sweet Potato', varieties: ['Beauregard', 'OFSP varieties', 'Local variety', 'Custom'] },
    ],
  },
  {
    id: 'cash',
    name: 'Cash Crops',
    crops: [
      { id: 'cotton', name: 'Cotton', varieties: ['Bt Cotton', 'Pima S-7', 'Acala SJ-2', 'Local variety', 'Custom'] },
      { id: 'sugarcane', name: 'Sugarcane', varieties: ['Co-0238', 'CoJ-64', 'NCo-376', 'Local variety', 'Custom'] },
      { id: 'sunflower', name: 'Sunflower', varieties: ['KBSH-44', 'Morden', 'Local variety', 'Custom'] },
    ],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    crops: [
      { id: 'tomato', name: 'Tomato', varieties: ['Roma VF', 'Better Boy', 'Pusa Ruby', 'Local variety', 'Custom'] },
      { id: 'onion', name: 'Onion', varieties: ['Pusa Ratnar', 'N-53', 'Local variety', 'Custom'] },
      { id: 'cabbage', name: 'Cabbage', varieties: ['Golden Acre', 'Pride of India', 'Local variety', 'Custom'] },
    ],
  },
]

export const COUNTRIES = [
  'Argentina', 'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Colombia',
  'Egypt', 'Ethiopia', 'France', 'Germany', 'Ghana', 'India', 'Indonesia', 'Italy',
  'Japan', 'Kenya', 'Mexico', 'Myanmar', 'Nepal', 'Nigeria', 'Pakistan', 'Philippines',
  'Russia', 'South Africa', 'Spain', 'Tanzania', 'Thailand', 'Turkey', 'Uganda',
  'Ukraine', 'United Kingdom', 'United States', 'Vietnam', 'Zambia', 'Zimbabwe',
]

export const IRRIGATION_METHODS = [
  'Rainfed (no irrigation)',
  'Surface / flood irrigation',
  'Drip irrigation',
  'Sprinkler irrigation',
  'Center pivot',
  'Furrow irrigation',
  'Manual / bucket irrigation',
  'Other',
]

export const FARMING_METHODS = [
  'Conventional tillage',
  'Conservation tillage',
  'No-till',
  'Organic',
  'Integrated pest management (IPM)',
  'Precision agriculture',
  'Subsistence farming',
  'Other',
]

export const SOIL_TYPES = [
  'Clay',
  'Sandy',
  'Loam',
  'Silt',
  'Clay loam',
  'Sandy loam',
  'Silty clay',
  'Peat',
  'Chalky',
  'Unknown',
]

export const PLANTING_SEASONS = [
  'Spring (Mar–May)',
  'Summer (Jun–Aug)',
  'Autumn / Fall (Sep–Nov)',
  'Winter (Dec–Feb)',
  'Kharif (Jun–Oct)',
  'Rabi (Oct–Mar)',
  'Year-round',
]
