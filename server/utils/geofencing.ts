/**
 * Geofencing utilities for location-based services
 */

export const GEOFENCE_RADIUS = 200; // meters

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in meters
 */
export function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Check if a location is inside the geofence
 * @param currentLat - Current latitude
 * @param currentLng - Current longitude
 * @param homeLat - Home location latitude
 * @param homeLng - Home location longitude
 * @param radius - Geofence radius in meters (defaults to GEOFENCE_RADIUS)
 * @returns True if inside geofence, false otherwise
 */
export function isInsideGeofence(
  currentLat: number,
  currentLng: number,
  homeLat: number,
  homeLng: number,
  radius: number = GEOFENCE_RADIUS
): boolean {
  const distance = getDistanceInMeters(
    currentLat,
    currentLng,
    homeLat,
    homeLng
  );
  return distance <= radius;
}

/**
 * Calculate distance from current location to home
 * @param currentLat - Current latitude
 * @param currentLng - Current longitude
 * @param homeLat - Home location latitude
 * @param homeLng - Home location longitude
 * @returns Distance in meters
 */
export function getDistanceToHome(
  currentLat: number,
  currentLng: number,
  homeLat: number,
  homeLng: number
): number {
  return getDistanceInMeters(currentLat, currentLng, homeLat, homeLng);
}
