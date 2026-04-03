import React from "react";

function Features() {
  const featureItems = [
    {
      title: "All Housing Types",
      text: "Browse short-term stays, long-term rentals, and homes for sale in one platform.",
      icon: "🏠"
    },
    {
      title: "Compare Listings",
      text: "See properties side by side so you can compare prices, features, and locations easily.",
      icon: "⚖️"
    },
    {
      title: "Verified & Safer",
      text: "Access listings and user activity with more trust through verification and review systems.",
      icon: "✅"
    },
    {
      title: "Furniture & Extras",
      text: "Explore furniture suggestions and added services that help you plan your move better.",
      icon: "🛋️"
    }
  ];

  return (
    <section className="features fade-in">
      <div className="features-header">
        <span className="section-badge">Why Ingrid</span>
        <h2>Everything you need to find the right place</h2>
        <p>
          Ingrid helps users search smarter, compare faster, and make more confident
          housing decisions from one clean platform.
        </p>
      </div>

      <div className="feature-cards">
        {featureItems.map((item, index) => (
          <div className="card feature-card-upgraded" key={index}>
            <div className="feature-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;