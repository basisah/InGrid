import React from "react";
import { useNavigate } from "react-router-dom";

function PropertyList({ properties }) {
  const navigate = useNavigate();

  return (
    <section className="property-section fade-in">
      <h2>Available Properties</h2>

      <div className="property-grid">
        {properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          properties.map((property) => (
            <div
              className="property-card"
              key={property.id}
              onClick={() => navigate(`/property/${property.id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={property.main_image}
                alt={property.title || "property"}
              />

              <div className="property-card-content">
                <h3>{property.title}</h3>
                <p>{property.address}</p>
                <p className="price">${property.price}</p>

                <button
                  className="view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/property/${property.id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default PropertyList;