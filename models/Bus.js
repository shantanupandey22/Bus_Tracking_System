const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  busId: {
    type: String,
    required: true,
    unique: true,
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0], // [longitude, latitude]
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries
BusSchema.index({ currentLocation: "2dsphere" });

module.exports = mongoose.model("Bus", BusSchema);
