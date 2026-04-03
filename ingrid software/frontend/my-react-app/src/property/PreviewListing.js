import React from "react";

export default function PreviewListing({ property, images }) {
  const previewImage =
    images?.[0]?.preview ||
    "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="preview-card modern-preview-card">
      <div className="preview-image-wrap">
        <img src={previewImage} alt="Property preview" className="preview-main-image" />

        <span className="preview-price-badge">
          {property.price ? `$${property.price}` : "Price not set"}
        </span>

        <span className="preview-type-badge">
          {property.type ? property.type.replace("-", " ") : "rental"}
        </span>
      </div>

      <div className="preview-body">
        <div className="preview-top">
          <h3>{property.title || "Untitled Listing"}</h3>
          <p className="preview-address">
            {[property.address, property.city, property.province]
              .filter(Boolean)
              .join(", ") || "Address not added yet"}
          </p>
        </div>

        <div className="preview-specs">
          <span>{property.bedrooms || 0} Beds</span>
          <span>{property.bathrooms || 0} Baths</span>
          <span>{property.size || 0} sqft</span>
        </div>

        <p className="preview-description">
          {property.description ||
            "Add a description so users can quickly understand what makes this property special."}
        </p>

        {images?.length > 1 && (
          <div className="preview-gallery-strip">
            {images.slice(0, 4).map((img, index) => (
              <img
                key={index}
                src={img.preview}
                alt={`Preview ${index + 1}`}
                className="preview-thumb"
              />
            ))}
          </div>
        )}

        <div className="preview-actions">
          <button type="button" className="preview-view-btn">
            View Details
          </button>
          <button type="button" className="preview-save-btn">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}