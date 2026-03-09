import React from "react";

function PropertyList({ properties }) {
  return (
    <section className="property-section fade-in">
      <h2>Available Properties</h2>

      <div className="property-grid">
        {properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          properties.map((property) => (
            <div className="property-card" key={property.id}>
              <img
                src="https://via.placeholder.com/300"
                alt="property"
              />
              <h3>{property.title}</h3>
              <p>{property.address}</p>
              <p className="price">${property.price}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default PropertyList;