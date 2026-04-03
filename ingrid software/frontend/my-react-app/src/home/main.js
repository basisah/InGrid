import React from "react";
import { Link } from "react-router-dom";
import "./home.css";

function Main() {
  return (
    <section className="main">
      <div className="main-overlay">
        <div className="main-content">
          <span className="hero-badge">Trusted Housing Platform</span>

          <h1>Find Your Next Home, Rental, or Stay — All in One Place</h1>

          <p>
            Browse short-term rentals, long-term leases, and homes for sale.
            Compare listings, check reviews, and make better housing decisions
            with confidence.
          </p>

          <div className="main-buttons">
            <Link to="/listings">
              <button className="primary-btn">Browse Listings</button>
            </Link>

            <Link to="/post-property">
              <button className="secondary-btn">Post a Property</button>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-card">
              <h3>All-in-One</h3>
              <span>Rent, buy, and short stay</span>
            </div>

            <div className="hero-stat-card">
              <h3>Verified</h3>
              <span>Safer listings and users</span>
            </div>

            <div className="hero-stat-card">
              <h3>Smart Compare</h3>
              <span>See options side by side</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Main;