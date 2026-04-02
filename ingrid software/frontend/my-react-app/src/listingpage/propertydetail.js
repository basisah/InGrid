import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import ReviewList from "../reviewpage/reviewList";
import ReviewForm from "../reviewpage/reviewForm";
import "./listing.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [saved, setSaved] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const total = nights * property?.price;

  const handleReserve = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setShowLoginPopup(true); return; }
    if (!checkIn || !checkOut) { alert("Please select dates."); return; }
    navigate("/payment", { 
      state: { 
        property_id: id,
        property_title: property.title,
        property_image: property.main_image,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        nights,
        price_per_night: property.price,
        total
      } 
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      if (saved) {
        await fetch(`/api/save/${property.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(false);
      } else {
        await fetch(`/api/save/${property.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(true);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyRes = await axios.get(`/api/properties/${id}`);
        const furnitureRes = await axios.get(`/api/furniture/${id}`);

        setProperty(propertyRes.data);
        setFurniture(furnitureRes.data || []);
      } catch (error) {
        console.error("Failed to load property details:", error);
      }
    };

    fetchData();
  }, [id]);

  if (!property) return <div style={{ padding: "40px" }}>Loading...</div>;

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [{ image_url: property.main_image }];

  return (
    <>
      <Navbar />

      <div className="property-detail-page">
        <button
          className="back-btn"
          onClick={() => navigate("/listings")}
        >
          ← Back to Listings
        </button>
        <div className="property-gallery">
          <div className="gallery-main">
            <img
              src={images[0]?.image_url || property.main_image}
              alt={property.title}
            />
          </div>

          <div className="gallery-side">
            {images.slice(1, 5).map((img, index) => (
              <img
                key={img.id || index}
                src={img.image_url}
                alt={`${property.title} ${index + 2}`}
              />
            ))}
          </div>
        </div>

        <div className="property-header">
          
          <div>
            <h1>{property.title}</h1>
            <p className="property-address">{property.address}</p>

            <div className="property-specs">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.size} sqft</span>
            </div>
          </div>

          <div className="property-price-box">
            <h2>${property.price}</h2>
            <p>per night</p>
          </div>
        </div>

        <div className="property-main-layout">
          <div className="property-main-content">
            <section className="property-section-card">
              <h3>Property Reviews</h3>
              <ReviewList type="property" id={property.id} />
            </section>

            <section className="property-section-card">
              <h3>Landlord Reviews</h3>
              {property.landlord_id && (
                <ReviewList type="landlord" id={property.landlord_id} />
              )}
            </section>

            <section className="property-section-card">
              <h3>Area Reviews</h3>
              <ReviewList type="area" id={property.address} />
            </section>

            <section className="property-section-card">
              <h3>Location</h3>
              <div className="map-wrapper">
                <iframe
                  title="map"
                  src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                ></iframe>
              </div>
            </section>

            <section className="property-section-card">
              <h3>Recommended Furniture</h3>

              {furniture.length === 0 ? (
                <p>No furniture recommendations yet.</p>
              ) : (
                <div className="furniture-grid">
                  {furniture.map((item) => (
                    <div key={item.id} className="furniture-card">
                      <div className="furniture-image-wrap">
                        <img src={item.image_url} alt={item.name} />
                      </div>

                      <div className="furniture-info">
                        <h4>{item.name}</h4>
                        <p className="furniture-price">${item.price}</p>
                        <span className={item.fits ? "fits" : "nofit"}>
                          {item.fits ? "Fits well ✔" : "Too big"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="property-sidebar">
            <div className="booking-card">
              <div className="booking-card-inner">
                <h2>
                  ${property.price} <span>/ night</span>
                </h2>

                <div className="booking-inputs">
                  <div className="booking-dates">
                    <div className="booking-date-field">
                      <label>CHECK-IN</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>

                    <div className="booking-date-field">
                      <label>CHECK-OUT</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="booking-guests">
                    <label>GUESTS</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} guest{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {nights > 0 && (
                  <p className="booking-total">
                    ${property.price} × {nights} nights ={" "}
                    <strong>${total.toFixed(2)}</strong>
                  </p>
                )}

                <button className="reserve-btn" onClick={handleReserve}>
                  Reserve
                </button>

                <p className="booking-note">You won't be charged yet</p>

                <hr className="sidebar-divider" />

                <div className="contact-box">
                  <h3>Contact Agent</h3>
                  <button className=" contact-primary-btn" onClick={() => {
                    const token = localStorage.getItem("token");

                    if (!token) {
                      setMessageStatus("Please log in first.");
                      return;
                    }

                    if (!property?.landlord_id) {
                      setMessageStatus("Agent information is missing for this property.");
                      return;
                    }

                    navigate(`/chat/${id}/${property.landlord_id}`);
                  }}>Message Agent</button>
                  <button className="contact-save-btn" onClick={handleSave}>
                    {saved ? "Saved ♥" : "Save Listing"}
                  </button>
                </div>

                {messageStatus && (
                  <p style={{ marginTop: "10px" }}>{messageStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* basisah - login popup for unauthenticated users */}
      {showLoginPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", textAlign: "center", width: "340px" }}>
            <h3 style={{ marginBottom: "12px" }}>Sign in to book</h3>
            <p style={{ color: "#555", marginBottom: "24px" }}>You need to be logged in to make a reservation.</p>
            <button onClick={() => navigate("/login")} style={{ width: "100%", padding: "12px", background: "#1b5e20", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer", marginBottom: "10px" }}>
              Log In
            </button>
            <button onClick={() => navigate("/signup")} style={{ width: "100%", padding: "12px", background: "white", color: "#1b5e20", border: "1px solid #1b5e20", borderRadius: "8px", fontSize: "15px", cursor: "pointer", marginBottom: "10px" }}>
              Sign Up
            </button>
            <button onClick={() => setShowLoginPopup(false)} style={{ background: "none", border: "none", color: "#777", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}