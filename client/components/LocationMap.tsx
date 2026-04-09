import { MapPin, Navigation } from "lucide-react";
import { useState, useEffect } from "react";

interface MapLocation {
  label: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
}

interface LocationMapProps {
  homeLocation?: { lat: number; lng: number };
  currentLocation?: { lat: number; lng: number };
  isInsideGeofence?: boolean;
  zoom?: number;
}

export default function LocationMap({
  homeLocation,
  currentLocation,
  isInsideGeofence,
  zoom = 15,
}: LocationMapProps) {
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [mapUrl, setMapUrl] = useState("");

  // Update map locations when props change
  useEffect(() => {
    const locations: MapLocation[] = [];

    if (homeLocation && homeLocation.lat && homeLocation.lng) {
      locations.push({
        label: "Home",
        lat: homeLocation.lat,
        lng: homeLocation.lng,
        color: "blue",
        icon: "🏠",
      });
    }

    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      locations.push({
        label: "Current",
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        color: isInsideGeofence ? "green" : "red",
        icon: isInsideGeofence ? "✅" : "🚨",
      });
    }

    setMapLocations(locations);

    // Generate Google Maps link if we have current location
    if (currentLocation?.lat && currentLocation?.lng) {
      const mapsUrl = `https://www.google.com/maps/search/${currentLocation.lat},${currentLocation.lng}/@${currentLocation.lat},${currentLocation.lng},${zoom}z`;
      setMapUrl(mapsUrl);
    }
  }, [homeLocation, currentLocation, isInsideGeofence, zoom]);

  if (mapLocations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-600">Set your home location to view the map</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Grid Map Visualization */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Location Tracking Map</h3>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
            >
              <Navigation className="h-3 w-3" />
              Open in Maps
            </a>
          )}
        </div>

        {/* Coordinates Grid */}
        <div className="space-y-3">
          {mapLocations.map((location) => (
            <div
              key={location.label}
              className={`rounded-lg border-2 p-4 ${
                location.color === "blue"
                  ? "border-blue-300 bg-blue-50"
                  : location.color === "green"
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{location.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{location.label}</p>
                    <p className="text-xs text-gray-600">
                      {location.lat.toFixed(6)} , {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distance calculation if we have both locations */}
              {mapLocations.length > 1 && location.label === "Current" && homeLocation && (
                <div className="mt-3 border-t border-current border-opacity-20 pt-3 text-xs text-gray-700">
                  <p>
                    Distance from home:{" "}
                    <span className="font-mono font-semibold">
                      {calculateDistance(homeLocation.lat, homeLocation.lng, location.lat, location.lng).toFixed(0)}
                      m
                    </span>
                  </p>
                  <p className="mt-1 text-xs">
                    Safe Zone Radius: <span className="font-mono font-semibold">200m</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">📍 How it works:</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>• <strong>Home:</strong> Your safe zone center location</li>
          <li>• <strong>Current:</strong> Your real-time location (updated every 2 seconds)</li>
          <li>• <strong>Safe Zone:</strong> 200m radius around home</li>
          <li>• Helpers see your live location when paired</li>
        </ul>
      </div>
    </div>
  );
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
