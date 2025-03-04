import React, { useState, useEffect } from "react";
import RouteSearch from "./components/RouteSearch";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import io from "socket.io-client";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

// Fix the marker icon issue in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom bus icon
const busIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3498db" width="40" height="40">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
</svg>
`;

const busIcon = L.divIcon({
  className: "custom-bus-icon",
  html: busIconSvg,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

function App() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/routes");
        setRoutes(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Fetch route details when a route is selected
  useEffect(() => {
    const fetchRouteDetails = async () => {
      if (!selectedRoute) {
        setRouteDetails(null);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/routes/${selectedRoute}`
        );
        setRouteDetails(response.data);
      } catch (error) {
        console.error("Error fetching route details:", error);
      }
    };

    fetchRouteDetails();
  }, [selectedRoute]);

  // Connect to Socket.io server
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("busLocationUpdate", (busData) => {
      console.log("Received bus update:", busData);
      setBuses(busData);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const searchRoute = async () => {
    const searchValue = document.getElementById("searchInput").value; // Get input
    try {
      const response = await fetch(
        `http://localhost:5000/api/routes/${searchValue}`
      );
      const data = await response.json();
      if (response.ok) {
        console.log("Route Data:", data);
      } else {
        console.error("No routes found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Colors for different routes
  const routeColors = {
    101: "#3498db", // blue
    102: "#e74c3c", // red
    103: "#2ecc71", // green
  };

  // Default color if routeNumber doesn't match
  const defaultColor = "#9b59b6"; // purple

  return (
    <div className="app">
      <header className="header">
        <h1>Real-time Bus Tracking System</h1>
      </header>

      <div className="container">
        <div className="sidebar">
          <RouteSearch />

          <h2>Bus Routes</h2>
          {loading ? (
            <p>Loading routes...</p>
          ) : (
            <div className="route-list">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className={`route-item ${
                    selectedRoute === route._id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRoute(route._id)}
                >
                  <span className="route-number">{route.routeNumber}</span>
                  {route.name}
                </div>
              ))}
            </div>
          )}

          {routeDetails && (
            <div className="route-details">
              <h3>Route Details: {routeDetails.routeNumber}</h3>
              <p>{routeDetails.name}</p>
              <h4>Stops:</h4>
              <ul className="stops-list">
                {routeDetails.stops.map((stop, index) => (
                  <li key={index}>
                    <strong>{stop.name}</strong> - {stop.arrivalTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bus-info">
            <h2>Active Buses</h2>
            {buses.length > 0 ? (
              buses.map((bus) => (
                <div key={bus.busId} className="bus-item">
                  <strong>Bus #{bus.busId}</strong>
                  <p>
                    Location: {bus.lat.toFixed(4)}, {bus.lng.toFixed(4)}
                  </p>
                </div>
              ))
            ) : (
              <p>No active buses</p>
            )}
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={[26.8467, 80.9462]} // Lucknow coordinates
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Display route polylines */}
            {routeDetails && routeDetails.path && (
              <Polyline
                positions={routeDetails.path.coordinates.map((coord) => [
                  coord[1],
                  coord[0],
                ])}
                color={routeColors[routeDetails.routeNumber] || defaultColor}
                weight={5}
              />
            )}

            {/* Display route stops */}
            {routeDetails &&
              routeDetails.stops &&
              routeDetails.stops.map((stop, index) => (
                <CircleMarker
                  key={index}
                  center={[
                    stop.location.coordinates[1],
                    stop.location.coordinates[0],
                  ]}
                  radius={8}
                  fillColor={
                    routeColors[routeDetails.routeNumber] || defaultColor
                  }
                  color="#fff"
                  weight={2}
                  fillOpacity={1}
                >
                  <Popup>
                    <div>
                      <h3>{stop.name}</h3>
                      <p>Arrival Time: {stop.arrivalTime}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {/* Display buses */}
            {buses.map((bus) => (
              <Marker
                key={bus.busId}
                position={[bus.lat, bus.lng]}
                icon={busIcon}
              >
                <Popup>
                  <div>
                    <h3>Bus #{bus.busId}</h3>
                    <p>Route: {routeDetails?.routeNumber || "Not assigned"}</p>
                    <p>Last updated: {new Date().toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
