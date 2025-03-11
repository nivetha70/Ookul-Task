import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as toGeoJSON from "@tmcw/togeojson";
import "./app.css";

function App() {
  const [geoData, setGeoData] = useState(null);
  const [mapKey, setMapKey] = useState(0); // Unique key for forcing re-render
  const [summary, setSummary] = useState({});
  const [details, setDetails] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
        const geoJson = toGeoJSON.kml(xmlDoc);
        
        setGeoData({ ...geoJson }); 
        setMapKey((prev) => prev + 1); // Change key to force re-render
        
        setSummary({});
        setDetails([]);
        calculateSummary(geoJson);
        calculateDetails(geoJson);
      };
      reader.readAsText(file);
    }
  };

  const calculateSummary = (geoJson) => {
    let counts = {};
    geoJson.features.forEach((feature) => {
      let type = feature.geometry.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    setSummary(counts);
  };

  const calculateDetails = (geoJson) => {
    let detailsArray = [];
    geoJson.features.forEach((feature) => {
      let type = feature.geometry.type;
      if (type === "LineString" || type === "MultiLineString") {
        let length = calculateLength(feature.geometry.coordinates);
        detailsArray.push({ type, length: length.toFixed(2) + " km" });
      }
    });
    setDetails(detailsArray);
  };

  const calculateLength = (coordinates) => {
    let totalLength = 0;
    for (let i = 1; i < coordinates.length; i++) {
      let [lon1, lat1] = coordinates[i - 1];
      let [lon2, lat2] = coordinates[i];
      totalLength += haversineDistance(lat1, lon1, lat2, lon2);
    }
    return totalLength;
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (angle) => (Math.PI * angle) / 180;
    const R = 6371; // Earth's radius in km
    let dLat = toRad(lat2 - lat1);
    let dLon = toRad(lon2 - lon1);
    let a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div id="root">
      <div className="left-panel">
        <div className="button-container">
          <input type="file" accept=".kml" onChange={handleFileUpload} />
          <button
            onClick={() => {
              setShowSummary(true);
              setShowDetails(false);
            }}
          >
            Summary
          </button>
          <button
            onClick={() => {
              setShowDetails(true);
              setShowSummary(false);
            }}
          >
            Detailed
          </button>
        </div>

        {/* Added a key to MapContainer to force a full re-render */}
        <MapContainer key={mapKey} id="map" center={[20, 80]} zoom={4}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geoData && <GeoJSON key={JSON.stringify(geoData)} data={geoData} />}
        </MapContainer>
      </div>
      <div className="right-panel">
        <h2 className="txt-center">KML viewer</h2>
        {showSummary && (
          <div>
            <h3>Summary Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Element Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(summary).length > 0 ? (
                  Object.entries(summary).map(([type, count]) => (
                    <tr key={type}>
                      <td>{type}</td>
                      <td>{count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {showDetails && (
          <div>
            <h3>Detailed Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Element Type</th>
                  <th>Total Length (km)</th>
                </tr>
              </thead>
              <tbody>
                {details.length > 0 ? (
                  details.map((detail, index) => (
                    <tr key={index}>
                      <td>{detail.type}</td>
                      <td>{detail.length}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No Line Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;