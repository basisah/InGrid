import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "./listing.css";

export default function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (location.state?.properties) {
      localStorage.setItem("compare", JSON.stringify(location.state.properties));
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
        <Footer />
      </>
    );
  }

  const cheapest = Math.min(...properties.map((p) => Number(p.price) || 0));
  const biggest = Math.max(...properties.map((p) => Number(p.size) || 0));

  const bestValueProperty = properties.reduce((best, current) => {
    const currentSize = Number(current.size) || 1;
    const bestSize = Number(best.size) || 1;

    const currentValue = Number(current.price) / currentSize;
    const bestValue = Number(best.price) / bestSize;

    return currentValue < bestValue ? current : best;
  });

  return (
    <>
      <Navbar />

      <div className="compare-page">
        <h2>Compare Properties</h2>

        <div className="compare-cards">
          {properties.map((p) => {
            const isCheapest = Number(p.price) === cheapest;
            const isBiggest = Number(p.size) === biggest;
            const isBestValue = p.id === bestValueProperty.id;

            return (
              <div key={p.id} className="compare-card">
                {isBestValue && <span className="badge best">Best Value</span>}
                {isCheapest && <span className="badge cheap">Lowest Price</span>}
                {isBiggest && <span className="badge big">Largest Size</span>}

                <img src={p.main_image} alt={p.title} />
                <h3>{p.title}</h3>
                <p>{p.address}</p>
                <p className="price">${p.price}</p>

                <Link to={`/property/${p.id}`}>
                  <button className="details-btn">View Details</button>
                </Link>
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
                  className={Number(p.price) === cheapest ? "highlight-green" : ""}
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
                  className={Number(p.size) === biggest ? "highlight-blue" : ""}
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

          <button className="back-btn" onClick={() => navigate("/listings")}>
            Back to Listings
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}