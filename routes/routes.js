const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const RouteController = require("../controllers/RouteController");

// Get all routes (basic info)
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find().select("routeNumber name");
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific route with full details
router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get route by routeNumber
router.get("/number/:routeNumber", async (req, res) => {
  try {
    const route = await Route.findOne({ routeNumber: req.params.routeNumber });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// Sample route data
const routes = [
  {
    id: 1,
    name: "Route 1",
    stops: [
      { name: "City Center", lat: 26.8467, lng: 80.9462 },
      { name: "Hazratganj", lat: 26.856, lng: 80.9442 },
      { name: "University", lat: 26.8689, lng: 80.9322 },
    ],
  },
  {
    id: 2,
    name: "Route 2",
    stops: [
      { name: "Airport", lat: 26.7606, lng: 80.8892 },
      { name: "Charbagh", lat: 26.8307, lng: 80.9126 },
      { name: "Phoenix Mall", lat: 26.8467, lng: 80.9462 },
    ],
  },
  {
    id: 3,
    name: "Route 3",
    stops: [
      { name: "Hazratganj", lat: 26.856, lng: 80.9442 },
      { name: "Aminabad", lat: 26.8501, lng: 80.9167 },
      { name: "Chowk", lat: 26.8669, lng: 80.9102 },
      { name: "Hazratganj", lat: 26.856, lng: 80.9442 },
    ],
  },
];

// GET all routes
router.get("/", (req, res) => {
  res.json(routes);
});

// Search routes
router.get("/search", RouteController.searchRoutes);

// Search stops on a specific route
router.get("/:routeId/stops", RouteController.searchRouteStops);

// Find buses on a specific route
router.get("/:routeId/buses", RouteController.findBusesOnRoute);

// Search routes near a location
router.get("/near", RouteController.searchRoutesNearLocation);

module.exports = router;
