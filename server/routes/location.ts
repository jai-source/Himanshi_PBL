import { RequestHandler } from "express";
import { Location, LocationUpdateResponse, SetHomeLocationPayload, HelperPairingResponse, HelperAccessList } from "@shared/api";
import {
  isInsideGeofence,
  getDistanceToHome,
} from "../utils/geofencing";
import { locationBus } from "../services/locationBus";

// In-memory store for user locations (in production, use a database)
export const userLocations: Map<
  string,
  {
    userId: string;
    email: string;
    familyCode?: string;
    shareCode?: string;
    homeLocation?: Location;
    currentLocation?: Location;
    isInsideGeofence: boolean;
  }
> = new Map();

// In-memory store for helper access permissions
// Map<helperId, Set<userIds they have access to>>
export const helperAccess: Map<string, Set<string>> = new Map();

/**
 * Update user's current location and calculate geofence status
 * POST /api/location/update
 */
export const handleLocationUpdate: RequestHandler = (req, res) => {
  const { userId, lat, lng, familyCode } = req.body;

  if (!userId || lat === undefined || lng === undefined) {
    res.status(400).json({
      success: false,
      error: "userId, lat, and lng are required",
    });
    return;
  }

  // Get or create user location entry
  let userLocation = userLocations.get(userId);
  if (!userLocation) {
    userLocation = {
      userId,
      email: "",
      familyCode,
      isInsideGeofence: false,
    };
  }

  const currentLocation: Location = { lat, lng };

  // Calculate geofence status if home location exists
  let isInside = false;
  if (userLocation.homeLocation) {
    isInside = isInsideGeofence(
      currentLocation.lat,
      currentLocation.lng,
      userLocation.homeLocation.lat,
      userLocation.homeLocation.lng
    );
  }

  userLocation.currentLocation = currentLocation;
  userLocation.isInsideGeofence = isInside;

  // Update familyCode if provided
  if (familyCode) {
    userLocation.familyCode = familyCode;
  }

  userLocations.set(userId, userLocation);

  // Emit location update event for real-time updates
  if (userLocation.familyCode) {
    locationBus.emitLocationUpdate({
      userId,
      lat,
      lng,
      isInsideGeofence: isInside,
      timestamp: Date.now(),
    });
  }

  const response: LocationUpdateResponse = {
    success: true,
    userId,
    currentLocation,
    isInsideGeofence: isInside,
  };

  res.json(response);
};

/**
 * Set user's home location
 * POST /api/location/set-home
 */
export const handleSetHomeLocation: RequestHandler = (req, res) => {
  const { userId, lat, lng } = req.body;

  if (!userId || lat === undefined || lng === undefined) {
    res.status(400).json({
      success: false,
      error: "userId, lat, and lng are required",
    });
    return;
  }

  console.log("[SET_HOME_LOCATION] Received request:", { userId, lat, lng });

  // Get or create user location entry
  let userLocation = userLocations.get(userId);
  if (!userLocation) {
    console.log("[SET_HOME_LOCATION] Creating new user location entry for:", userId);
    userLocation = {
      userId,
      email: "",
      isInsideGeofence: false,
    };
  }

  const homeLocation: Location = { lat, lng };
  userLocation.homeLocation = homeLocation;

  // If there's a current location, recalculate geofence
  if (userLocation.currentLocation) {
    userLocation.isInsideGeofence = isInsideGeofence(
      userLocation.currentLocation.lat,
      userLocation.currentLocation.lng,
      homeLocation.lat,
      homeLocation.lng
    );
  }

  userLocations.set(userId, userLocation);

  console.log("[SET_HOME_LOCATION] Successfully saved home location:", {
    userId,
    homeLocation,
    isInsideGeofence: userLocation.isInsideGeofence,
  });

  res.json({
    success: true,
    message: "Home location set",
    homeLocation,
  });
};

/**
 * Register a user in the location system (called on login/signup)
 * POST /api/location/register-user
 */
export const handleRegisterUser: RequestHandler = (req, res) => {
  const { userId, email, shareCode, familyCode } = req.body;

  if (!userId || !email || !shareCode) {
    res.status(400).json({
      success: false,
      error: "userId, email, and shareCode are required",
    });
    return;
  }

  // Create or update user entry
  const userLocation = {
    userId,
    email,
    shareCode,
    familyCode,
    homeLocation: { lat: 0, lng: 0 }, // Default location
    currentLocation: { lat: 0, lng: 0 },
    isInsideGeofence: false,
  };

  userLocations.set(userId, userLocation);

  res.json({
    success: true,
    message: "User registered successfully",
    userId,
    shareCode,
  });
};

/**
 * Get user's location and geofence status
 * GET /api/location/:userId
 */
export const handleGetUserLocation: RequestHandler = (req, res) => {
  const { userId } = req.params;

  const userLocation = userLocations.get(userId);

  if (!userLocation) {
    res.status(404).json({
      success: false,
      error: "User location not found",
    });
    return;
  }

  res.json({
    success: true,
    data: userLocation,
  });
};

/**
 * Get all users in a family (same familyCode)
 * GET /api/location/family/:familyCode
 */
export const handleGetFamilyLocations: RequestHandler = (req, res) => {
  const { familyCode } = req.params;

  const familyUsers = Array.from(userLocations.values()).filter(
    (user) => user.familyCode === familyCode
  );

  res.json({
    success: true,
    familyCode,
    users: familyUsers,
    count: familyUsers.length,
  });
};

/**
 * Helper pairs with a user using share code
 * POST /api/helper/pair
 */
export const handleHelperPairing: RequestHandler = (req, res) => {
  const { helperId, userShareCode } = req.body;

  if (!helperId || !userShareCode) {
    res.status(400).json({
      success: false,
      error: "helperId and userShareCode are required",
    });
    return;
  }

  // Find user with this share code
  let targetUser: any = null;
  let targetUserId: string = "";

  for (const [userId, userData] of userLocations.entries()) {
    if (userData.shareCode === userShareCode) {
      targetUser = userData;
      targetUserId = userId;
      break;
    }
  }

  if (!targetUser) {
    res.status(404).json({
      success: false,
      error: "Invalid share code. User not found.",
    });
    return;
  }

  // Add to helper's access list
  if (!helperAccess.has(helperId)) {
    helperAccess.set(helperId, new Set());
  }
  helperAccess.get(helperId)!.add(targetUserId);

  res.json({
    success: true,
    message: `Successfully paired with ${targetUser.email}`,
    user: {
      id: targetUserId,
      email: targetUser.email,
      fullName: targetUser.email.split("@")[0],
      shareCode: targetUser.shareCode,
    },
  });
};

/**
 * Get all users accessible to this helper
 * GET /api/helper/:helperId/accessible-users
 */
export const handleGetAccessibleUsers: RequestHandler = (req, res) => {
  const { helperId } = req.params;

  const accessSet = helperAccess.get(helperId);
  if (!accessSet) {
    res.json({
      success: true,
      accessibleUsers: [],
    });
    return;
  }

  const accessibleUsers = Array.from(accessSet)
    .map((userId) => userLocations.get(userId))
    .filter((user) => user !== undefined)
    .map((user: any) => ({
      id: user.userId,
      email: user.email,
      fullName: user.email.split("@")[0],
      currentLocation: user.currentLocation,
      homeLocation: user.homeLocation,
      isInsideGeofence: user.isInsideGeofence,
    }));

  res.json({
    success: true,
    accessibleUsers,
  });
};
