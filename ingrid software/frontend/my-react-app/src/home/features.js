import React from "react";

function Features() {
  return (
    <section className="features fade-in">
      <h2>Why Choose Ingrid?</h2>

      <div className="feature-cards">

        <div className="card">
          <h3>All Housing Types</h3>
          <p>Short-term, long-term, and mortgage options in one place.</p>
        </div>

        <div className="card">
          <h3>Compare Listings</h3>
          <p>View properties side-by-side and make better decisions.</p>
        </div>

        <div className="card">
          <h3>Secure & Verified</h3>
          <p>Safe accounts and verified sellers for your protection.</p>
        </div>

        <div className="card">
          <h3>Fast & Easy</h3>
          <p>Simple and modern browsing experience.</p>
        </div>
      </div>
    </section>
  );
}

export default Features;