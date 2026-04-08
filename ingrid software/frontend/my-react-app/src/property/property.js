import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const emptyProperty = {
  title: "",
  address: "",
  city: "",
  province: "",
  type: "rental",
  price: "",
  bedrooms: "",
  bathrooms: "",
  size: "",
  description: "",
  rooms: []
};

export default function PostProperty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [property, setProperty] = useState(emptyProperty);

  const isEditMode = Boolean(editId);

  useEffect(() => {
    if (isEditMode) return;

    const savedDraft = localStorage.getItem("propertyDraft");
    if (savedDraft) {
      try {
        setProperty(JSON.parse(savedDraft));
      } catch (err) {
        console.error("Failed to parse saved draft:", err);
      }
    }
  }, [isEditMode]);

  useEffect(() => {
    const fetchListingForEdit = async () => {
      if (!isEditMode) return;

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      try {
        setLoadingEdit(true);

        const res = await fetch(`/api/properties/${editId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load listing.");
        }

        const fullAddress = data.address || "";
        const addressParts = fullAddress.split(",").map((part) => part.trim());

        const street = addressParts[0] || "";
        const city = addressParts[1] || "";
        const province = addressParts[2] || "";

        setProperty({
          title: data.title || "",
          address: street,
          city,
          province,
          type: data.type || "rental",
          price: data.price || "",
          bedrooms: data.bedrooms || "",
          bathrooms: data.bathrooms || "",
          size: data.size || "",
          description: data.description || "",
          rooms: Array.isArray(data.rooms) ? data.rooms : []
        });

        const incomingImages =
          Array.isArray(data.images) && data.images.length > 0
            ? data.images.map((img) => img.image_url).filter(Boolean)
            : data.main_image
              ? [data.main_image]
              : [];

        setImages(incomingImages.map((img) => ({ preview: img })));
      } catch (error) {
        console.error("Edit load failed:", error);
        alert(error.message || "Failed to load listing for editing.");
      } finally {
        setLoadingEdit(false);
      }
    };

    fetchListingForEdit();
  }, [editId, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProperty((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === "type" && value !== "buy") {
        updated.rooms = [];
      }

      return updated;
    });
  };

  const addRoom = () => {
    setProperty((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          name: "",
          type: "",
          sizeCategory: "medium"
        }
      ]
    }));
  };

  const updateRoom = (index, field, value) => {
    setProperty((prev) => {
      const updatedRooms = [...prev.rooms];
      updatedRooms[index] = {
        ...updatedRooms[index],
        [field]: value
      };
      return {
        ...prev,
        rooms: updatedRooms
      };
    });
  };

  const removeRoom = (index) => {
    setProperty((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
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
    if (isEditMode) {
      alert("Draft saving is only available when creating a new listing.");
      return;
    }

    localStorage.setItem("propertyDraft", JSON.stringify(property));
    alert("Draft saved successfully!");
  };

  const clearDraft = () => {
    if (isEditMode) {
      setProperty(emptyProperty);
      setImages([]);
      return;
    }

    localStorage.removeItem("propertyDraft");
    setProperty(emptyProperty);
    setImages([]);
  };
  const geocodeAddress = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get location coordinates.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Could not find that address on the map.");
    }

    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon)
    };
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

      const imageUrls = images.map((img) => img.preview || img).filter(Boolean);
      const finalAddress = fullAddress || property.address;

      const coords = await geocodeAddress(finalAddress);

      const payload = {
        title: property.title,
        address: finalAddress,
        type: property.type,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size: property.size,
        description: property.description,
        rooms: property.rooms,
        main_image: imageUrls[0] || "",
        images: imageUrls,
        latitude: coords.latitude,
        longitude: coords.longitude
      };

      const url = isEditMode ? `/api/properties/${editId}` : "/api/properties";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditMode ? "update" : "post"} property`);
      }

      alert(
        data.message ||
        (isEditMode ? "Listing updated successfully!" : "Property posted successfully!")
      );

      if (!isEditMode) {
        localStorage.removeItem("propertyDraft");
        setProperty(emptyProperty);
        setImages([]);
      }

      navigate("/profile");
    } catch (error) {
      console.error("Submit property error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "40px" }}>Loading listing for editing...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="post-page">
        <div className="post-hero">
          <div>
            <p className="post-eyebrow">
              {isEditMode ? "Edit Listing" : "Landlord Dashboard"}
            </p>
            <h1>
              {isEditMode ? "Update your property listing" : "Create a property listing"}
            </h1>
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
                    <option value="buy">Sell</option>
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

              {property.type === "buy" && (
                <div className="section-card">
                  <div className="section-header">
                    <h2>Room Dimensions</h2>
                    <span>Add rooms so furniture can be matched correctly</span>
                  </div>

                  {property.rooms.length === 0 && (
                    <p style={{ marginBottom: "10px" }}>
                      No rooms added yet. Click "Add Room" to start.
                    </p>
                  )}

                  {property.rooms.map((room, index) => (
                    <div key={index} className="form-grid" style={{ marginBottom: "15px" }}>
                      <div className="form-group">
                        <label>Room Name</label>
                        <input
                          value={room.name}
                          onChange={(e) => updateRoom(index, "name", e.target.value)}
                          placeholder="Bedroom 1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Room Type</label>
                        <input
                          value={room.type}
                          onChange={(e) => updateRoom(index, "type", e.target.value)}
                          placeholder="Bedroom / Living Room / Dining Room"
                        />
                      </div>

                      <div className="form-group">
                        <label>Size Category</label>
                        <select
                          value={room.sizeCategory || "medium"}
                          onChange={(e) => updateRoom(index, "sizeCategory", e.target.value)}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>

                      <div className="form-group full">
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => removeRoom(index)}
                        >
                          Remove Room
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="outline-btn" onClick={addRoom}>
                    + Add Room
                  </button>
                </div>
              )}
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
              {!isEditMode && (
                <button className="ghost-btn" onClick={saveDraft}>
                  Save Draft
                </button>
              )}

              <button
                className="outline-btn"
                onClick={() => setPreview((prev) => !prev)}
              >
                {preview ? "Hide Preview" : "Show Preview"}
              </button>

              <button className="clear-btn" onClick={clearDraft}>
                {isEditMode ? "Clear Form" : "Clear Form"}
              </button>

              <button
                className="post-btn"
                onClick={submitProperty}
                disabled={submitting}
              >
                {submitting
                  ? isEditMode
                    ? "Updating..."
                    : "Posting..."
                  : isEditMode
                    ? "Update Listing"
                    : "Post Listing"}
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