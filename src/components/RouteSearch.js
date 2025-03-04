import React, { useState } from "react";
import axios from "axios";

function RouteSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("general");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setError("Please enter a search term");
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      const baseURL = "http://localhost:5000/api/routes";

      if (searchType === "general") {
        response = await axios.get(`${baseURL}/search`, {
          params: { query: trimmedQuery },
        });
      } else {
        response = await axios.get(`${baseURL}/search/stop`, {
          params: { stopName: trimmedQuery },
        });
      }

      // Detailed logging
      console.log("Full Response:", response);
      console.log("Response Data:", response.data);
      console.log("Response Type:", typeof response.data);

      // More defensive handling of response
      const results = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setSearchResults(results);

      if (results.length === 0) {
        setError("No routes found");
      }
    } catch (err) {
      // Even more detailed error logging
      console.error("Full Search Error:", err);

      if (err.response) {
        console.error("Response Status:", err.response.status);
        console.error("Response Data:", err.response.data);
        setError(err.response.data.message || "Server error occurred");
      } else if (err.request) {
        console.error("Request Error:", err.request);
        setError("No response from server. Check your connection.");
      } else {
        console.error("Error Details:", err.message);
        setError("An unexpected error occurred");
      }

      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              setSearchResults([]);
              setError(null);
            }}
            className="search-type-select"
          >
            <option value="general">Search Routes</option>
            <option value="stop">Search by Stop</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchType === "general"
                ? "Enter route name or number"
                : "Enter stop name"
            }
            className="search-input"
          />

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="search-button"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>

      <div className="search-results">
        {loading && <p>Loading results...</p>}

        {!loading && searchResults.length > 0 && (
          <div className="route-list">
            {searchResults.map((route) => (
              <div key={route._id} className="route-item">
                <span className="route-number">{route.routeNumber}</span>
                <span className="route-name">{route.name}</span>
                {route.stops && (
                  <div className="route-stops">
                    Stops: {route.stops.map((stop) => stop.name).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && searchResults.length === 0 && searchQuery && (
          <p>No routes found</p>
        )}
      </div>
    </div>
  );
}

export default RouteSearch;
