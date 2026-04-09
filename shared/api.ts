/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface CurrencyDetectionResponse {
  note: string;
  confidence: number;
  status: string;
  matchedTemplate: string | null;
  goodMatches: number;
  detections?: Detection[];
}

export interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface ObjectDetectionResponse {
  detections: Detection[];
}

// ============= Location & Geofencing Types =============

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "helper";
  familyCode?: string;
  shareCode?: string; // Unique code for sharing access with helpers
  homeLocation?: Location;
  currentLocation?: Location;
  isInsideGeofence?: boolean;
}

export interface LocationUpdatePayload {
  lat: number;
  lng: number;
}

export interface LocationUpdateResponse {
  success: boolean;
  userId: string;
  currentLocation: Location;
  isInsideGeofence: boolean;
}

export interface SetHomeLocationPayload {
  lat: number;
  lng: number;
}

export interface GeofenceStatus {
  userId: string;
  isInsideGeofence: boolean;
  distanceFromHome?: number;
}

// WebSocket event types
export interface LocationUpdateEvent {
  userId: string;
  lat: number;
  lng: number;
  isInsideGeofence: boolean;
  timestamp: number;
}

// Helper-User Pairing
export interface HelperPairingPayload {
  userShareCode: string;
}

export interface HelperPairingResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    shareCode: string;
  };
}

export interface HelperAccessList {
  success: boolean;
  accessibleUsers: Array<{
    id: string;
    email: string;
    fullName: string;
    currentLocation?: Location;
    homeLocation?: Location;
    isInsideGeofence: boolean;
  }>;
}
