// server/controllers/RouteController.js
const Route = require("../models/Route");
const Bus = require("../models/Bus");

class RouteController {
  // Search routes by name or number
  async searchRoutes(req, res) {
    try {
      const { query, limit = 10 } = req.query;

      // Build search criteria
      const searchCriteria = query
        ? {
            $or: [
              { routeName: { $regex: query, $options: "i" } },
              { routeNumber: { $regex: query, $options: "i" } },
            ],
          }
        : {};

      // Find routes with optional limit
      const routes = await Route.find(searchCriteria)
        .limit(Number(limit))
        .populate("stops") // Populate associated stops if relationship exists
        .lean();

      res.json({
        success: true,
        count: routes.length,
        data: routes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching routes",
        error: error.message,
      });
    }
  }

  // Search stops along a specific route
  async searchRouteStops(req, res) {
    try {
      const { routeId } = req.params;
      const { query } = req.query;

      // Find the route first
      const route = await Route.findById(routeId).populate({
        path: "stops",
        match: query
          ? {
              stopName: { $regex: query, $options: "i" },
            }
          : {},
      });

      if (!route) {
        return res.status(404).json({
          success: false,
          message: "Route not found",
        });
      }

      res.json({
        success: true,
        count: route.stops.length,
        data: route.stops,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching route stops",
        error: error.message,
      });
    }
  }

  // Find buses currently on a specific route
  async findBusesOnRoute(req, res) {
    try {
      const { routeId } = req.params;

      const buses = await Bus.find({
        currentRoute: routeId,
        isActive: true,
      })
        .populate("currentRoute")
        .lean();

      res.json({
        success: true,
        count: buses.length,
        data: buses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error finding buses on route",
        error: error.message,
      });
    }
  }

  // Geospatial search for routes near a location
  async searchRoutesNearLocation(req, res) {
    try {
      const { longitude, latitude, maxDistance = 5000 } = req.query;

      const routes = await Route.find({
        stops: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: Number(maxDistance), // meters
          },
        },
      })
        .limit(10)
        .lean();

      res.json({
        success: true,
        count: routes.length,
        data: routes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching routes near location",
        error: error.message,
      });
    }
  }
}

module.exports = new RouteController();
