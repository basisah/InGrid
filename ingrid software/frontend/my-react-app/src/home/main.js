import { Link } from "react-router-dom";
import React from "react";

function Main() {
  return (
    <section className="main">
      <div className="main-content">
        <h1>Find Your Next Home — All in One Place</h1>
        <p>
          Short-term rentals, long-term leases, and mortgages —
          compare and choose with confidence.
        </p>
        <div className="main-buttons">
          <Link to="/listing">
            <button className="primary-btn">Browse Listings</button>
          </Link>
          <Link to="/propertyList">
            <button className="secondary-btn">Post a Property</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Main;