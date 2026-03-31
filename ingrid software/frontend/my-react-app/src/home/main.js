import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "./home.css";

function Main() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSearch = () => {
    const query = new URLSearchParams({
      location,
      type,
      maxPrice,
    }).toString();

    navigate(`/listings?${query}`);
  };

  return (
    <section className="hero">
      <div className="hero-overlay">
        <div className="hero-content">

          <h1>Find Your Perfect Home</h1>
          <p>Rent, buy, or compare — all in one place.</p>

          {/* 🔍 HERO SEARCH */}
          <div className="hero-search">
            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <select onChange={(e) => setType(e.target.value)}>
              <option value="">All Types</option>
              <option value="rental">Rental</option>
              <option value="short-term">Short-Term</option>
              <option value="buy">Buy</option>
            </select>

            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <button onClick={handleSearch}>Search</button>
          </div>

          <div className="hero-buttons">
            <Link to="/listings">
              <button className="primary-btn">Browse Listings</button>
            </Link>

            <Link to="/post-property">
              <button className="secondary-btn">Post Property</button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Main;