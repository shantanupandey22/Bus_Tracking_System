const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Route = require("../models/Route");

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

// Search routes by name or number
// Modify the search routes to be more explicit
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    // Validate query
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Invalid search query" });
    }

    // More explicit search conditions
    const searchResults = await Route.find({
      $or: [
        { name: { $regex: query.trim(), $options: "i" } },
        { routeNumber: { $regex: query.trim(), $options: "i" } },
      ],
    }).select("routeNumber name stops"); // Explicitly select fields

    if (searchResults.length === 0) {
      return res.status(404).json({ message: "No routes found" });
    }

    res.json(searchResults);
  } catch (err) {
    console.error("Search error details:", err);
    res.status(500).json({
      message: "Server error occurred",
      error: err.toString(),
    });
  }
});

// Similar modification for stop search
router.get("/search/stop", async (req, res) => {
  try {
    const { stopName } = req.query;

    // Validate stopName
    if (!stopName || typeof stopName !== "string") {
      return res.status(400).json({ message: "Invalid stop name" });
    }

    const searchResults = await Route.find({
      "stops.name": { $regex: stopName.trim(), $options: "i" },
    }).select("routeNumber name stops");

    if (searchResults.length === 0) {
      return res.status(404).json({ message: "No routes found for this stop" });
    }

    res.json(searchResults);
  } catch (err) {
    console.error("Stop search error details:", err);
    res.status(500).json({
      message: "Server error occurred",
      error: err.toString(),
    });
  }
});

// Search routes by geographic proximity
router.get("/search/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5 } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and Longitude are required" });
    }

    // Convert to numbers and validate
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const distance = parseFloat(maxDistance);

    // Find routes with stops near the given coordinates
    const searchResults = await Route.find({
      stops: {
        $elemMatch: {
          lat: {
            $gte: latitude - distance / 111, // Rough conversion of km to degrees
            $lte: latitude + distance / 111,
          },
          lng: {
            $gte: longitude - distance / 111,
            $lte: longitude + distance / 111,
          },
        },
      },
    }).limit(10);

    res.json(searchResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const StopSchema = new mongoose.Schema({
  name: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: [Number], // [longitude, latitude]
  },
  arrivalTime: String,
});

const RouteSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  stops: [StopSchema],
  path: {
    type: {
      type: String,
      enum: ["LineString"],
      default: "LineString",
    },
    coordinates: [[Number]], // Array of [longitude, latitude] points
  },
  active: {
    type: Boolean,
    default: true,
  },
});

router.get("/routes/:name", async (req, res) => {
  try {
    const route = await Route.findOne({ name: req.params.name });
    if (!route) {
      return res.status(404).json({ message: "No routes found" });
    }
    res.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ message: "Server error occurred" });
  }
});

// Index for geospatial queries
RouteSchema.index({ path: "2dsphere" });

module.exports = mongoose.model("Route", RouteSchema);
