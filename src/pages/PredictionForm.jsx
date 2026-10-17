import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Sprout,
  Settings,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Map,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  CROP_CATEGORIES,
  COUNTRIES,
  IRRIGATION_METHODS,
  FARMING_METHODS,
  SOIL_TYPES,
  PLANTING_SEASONS,
} from '../data/types.js'
import { getPrediction, getDemoPrediction } from '../services/predictionService.js'
import LoadingState from '../components/LoadingState.jsx'

const STEPS = ['Farm Location', 'Crop Info', 'Field Conditions']

export default function PredictionForm() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    location: {
      country: '',
      region: '',
      city: '',
      latitude: '',
      longitude: '',
    },
    crop: {
      category: '',
      crop: '',
      variety: '',
      customVariety: '',
      plantingSeason: '',
      plantingDate: '',
    },
    field: {
      fieldArea: '',
      areaUnit: 'hectares',
      irrigationMethod: '',
      farmingMethod: '',
      soilType: '',
    },
  })

  // ── Helpers ──────────────────────────────────────────────

  function updateLocation(key, value) {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [key]: value },
    }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function updateCrop(key, value) {
    const updates = { [key]: value }
    // Reset dependent fields when parent changes
    if (key === 'category') {
      updates.crop = ''
      updates.variety = ''
      updates.customVariety = ''
    }
    if (key === 'crop') {
      updates.variety = ''
      updates.customVariety = ''
    }
    setFormData(prev => ({
      ...prev,
      crop: { ...prev.crop, ...updates },
    }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function updateField(key, value) {
    setFormData(prev => ({
      ...prev,
      field: { ...prev.field, [key]: value },
    }))
  }

  // ── Derived data ─────────────────────────────────────────

  const selectedCategory = CROP_CATEGORIES.find(c => c.id === formData.crop.category)
  const cropsForCategory = selectedCategory ? selectedCategory.crops : []
  const selectedCrop = cropsForCategory.find(c => c.id === formData.crop.crop)
  const varietiesForCrop = selectedCrop ? selectedCrop.varieties : []

  // ── Validation ───────────────────────────────────────────

  function validateStep(step) {
    const newErrors = {}

    if (step === 1) {
      if (!formData.location.country) newErrors.country = 'Country is required'
      if (!formData.location.region.trim()) newErrors.region = 'Region is required'
      if (!formData.location.city.trim()) newErrors.city = 'City is required'
    }

    if (step === 2) {
      if (!formData.crop.category) newErrors.category = 'Crop category is required'
      if (!formData.crop.crop) newErrors.crop = 'Crop selection is required'
      if (!formData.crop.variety) newErrors.variety = 'Variety is required'
    }

    // Step 3 has no required fields

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Navigation ───────────────────────────────────────────

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  function handleBack() {
    setCurrentStep(prev => prev - 1)
  }

  // ── Submission ───────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      // Build the payload, resolving the crop name for the service
      const payload = {
        location: {
          ...formData.location,
          latitude: formData.location.latitude ? Number(formData.location.latitude) : null,
          longitude: formData.location.longitude ? Number(formData.location.longitude) : null,
        },
        crop: {
          ...formData.crop,
          cropName: selectedCrop?.name || formData.crop.crop,
          variety:
            formData.crop.variety === 'Custom'
              ? formData.crop.customVariety || 'Custom variety'
              : formData.crop.variety,
        },
        field: {
          ...formData.field,
          fieldArea: formData.field.fieldArea ? Number(formData.field.fieldArea) : null,
        },
      }
      const result = await getPrediction(payload)
      sessionStorage.setItem('predictionResult', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      console.error('Prediction failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDemoMode() {
    setIsSubmitting(true)
    try {
      const result = await getDemoPrediction()
      sessionStorage.setItem('predictionResult', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      console.error('Demo prediction failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Progress Bar ─────────────────────────────────────────

  function renderProgressBar() {
    return (
      <div className="form-progress">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          let circleClass = 'form-progress-circle '
          if (isActive) circleClass += 'active'
          else if (isCompleted) circleClass += 'completed'
          else circleClass += 'inactive'

          return (
            <div
              key={label}
              className="form-progress-step"
              onClick={() => {
                if (stepNum < currentStep) setCurrentStep(stepNum)
              }}
              style={{ cursor: stepNum < currentStep ? 'pointer' : 'default' }}
              title={stepNum < currentStep ? `Go back to ${label}` : undefined}
            >
              <div className={circleClass}>{stepNum}</div>
              <span className={`form-progress-label${!isActive && !isCompleted ? ' inactive' : ''}`}>
                {label}
              </span>
              {stepNum < STEPS.length && (
                <div className={`form-progress-line${stepNum < currentStep ? ' active' : ' inactive'}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Inline error helper ──────────────────────────────────

  function renderError(field) {
    if (!errors[field]) return null
    return (
      <div className="form-error-msg">
        <AlertCircle size={12} />
        {errors[field]}
      </div>
    )
  }

  // ── Step 1: Farm Location ────────────────────────────────

  function renderStep1() {
    return (
      <div className="form-section">
        <div className="form-section-header">
          <MapPin className="form-section-icon" />
          <div>
            <h2 className="form-section-title">Farm Location</h2>
            <p className="form-section-subtitle">Tell us where your farm is located</p>
          </div>
        </div>

        {/* Country */}
        <div className="form-group">
          <label className="form-label" htmlFor="country">
            Country <span className="form-label-required">*</span>
          </label>
          <select
            id="country"
            className={`form-select${errors.country ? ' error' : ''}`}
            value={formData.location.country}
            onChange={e => updateLocation('country', e.target.value)}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {renderError('country')}
        </div>

        {/* Region */}
        <div className="form-group">
          <label className="form-label" htmlFor="region">
            Region <span className="form-label-required">*</span>
          </label>
          <input
            id="region"
            type="text"
            className={`form-input${errors.region ? ' error' : ''}`}
            placeholder="State, province, or region"
            value={formData.location.region}
            onChange={e => updateLocation('region', e.target.value)}
          />
          {renderError('region')}
        </div>

        {/* City */}
        <div className="form-group">
          <label className="form-label" htmlFor="city">
            City <span className="form-label-required">*</span>
          </label>
          <input
            id="city"
            type="text"
            className={`form-input${errors.city ? ' error' : ''}`}
            placeholder="City or local area"
            value={formData.location.city}
            onChange={e => updateLocation('city', e.target.value)}
          />
          {renderError('city')}
        </div>

        {/* Coordinates toggle */}
        <div className="form-group">
          <button
            type="button"
            className="form-btn-secondary"
            onClick={() => setShowCoordinates(prev => !prev)}
          >
            <MapPin size={16} />
            {showCoordinates ? 'Hide Coordinates' : 'Add GPS Coordinates'}
          </button>

          {showCoordinates && (
            <div className="coord-inputs">
              <div>
                <label className="form-label" htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. -1.2921"
                  value={formData.location.latitude}
                  onChange={e => updateLocation('latitude', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 36.8219"
                  value={formData.location.longitude}
                  onChange={e => updateLocation('longitude', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Map placeholder */}
        <div className="map-placeholder">
          <Map className="map-placeholder-icon" />
          <span className="map-placeholder-text">
            Interactive map available when map service is configured
          </span>
        </div>
        <p className="form-helper">Enter coordinates manually or use the map when available</p>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="form-btn-primary" onClick={handleNext}>
            Next: Crop Information
            <ChevronRight size={18} />
          </button>
          <button type="button" className="form-btn-demo" onClick={handleDemoMode} disabled={isSubmitting}>
            <Sparkles size={16} />
            {isSubmitting ? 'Loading…' : 'Try Demo Mode'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Crop Information ─────────────────────────────

  function renderStep2() {
    return (
      <div className="form-section">
        <div className="form-section-header">
          <Sprout className="form-section-icon" />
          <div>
            <h2 className="form-section-title">Crop Information</h2>
            <p className="form-section-subtitle">Select the crop you plan to grow</p>
          </div>
        </div>

        {/* Crop category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category">
            Crop Category <span className="form-label-required">*</span>
          </label>
          <select
            id="category"
            className={`form-select${errors.category ? ' error' : ''}`}
            value={formData.crop.category}
            onChange={e => updateCrop('category', e.target.value)}
          >
            <option value="">Select a category</option>
            {CROP_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {renderError('category')}
        </div>

        {/* Specific crop */}
        <div className="form-group">
          <label className="form-label" htmlFor="crop">
            Specific Crop <span className="form-label-required">*</span>
          </label>
          <select
            id="crop"
            className={`form-select${errors.crop ? ' error' : ''}`}
            value={formData.crop.crop}
            onChange={e => updateCrop('crop', e.target.value)}
            disabled={!formData.crop.category}
          >
            <option value="">Select a crop</option>
            {cropsForCategory.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {renderError('crop')}
        </div>

        {/* Seed variety */}
        <div className="form-group">
          <label className="form-label" htmlFor="variety">
            Seed Variety <span className="form-label-required">*</span>
          </label>
          <select
            id="variety"
            className={`form-select${errors.variety ? ' error' : ''}`}
            value={formData.crop.variety}
            onChange={e => updateCrop('variety', e.target.value)}
            disabled={!formData.crop.crop}
          >
            <option value="">Select a variety</option>
            {varietiesForCrop.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {renderError('variety')}

          {/* Custom variety text input */}
          {formData.crop.variety === 'Custom' && (
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label" htmlFor="customVariety">Custom Variety Name</label>
              <input
                id="customVariety"
                type="text"
                className="form-input"
                placeholder="Enter your variety name"
                value={formData.crop.customVariety}
                onChange={e => updateCrop('customVariety', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Planting season */}
        <div className="form-group">
          <label className="form-label" htmlFor="plantingSeason">Planting Season</label>
          <select
            id="plantingSeason"
            className="form-select"
            value={formData.crop.plantingSeason}
            onChange={e => updateCrop('plantingSeason', e.target.value)}
          >
            <option value="">Select a season (optional)</option>
            {PLANTING_SEASONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Planting date */}
        <div className="form-group">
          <label className="form-label" htmlFor="plantingDate">Planting Date</label>
          <input
            id="plantingDate"
            type="date"
            className="form-input"
            value={formData.crop.plantingDate}
            onChange={e => updateCrop('plantingDate', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="form-btn-secondary" onClick={handleBack}>
            <ChevronLeft size={18} />
            Back
          </button>
          <button type="button" className="form-btn-primary" onClick={handleNext}>
            Next: Field Conditions
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Field & Growing Conditions ───────────────────

  function renderStep3() {
    return (
      <div className="form-section">
        <div className="form-section-header">
          <Settings className="form-section-icon" />
          <div>
            <h2 className="form-section-title">Field &amp; Growing Conditions</h2>
            <p className="form-section-subtitle">Optional details for a more accurate estimate</p>
          </div>
        </div>

        {/* Field area + unit */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="fieldArea">Field Area</label>
            <input
              id="fieldArea"
              type="number"
              min="0"
              step="any"
              className="form-input"
              placeholder="e.g. 50"
              value={formData.field.fieldArea}
              onChange={e => updateField('fieldArea', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="areaUnit">Unit</label>
            <select
              id="areaUnit"
              className="form-select"
              value={formData.field.areaUnit}
              onChange={e => updateField('areaUnit', e.target.value)}
            >
              <option value="hectares">Hectares</option>
              <option value="acres">Acres</option>
            </select>
          </div>
        </div>

        {/* Irrigation method */}
        <div className="form-group">
          <label className="form-label" htmlFor="irrigationMethod">Irrigation Method</label>
          <select
            id="irrigationMethod"
            className="form-select"
            value={formData.field.irrigationMethod}
            onChange={e => updateField('irrigationMethod', e.target.value)}
          >
            <option value="">Select method (optional)</option>
            {IRRIGATION_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Farming method */}
        <div className="form-group">
          <label className="form-label" htmlFor="farmingMethod">Farming Method</label>
          <select
            id="farmingMethod"
            className="form-select"
            value={formData.field.farmingMethod}
            onChange={e => updateField('farmingMethod', e.target.value)}
          >
            <option value="">Select method (optional)</option>
            {FARMING_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Soil type */}
        <div className="form-group">
          <label className="form-label" htmlFor="soilType">Soil Type</label>
          <select
            id="soilType"
            className="form-select"
            value={formData.field.soilType}
            onChange={e => updateField('soilType', e.target.value)}
          >
            <option value="">Select type (optional)</option>
            {SOIL_TYPES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <p className="form-helper">Fields marked optional help improve estimate accuracy</p>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="form-btn-secondary" onClick={handleBack}>
            <ChevronLeft size={18} />
            Back
          </button>
          <button
            type="submit"
            className="form-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="loading-spinner" />
                Generating Prediction…
              </>
            ) : (
              <>
                Get Yield Prediction
                <Sparkles size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ── Main Render ──────────────────────────────────────────

  if (isSubmitting) {
    return <LoadingState />
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h1 className="form-page-title">Predict Your Crop Yield</h1>
        <p className="form-page-subtitle">
          Enter your farm details to receive an AI-powered yield estimate
        </p>
      </div>

      <div className="form-container">
        {renderProgressBar()}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </form>
      </div>
    </div>
  )
}
