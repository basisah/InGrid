import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import ReviewList from "../reviewpage/reviewList";
import ReviewForm from "../reviewpage/reviewForm";
import "./listing.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bookingId, setBookingId] = useState(null);
  const [property, setProperty] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const token = localStorage.getItem("token");

  const isShortTerm = property?.type === "short-term";
  const isRental = property?.type === "rental";
  const isBuy = property?.type === "buy";

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const total = property && isShortTerm ? nights * Number(property.price) : 0;

  const images = useMemo(() => {
    if (!property) return [];

    const galleryImages =
      property.images && property.images.length > 0
        ? property.images
        : property.main_image
        ? [{ image_url: property.main_image }]
        : [];

    return galleryImages.filter((img) => img?.image_url);
  }, [property]);

  const priceLabel = useMemo(() => {
    if (!property) return "";
    if (property.type === "short-term") return "per night";
    if (property.type === "rental") return "per month";
    return "for sale";
  }, [property]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const propertyRes = await axios.get(`/api/properties/${id}`);
        const propertyData = propertyRes.data;
        setProperty(propertyData);
        setActiveImageIndex(0);

        try {
          const furnitureRes = await axios.get(`/api/furniture/${id}`);
          setFurniture(Array.isArray(furnitureRes.data) ? furnitureRes.data : []);
        } catch (error) {
          console.error("Failed to load furniture:", error);
          setFurniture([]);
        }

        if (token) {
          try {
            const wishlistRes = await axios.get("/api/wishlist", {
              headers: { Authorization: `Bearer ${token}` },
            });

            const savedIds = Array.isArray(wishlistRes.data) ? wishlistRes.data : [];
            setSaved(savedIds.includes(Number(id)));
          } catch (error) {
            console.error("Failed to check wishlist status:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const goPrevImage = () => {
    if (images.length === 0) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNextImage = () => {
    if (images.length === 0) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleReserve = async () => {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    if (!isShortTerm) {
      setBookingMessage("This listing cannot be booked online. Please message the agent.");
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingMessage("Please select check-in and check-out dates.");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setBookingMessage("Check-out must be after check-in.");
      return;
    }

    setBookingMessage("");

    navigate("/payment", {
      state: {
        property_id: id,
        property_title: property.title,
        property_image: images[activeImageIndex]?.image_url || property.main_image,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        nights,
        price_per_night: property.price,
        total,
      },
    });
  };

  const handleSave = async () => {
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

  const handleMessageAgent = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    const receiverId = property?.landlord_id || property?.seller?.id;

    if (!receiverId) {
      alert("No landlord found for this listing.");
      return;
    }

    navigate(`/chat/${property.id}/${receiverId}`);
  };
  
  const mapQuery =
    property?.latitude != null && property?.longitude != null
      ? `${property.latitude},${property.longitude}`
      : property?.address || "Saskatoon, Saskatchewan";

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "40px" }}>Loading property...</div>
        <Footer />
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "40px" }}>Property not found.</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="property-detail-page">
        <button className="back-btn" onClick={() => navigate("/listings")}>
          ← Back to Listings
        </button>

        <div className="fb-gallery">
          <div className="fb-gallery-main">
            <img
              src={
                images[activeImageIndex]?.image_url ||
                "https://via.placeholder.com/1200x700?text=No+Image"
              }
              alt={property.title}
            />

            {images.length > 1 && (
              <>
                <button
                  className="gallery-arrow left"
                  onClick={goPrevImage}
                  type="button"
                >
                  ‹
                </button>
                <button
                  className="gallery-arrow right"
                  onClick={goNextImage}
                  type="button"
                >
                  ›
                </button>
              </>
            )}

            <div className="gallery-counter">
              {images.length > 0 ? `${activeImageIndex + 1} / ${images.length}` : "0 / 0"}
            </div>
          </div>

          {images.length > 1 && (
            <div className="fb-gallery-thumbs">
              {images.map((img, index) => (
                <button
                  key={img.id || index}
                  className={`fb-thumb ${activeImageIndex === index ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(index)}
                  type="button"
                >
                  <img src={img.image_url} alt={`${property.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="property-header">
          <div>
            <h1>{property.title}</h1>
            <p className="property-address">{property.address}</p>

            <div className="property-specs">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.size} sqft</span>
              <span style={{ textTransform: "capitalize" }}>{property.type}</span>
            </div>
          </div>

          <div className="property-price-box">
            <h2>${property.price}</h2>
            <p>{priceLabel}</p>
          </div>
        </div>

        <div className="property-main-layout">
          <div className="property-main-content">
            <section className="property-section-card">
              <h3>Description</h3>
              <p className="property-description">
                {property.description || "No description available yet."}
              </p>
            </section>

            <section className="property-section-card">
              <h3>Property Reviews</h3>
              <ReviewList type="property" id={property.id} />
              {bookingId && (
                <ReviewForm
                  bookingId={bookingId}
                  propertyId={property.id}
                  reviewType="PROPERTY"
                />
              )}
            </section>

            <section className="property-section-card">
              <h3>Landlord Reviews</h3>
              {property.landlord_id && (
                <ReviewList type="landlord" id={property.landlord_id} />
              )}
              {bookingId && property.landlord_id && (
                <ReviewForm
                  bookingId={bookingId}
                  propertyId={property.id}
                  reviewType="LANDLORD"
                  revieweeUserId={property.landlord_id}
                />
              )}
            </section>

            <section className="property-section-card">
              <h3>Area Reviews</h3>
              <ReviewList type="area" id={property.address} />
              {bookingId && (
                <ReviewForm
                  bookingId={bookingId}
                  propertyId={property.id}
                  reviewType="AREA"
                  areaName={property.address}
                />
              )}
            </section>

            <section className="property-section-card">
              <h3>Location</h3>
              <div className="map-wrapper">
                <iframe
                  title="map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
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
                  ${property.price}{" "}
                  <span>
                    {isShortTerm ? "/ night" : isRental ? "/ month" : "/ sale"}
                  </span>
                </h2>

                {isShortTerm ? (
                  <>
                    <div className="booking-inputs">
                      <div className="booking-dates">
                        <div className="booking-date-field">
                          <label>CHECK-IN</label>
                          <input
                            type="date"
                            value={checkIn}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setCheckIn(e.target.value)}
                          />
                        </div>

                        <div className="booking-date-field">
                          <label>CHECK-OUT</label>
                          <input
                            type="date"
                            value={checkOut}
                            min={checkIn || new Date().toISOString().split("T")[0]}
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
                  </>
                ) : (
                  <>
                    <p className="booking-note" style={{ marginBottom: "14px" }}>
                      {isBuy
                        ? "This property is for sale. Message the agent to continue."
                        : "This rental listing cannot be paid online. Message the agent to continue."}
                    </p>

                    <button className="contact-primary-btn" onClick={handleMessageAgent}>
                      Chat with Agent
                    </button>
                  </>
                )}

                <hr className="sidebar-divider" />

                <div className="contact-box">
                  <h3>Contact Agent</h3>
                  <p style={{ marginBottom: "12px", color: "#6b7280" }}>
                    {property.seller?.name || "Listing Owner"}
                  </p>

                  <button
                    className="contact-primary-btn"
                    onClick={handleMessageAgent}
                  >
                    Message Agent
                  </button>

                  <button className="contact-save-btn" onClick={handleSave}>
                    {saved ? "Saved ♥" : "Save Listing"}
                  </button>
                </div>

                {bookingMessage && (
                  <p className="booking-message-error">
                    {bookingMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLoginPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              width: "340px",
            }}
          >
            <h3 style={{ marginBottom: "12px" }}>Sign in to continue</h3>
            <p style={{ color: "#555", marginBottom: "24px" }}>
              You need to be logged in to book or message the agent.
            </p>

            <button
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                padding: "12px",
                background: "#1b5e20",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Log In
            </button>

            <button
              onClick={() => navigate("/signup")}
              style={{
                width: "100%",
                padding: "12px",
                background: "white",
                color: "#1b5e20",
                border: "1px solid #1b5e20",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Sign Up
            </button>

            <button
              onClick={() => setShowLoginPopup(false)}
              style={{
                background: "none",
                border: "none",
                color: "#777",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}