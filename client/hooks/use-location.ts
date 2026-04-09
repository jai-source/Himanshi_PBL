import { useEffect, useState, useCallback, useRef } from "react";
import { LocationUpdateEvent, LocationUpdateResponse, User } from "@shared/api";

/**
 * Hook to track location updates in real-time
 * Polls the server for location updates
 */
export function useLocationUpdates(familyCode?: string) {
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const fetchFamilyLocations = useCallback(async () => {
    if (!familyCode) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/location/family/${familyCode}`);
      const data = await response.json();

      if (data.success && data.users) {
        const updates = data.users.map(
          (user: any): LocationUpdateEvent => ({
            userId: user.userId,
            lat: user.currentLocation?.lat || 0,
            lng: user.currentLocation?.lng || 0,
            isInsideGeofence: user.isInsideGeofence ?? false,
            timestamp: Date.now(),
          })
        );
        setLocationUpdates(updates);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch locations");
    } finally {
      setIsLoading(false);
    }
  }, [familyCode]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    if (!familyCode) return;

    fetchFamilyLocations();
    pollIntervalRef.current = setInterval(fetchFamilyLocations, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [familyCode, fetchFamilyLocations]);

  return {
    locations: locationUpdates,
    isLoading,
    error,
    refetch: fetchFamilyLocations,
  };
}

/**
 * Hook to update user's current location
 */
export function useUpdateLocation() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = useCallback(
    async (userId: string, lat: number, lng: number, familyCode?: string) => {
      try {
        setIsUpdating(true);
        const response = await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, lat, lng, familyCode }),
        });

        const data: LocationUpdateResponse = await response.json();

        if (!data.success) {
          throw new Error(data.success === false ? "Failed to update location" : "Unknown error");
        }

        setError(null);
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to update location";
        setError(errorMsg);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return {
    updateLocation,
    isUpdating,
    error,
  };
}

/**
 * Hook to set home location
 */
export function useSetHomeLocation() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setHomeLocation = useCallback(
    async (userId: string, lat: number, lng: number) => {
      try {
        setIsUpdating(true);
        const response = await fetch("/api/location/set-home", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, lat, lng }),
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } else {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to set home location");
        }

        setError(null);
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to set home location";
        setError(errorMsg);
        console.error("[useSetHomeLocation] Error:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return {
    setHomeLocation,
    isUpdating,
    error,
  };
}

/**
 * Hook to get user's current location
 */
export function useUserLocation(userId?: string) {
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/location/${userId}`);
      const data = await response.json();

      if (data.success) {
        setLocation(data.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch location");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    isLoading,
    error,
    refetch: fetchLocation,
  };
}

/**
 * Hook to get geofence status
 */
export function useGeofenceStatus(userId?: string) {
  const { location } = useUserLocation(userId);

  return {
    isInsideGeofence: location?.isInsideGeofence ?? false,
    homeLocation: location?.homeLocation,
    currentLocation: location?.currentLocation,
  };
}

/**
 * Hook for live location updates of a specific user
 * Polls server every 2 seconds for real-time location
 */
export function useUserLiveLocation(userId?: string) {
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const fetchLiveLocation = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/location/${userId}`);
      const data = await response.json();

      if (data.success) {
        setLiveLocation(data.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch location");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Poll for updates every 2 seconds
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    fetchLiveLocation();
    pollIntervalRef.current = setInterval(fetchLiveLocation, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId, fetchLiveLocation]);

  return {
    liveLocation,
    isLoading,
    error,
    refetch: fetchLiveLocation,
  };
}

/**
 * Hook for automatically tracking and updating user's live location
 * Sends location to server every 10 seconds for continuous tracking
 */
export function useAutoLocationTracking(userId?: string, familyCode?: string) {
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout>();

  const updateCurrentLocation = useCallback(async () => {
    if (!userId || !navigator.geolocation) return;

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetch("/api/location/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              lat: latitude,
              lng: longitude,
              familyCode,
            }),
          });
        },
        (err) => {
          console.log("[useAutoLocationTracking] Geolocation error:", err.code);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } catch (err) {
      console.error("[useAutoLocationTracking] Error:", err);
    }
  }, [userId, familyCode]);

  // Start tracking
  useEffect(() => {
    if (!userId) return;

    setIsTracking(true);

    // Update location immediately
    updateCurrentLocation();

    // Then update every 10 seconds
    trackingIntervalRef.current = setInterval(updateCurrentLocation, 10000);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      setIsTracking(false);
    };
  }, [userId, updateCurrentLocation]);

  return {
    isTracking,
  };
}
