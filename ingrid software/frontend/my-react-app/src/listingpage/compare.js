import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./listing.css";

export default function Compare() {
  const location = useLocation();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (location.state?.properties) {
      // Save to localStorage
      localStorage.setItem(
        "compare",
        JSON.stringify(location.state.properties)
      );
      setProperties(location.state.properties);
    } else {
      // Load from localStorage if page refreshed
      const saved = JSON.parse(localStorage.getItem("compare")) || [];
      setProperties(saved);
    }
  }, [location.state]);

  if (properties.length === 0)
    return <h2>No properties selected for comparison.</h2>;

  return (
    <div className="compare-page">
      <h2>Compare Properties</h2>

      <table>
        <thead>
          <tr>
            <th>Feature</th>
            {properties.map((p) => (
              <th key={p.id}>{p.title}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Price</td>
            {properties.map((p) => (
              <td key={p.id}>${p.price}</td>
            ))}
          </tr>

          <tr>
            <td>Bedrooms</td>
            {properties.map((p) => (
              <td key={p.id}>{p.bedrooms}</td>
            ))}
          </tr>

          <tr>
            <td>Bathrooms</td>
            {properties.map((p) => (
              <td key={p.id}>{p.bathrooms}</td>
            ))}
          </tr>

          <tr>
            <td>Size</td>
            {properties.map((p) => (
              <td key={p.id}>{p.size} sqft</td>
            ))}
          </tr>

          <tr>
            <td>Location</td>
            {properties.map((p) => (
              <td key={p.id}>{p.address}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <button
        onClick={() => {
          localStorage.removeItem("compare");
          setProperties([]);
        }}
      >
        Clear Compare
      </button>
    </div>
  );
}