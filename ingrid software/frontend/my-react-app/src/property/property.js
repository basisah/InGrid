import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../home/navbar";
import ImageUploader from "./ImageUploader";
import PreviewListing from "./PreviewListing";
import "./postproperty.css";

const citySuggestions = [
  "Saskatoon",
  "Regina",
  "Prince Albert",
  "Moose Jaw",
  "Yorkton",
  "North Battleford"
];

const provinceSuggestions = [
  "Saskatchewan",
  "Alberta",
  "Manitoba",
  "Ontario",
  "British Columbia"
];

const addressSuggestions = [
  "456 Oak Ave",
  "123 Main Street",
  "89 College Drive",
  "250 Broadway Ave",
  "17 Clarence Ave",
  "780 Idylwyld Drive"
];

export default function PostProperty() {
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [property, setProperty] = useState({
    title: "",
    address: "",
    city: "",
    province: "",
    type: "rental",
    price: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    description: ""
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem("propertyDraft");
    if (savedDraft) {
      setProperty(JSON.parse(savedDraft));
    }
  }, []);

  const handleChange = (e) => {
    setProperty((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyQuickLocation = (city) => {
    setProperty((prev) => ({
      ...prev,
      city,
      province: prev.province || "Saskatchewan"
    }));
  };

  const fullAddress = useMemo(() => {
    return [property.address, property.city, property.province]
      .filter(Boolean)
      .join(", ");
  }, [property.address, property.city, property.province]);

  const mapSrc = useMemo(() => {
    const query = fullAddress || "Saskatoon, Saskatchewan";
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  }, [fullAddress]);

  const completionPercent = useMemo(() => {
    const fields = [
      property.title,
      property.address,
      property.city,
      property.province,
      property.type,
      property.price,
      property.bedrooms,
      property.bathrooms,
      property.size,
      property.description
    ];

    const filled = fields.filter((item) => String(item).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [property]);

  const saveDraft = () => {
    localStorage.setItem("propertyDraft", JSON.stringify(property));
    alert("Draft saved successfully!");
  };

  const clearDraft = () => {
    localStorage.removeItem("propertyDraft");
    setProperty({
      title: "",
      address: "",
      city: "",
      province: "",
      type: "rental",
      price: "",
      bedrooms: "",
      bathrooms: "",
      size: "",
      description: ""
    });
    setImages([]);
  };

  const submitProperty = async () => {
    if (!property.title || !property.price || !property.address) {
      alert("Please fill in title, price, and address.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...property,
          latitude: null,
          longitude: null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post property");
      }

      alert(data.message || "Property posted successfully!");
      localStorage.removeItem("propertyDraft");
    } catch (error) {
      alert(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="post-page">
        <div className="post-hero">
          <div>
            <p className="post-eyebrow">Landlord Dashboard</p>
            <h1>Create a property listing</h1>
            <p className="post-subtext">
              Add photos, location, details, and preview everything before publishing.
            </p>
          </div>

          <div className="hero-progress-card">
            <span>Listing completion</span>
            <strong>{completionPercent}%</strong>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="post-layout">
          <div className="post-main-card">
            <div className="section-card">
              <div className="section-header">
                <h2>Photos</h2>
                <span>Upload clear images that show the best parts of the property</span>
              </div>

              <ImageUploader images={images} setImages={setImages} />
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Basic information</h2>
                <span>Start with the main details renters or buyers care about</span>
              </div>

              <div className="form-grid">
                <div className="form-group full">
                  <label>Listing title</label>
                  <input
                    name="title"
                    value={property.title}
                    onChange={handleChange}
                    placeholder="Modern Family Home with Large Backyard"
                  />
                </div>

                <div className="form-group">
                  <label>Property type</label>
                  <select
                    name="type"
                    value={property.type}
                    onChange={handleChange}
                  >
                    <option value="rental">Rental</option>
                    <option value="short-term">Short-Term</option>
                    <option value="buy">Buy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    name="price"
                    type="number"
                    value={property.price}
                    onChange={handleChange}
                    placeholder="2200"
                  />
                </div>

                <div className="form-group">
                  <label>Bedrooms</label>
                  <input
                    name="bedrooms"
                    type="number"
                    value={property.bedrooms}
                    onChange={handleChange}
                    placeholder="3"
                  />
                </div>

                <div className="form-group">
                  <label>Bathrooms</label>
                  <input
                    name="bathrooms"
                    type="number"
                    value={property.bathrooms}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>

                <div className="form-group full">
                  <label>Size (sqft)</label>
                  <input
                    name="size"
                    type="number"
                    value={property.size}
                    onChange={handleChange}
                    placeholder="1400"
                  />
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Location</h2>
                <span>Use a cleaner map style like your View Details page</span>
              </div>

              <div className="quick-location-row">
                {citySuggestions.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className="location-chip"
                    onClick={() => applyQuickLocation(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="form-grid">
                <div className="form-group full">
                  <label>Street address</label>
                  <input
                    list="address-suggestions"
                    name="address"
                    value={property.address}
                    onChange={handleChange}
                    placeholder="456 Oak Ave"
                  />
                  <datalist id="address-suggestions">
                    {addressSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    list="city-suggestions"
                    name="city"
                    value={property.city}
                    onChange={handleChange}
                    placeholder="Regina"
                  />
                  <datalist id="city-suggestions">
                    {citySuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <input
                    list="province-suggestions"
                    name="province"
                    value={property.province}
                    onChange={handleChange}
                    placeholder="Saskatchewan"
                  />
                  <datalist id="province-suggestions">
                    {provinceSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="post-map-card">
                <iframe
                  title="property-location-preview"
                  src={mapSrc}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Description</h2>
                <span>Highlight nearby schools, parking, pets, furniture, and amenities</span>
              </div>

              <div className="form-group full">
                <label>Description</label>
                <textarea
                  name="description"
                  value={property.description}
                  onChange={handleChange}
                  placeholder="Spacious family home with a large backyard, parking, nearby schools, and public transport..."
                />
              </div>
            </div>

            <div className="action-row">
              <button className="ghost-btn" onClick={saveDraft}>
                Save Draft
              </button>

              <button
                className="outline-btn"
                onClick={() => setPreview((prev) => !prev)}
              >
                {preview ? "Hide Preview" : "Show Preview"}
              </button>

              <button className="clear-btn" onClick={clearDraft}>
                Clear Form
              </button>

              <button
                className="post-btn"
                onClick={submitProperty}
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Listing"}
              </button>
            </div>
          </div>

          <div className="post-sidebar">
            <div className="sidebar-card">
              <h3>Listing Summary</h3>

              <div className="summary-item">
                <span>Title</span>
                <strong>{property.title || "Untitled Listing"}</strong>
              </div>

              <div className="summary-item">
                <span>Price</span>
                <strong>{property.price ? `$${property.price}` : "Not set"}</strong>
              </div>

              <div className="summary-item">
                <span>Type</span>
                <strong>{property.type}</strong>
              </div>

              <div className="summary-item">
                <span>Address</span>
                <strong>{fullAddress || "No address yet"}</strong>
              </div>

              <div className="summary-item">
                <span>Photos</span>
                <strong>{images.length}</strong>
              </div>

              <div className="summary-item">
                <span>Specs</span>
                <strong>
                  {property.bedrooms || 0} Beds • {property.bathrooms || 0} Baths
                </strong>
              </div>
            </div>

            <div className="sidebar-card tips-card">
              <h3>Quick Tips</h3>
              <ul>
                <li>Use a clear title with the property type.</li>
                <li>Add at least 3 photos for a better first impression.</li>
                <li>Make sure the address matches the map preview.</li>
                <li>Include parking, pet policy, and nearby amenities.</li>
              </ul>
            </div>

            {preview && (
              <div className="sidebar-card preview-wrapper">
                <PreviewListing property={property} images={images} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 