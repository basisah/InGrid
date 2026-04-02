import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../home/navbar";
import "./listing.css";

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (location.state?.properties) {
      localStorage.setItem(
        "compare",
        JSON.stringify(location.state.properties)
      );
      setProperties(location.state.properties);
    } else {
      const saved = JSON.parse(localStorage.getItem("compare")) || [];
      setProperties(saved);
    }
  }, [location.state]);

  if (properties.length === 0) {
    return (
      <>
        <Navbar />
        <div className="compare-page">
          <h2>No properties selected for comparison.</h2>
        </div>
      </>
    );
  }

  const cheapest = Math.min(...properties.map((p) => p.price));
  const biggest = Math.max(...properties.map((p) => p.size));

  const bestValueProperty = properties.reduce((best, current) => {
    const currentValue = current.price / current.size;
    const bestValue = best.price / best.size;
    return currentValue < bestValue ? current : best;
  });

  return (
    <>
      <Navbar />

      <div className="compare-page">
        <h2>Compare Properties</h2>

        <div className="compare-cards">
          {properties.map((p) => {
            const isCheapest = p.price === cheapest;
            const isBiggest = p.size === biggest;
            const isBestValue = p.id === bestValueProperty.id;

              {/* 🏆 BADGES */}
              {isBestValue && <span className="badge best">Best Value</span>}
              {isCheapest && <span className="badge cheap">Lowest Price</span>}
              {isBiggest && <span className="badge big">Largest Size</span>}
            return (
              <div key={p.id} className="compare-card">
                {isBestValue && <span className="badge best">Best Value</span>}
                {isCheapest && <span className="badge cheap">Lowest Price</span>}
                {isBiggest && <span className="badge big">Largest Size</span>}

                <img src={p.main_image} alt={p.title} />

                <h3>{p.title}</h3>
                <p>{p.address}</p>
                <p className="price">${p.price}</p>

                <a href={`/property/${p.id}`}>
                  <button className="details-btn">View Details</button>
                </a>
              </div>
            );
          })}
        </div>

        <table className="compare-table">
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
                <td
                  key={p.id}
                  className={p.price === cheapest ? "highlight-green" : ""}
                >
                  ${p.price}
                </td>
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
                <td
                  key={p.id}
                  className={p.size === biggest ? "highlight-blue" : ""}
                >
                  {p.size} sqft
                </td>
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

        <div className="compare-actions">
          <button
            className="clear-btn"
            onClick={() => {
              localStorage.removeItem("compare");
              setProperties([]);
              navigate("/listings");
            }}
          >
            Clear Compare
          </button>

          <button
            className="back-btn"
            onClick={() => navigate("/listings")}
          >
            Back to Listings
          </button>
        </div>
      </div>

      {/*  TABLE COMPARISON */}
      <table className="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            {properties.map((p) => (
              <th key={p.id}>{p.title}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* PRICE */}
          <tr>
            <td>Price</td>
            {properties.map((p) => (
              <td
                key={p.id}
                className={p.price === cheapest ? "highlight-green" : ""}
              >
                ${p.price}
              </td>
            ))}
          </tr>

          {/* BEDROOMS */}
          <tr>
            <td>Bedrooms</td>
            {properties.map((p) => (
              <td key={p.id}>{p.bedrooms}</td>
            ))}
          </tr>

          {/* BATHROOMS */}
          <tr>
            <td>Bathrooms</td>
            {properties.map((p) => (
              <td key={p.id}>{p.bathrooms}</td>
            ))}
          </tr>

          {/* SIZE */}
          <tr>
            <td>Size</td>
            {properties.map((p) => (
              <td
                key={p.id}
                className={p.size === biggest ? "highlight-blue" : ""}
              >
                {p.size} sqft
              </td>
            ))}
          </tr>

          {/* LOCATION */}
          <tr>
            <td>Location</td>
            {properties.map((p) => (
              <td key={p.id}>{p.address}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <button
        className="clear-btn"
        onClick={() => {
          localStorage.removeItem("compare");
          setProperties([]);
        }}
      >
        Clear Compare
      </button>
    </div>
    </>
  );
}