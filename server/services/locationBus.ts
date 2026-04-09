import { EventEmitter } from "events";
import { LocationUpdateEvent } from "@shared/api";

/**
 * Simple in-memory event bus for real-time location updates
 * Can be replaced with Socket.IO for production
 */
class LocationUpdateBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  /**
   * Emit location update event
   */
  emitLocationUpdate(payload: LocationUpdateEvent) {
    this.emit("location:update", payload);
    // Also emit family-specific event for helpers to listen to
    if (payload.userId) {
      this.emit(`location:update:${payload.userId}`, payload);
    }
  }

  /**
   * Subscribe to location updates for a family
   */
  onLocationUpdate(familyCode: string, callback: (payload: LocationUpdateEvent) => void) {
    this.on(`family:${familyCode}`, callback);
  }

  /**
   * Unsubscribe from location updates
   */
  offLocationUpdate(familyCode: string, callback: (payload: LocationUpdateEvent) => void) {
    this.removeListener(`family:${familyCode}`, callback);
  }

  /**
   * Get listeners count
   */
  getListenerCount(event: string): number {
    return this.listenerCount(event);
  }
}

// Export singleton instance
export const locationBus = new LocationUpdateBus();
