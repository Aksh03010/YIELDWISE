import { MapPin } from 'lucide-react';

export default function MapPanel({ location }) {
  if (!location) return null;

  const locationName = [location.city, location.region, location.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <span className="map-panel-title">Farm Location</span>
        <span className="env-card-badge demo">Demo data</span>
      </div>

      <div className="map-panel-body">
        <div className="map-panel-placeholder">
          <div className="map-panel-placeholder-icon">
            <MapPin size={36} />
          </div>
          <p className="map-panel-placeholder-text">
            Map visualization available when map service is configured
          </p>
          {(location.latitude != null && location.longitude != null) && (
            <p className="map-panel-coords">
              Lat: {location.latitude}, Lng: {location.longitude}
            </p>
          )}
          {locationName && (
            <p className="map-panel-coords">{locationName}</p>
          )}
        </div>
      </div>

      <div className="map-panel-footer">
        Map tiles and interactive features require a configured map provider (e.g., Mapbox,
        Leaflet). Location shown is based on user input.
      </div>
    </div>
  );
}
