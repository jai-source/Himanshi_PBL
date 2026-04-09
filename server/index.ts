import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleCurrencyDetection, handleObjectDetection } from "./routes/currency";
import {
  handleLocationUpdate,
  handleSetHomeLocation,
  handleGetUserLocation,
  handleGetFamilyLocations,
  handleHelperPairing,
  handleGetAccessibleUsers,
  handleRegisterUser,
} from "./routes/location";

function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/detect/currency", handleCurrencyDetection);
  app.post("/api/detect/objects", handleObjectDetection);

  // Location & Geofencing routes
  app.post("/api/location/update", handleLocationUpdate);
  app.post("/api/location/set-home", handleSetHomeLocation);
  app.get("/api/location/:userId", handleGetUserLocation);
  app.get("/api/location/family/:familyCode", handleGetFamilyLocations);

  // Helper pairing routes
  app.post("/api/location/register-user", handleRegisterUser);
  app.post("/api/helper/pair", handleHelperPairing);
  app.get("/api/helper/:helperId/accessible-users", handleGetAccessibleUsers);

  return app;
}

const app = createServer();
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
