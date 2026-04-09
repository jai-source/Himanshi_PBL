import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, RefreshCw, Users, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import LocationMap from "@/components/LocationMap";
import { useAuth } from "@/lib/auth";
import { useUserLiveLocation } from "@/hooks/use-location";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function UserCard({ user }: { user: any }) {
  const { liveLocation, isLoading } = useUserLiveLocation(user.id);
  const [showDetails, setShowDetails] = useState(false);

  // Use live location if available, fallback to initial data
  const displayLocation = liveLocation || user;
  const isInside = displayLocation?.isInsideGeofence ?? false;
  const statusColor = isInside
    ? "bg-green-100 border-green-300 text-green-700"
    : "bg-red-100 border-red-300 text-red-700";
  const statusIcon = isInside ? (
    <CheckCircle2 className="h-5 w-5" />
  ) : (
    <AlertCircle className="h-5 w-5" />
  );
  const statusText = isInside ? "Safe Zone ✅" : "Outside Zone 🚨";

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
      <div className="space-y-4">
        {/* Name with Live Indicator */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{displayLocation?.fullName || displayLocation?.email || "Unknown User"}</h3>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            <span className="text-xs font-semibold text-gray-600">
              {isLoading ? "Updating..." : "Live"}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${statusColor}`}>
          {statusIcon}
          <span className="font-medium">{statusText}</span>
        </div>

        {/* Location Info */}
        <div className="space-y-2 text-sm">
          {displayLocation?.currentLocation ? (
            <>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-600">Current Location</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                    {displayLocation.currentLocation.lat.toFixed(6)}, {displayLocation.currentLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No location data available</p>
          )}

          {displayLocation?.homeLocation && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-gray-600">Home Location</p>
                <p className="font-mono text-xs bg-blue-50 p-2 rounded break-all">
                  {displayLocation.homeLocation.lat.toFixed(6)}, {displayLocation.homeLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expand hint */}
        {!showDetails && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">Click to expand details...</p>
          </div>
        )}

        {/* Expanded Details */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <div className="bg-blue-50 p-3 rounded space-y-2">
              <p className="text-xs font-semibold text-blue-900">Live Updates</p>
              <p className="text-xs text-blue-800">
                Location updates every 2 seconds. Coordinates shown to 6 decimal places for precision.
              </p>
            </div>
            
            {/* Location Map */}
            <div className="py-2">
              <LocationMap
                homeLocation={displayLocation?.homeLocation}
                currentLocation={displayLocation?.currentLocation}
                isInsideGeofence={displayLocation?.isInsideGeofence}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-600 font-semibold">Latitude</p>
                <p className="font-mono text-sm">{displayLocation?.currentLocation?.lat?.toFixed(4) || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-600 font-semibold">Longitude</p>
                <p className="font-mono text-sm">{displayLocation?.currentLocation?.lng?.toFixed(4) || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="pt-2 border-t flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
          <Zap className={`h-3 w-3 ${isLoading ? "text-yellow-500" : "text-green-500"}`} />
        </div>
      </div>
    </Card>
  );
}

export default function HelperDashboard() {
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState("");

  const fetchAccessibleUsers = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingUsers(true);
      const response = await fetch(`/api/helper/${user.id}/accessible-users`);
      const data = await response.json();

      if (data.success && data.accessibleUsers) {
        setUsers(data.accessibleUsers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAccessibleUsers();
  }, [user?.id]);

  async function handlePairWithUser() {
    if (!shareCode.trim() || !user?.id) {
      setPairingError("Please enter a share code");
      return;
    }

    setIsPairing(true);
    setPairingError("");

    try {
      const response = await fetch("/api/helper/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helperId: user.id,
          userShareCode: shareCode.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          setPairingError(errorData.error || `Server error: ${response.status}`);
        } else {
          setPairingError(`Server error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setPairingError(data.error || "Failed to pair with user");
        return;
      }

      setShareCode("");
      setPairingError("");
      await fetchAccessibleUsers();
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : "Failed to pair with user");
    } finally {
      setIsPairing(false);
    }
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  const isHelper = user.role === "helper";

  if (!isHelper) {
    return (
      <div className="min-h-screen detectify-bg flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600">
              This dashboard is only available to helpers.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen detectify-bg flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 justify-between lg:flex-row lg:items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Helper Dashboard</h1>
              <p className="text-gray-600">
                Pair with users to monitor their safe zone status
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => fetchAccessibleUsers()}
                disabled={isLoadingUsers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Pairing Section */}
          {users.length === 0 ? (
            <Card className="p-8 max-w-2xl">
              <div className="text-center space-y-4">
                <div className="text-5xl">🔓</div>
                <h2 className="text-2xl font-bold">Pair with Users</h2>
                <p className="text-gray-600">
                  Ask users for their share code to start tracking their locations
                </p>

                <div className="space-y-3 text-left bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>How it works:</strong>
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Ask a user for their share code</li>
                    <li>Enter the code below</li>
                    <li>Once paired, you'll see their location & status</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter share code (e.g., 1A2B3C4D)"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handlePairWithUser();
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-center text-lg"
                    maxLength={8}
                  />
                  {pairingError && (
                    <p className="text-red-500 text-sm">{pairingError}</p>
                  )}
                  <button
                    onClick={handlePairWithUser}
                    disabled={isPairing || !shareCode.trim()}
                    className="w-full px-6 py-3 bg-forest text-white rounded-lg font-semibold hover:bg-forest/90 disabled:opacity-50"
                  >
                    {isPairing ? "Pairing..." : "Pair with User"}
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Paired Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Safe Zone</p>
                      <p className="text-2xl font-bold">
                        {users.filter((u) => u.isInsideGeofence).length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Outside Zone</p>
                      <p className="text-2xl font-bold">
                        {users.filter((u) => !u.isInsideGeofence).length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Add more users button */}
              <div className="mb-8">
                <Card className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Add another user?</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter share code"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handlePairWithUser();
                        }
                      }}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-mono text-center"
                      maxLength={8}
                    />
                    <button
                      onClick={handlePairWithUser}
                      disabled={isPairing || !shareCode.trim()}
                      className="px-4 py-2 bg-forest text-white rounded-lg font-semibold hover:bg-forest/90 disabled:opacity-50"
                    >
                      {isPairing ? "..." : "Pair"}
                    </button>
                  </div>
                  {pairingError && (
                    <p className="text-red-500 text-sm">{pairingError}</p>
                  )}
                </Card>
              </div>

              {/* Users Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {users.map((pairedUser) => (
                  <UserCard key={pairedUser.id} user={pairedUser} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
