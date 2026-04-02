import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./listing.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
{/* basisah - added booking functionality and state for check-in, check-out, guests, and booking message. 
  Also added total price calculation and reserve button handler. */}
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
  if (!checkIn || !checkOut) { setBookingMessage("Please select dates."); return; }
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
    total } 
    }
  );
};
  const fetchProperty = async () => {
    const response = await axios.get(`/api/properties/${id}`);
    setProperty(response.data);
  };

  const fetchFurniture = async () => {
    const response = await axios.get(`/api/furniture/${id}`);
    setFurniture(response.data);
  };

  const handleSendMessage = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessageStatus("Please log in first.");
      return;
    }

    if (!property?.landlord_id) {
      setMessageStatus("Landlord information is not available.");
      return;
    }

    if (!messageText.trim()) {
      setMessageStatus("Please enter a message.");
      return;
    }

    try {
      setSendingMessage(true);
      setMessageStatus("");

      const response = await axios.post(
        "/api/messages",
        {
          receiver_id: property.landlord_id,
          property_id: Number(id),
          message: messageText.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessageStatus(response.data.message || "Message sent successfully.");
      setMessageText("");
    } catch (err) {
      setMessageStatus(
        err.response?.data?.message || "Failed to send message."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchFurniture();
    fetchProperty();
  }, [id]);

  if (!property) return <div>Loading...</div>;

  return (
    <div className="property-detail" style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}> 
      {/* IMAGE GALLERY */}
      <div style={{ flex: 1 }}>
        {/*hardcoding the flex layout because it kept showing at the bottom of page */}
        <div className="gallery">
          {property.images?.map((img) => (
            <img key={img.id} src={img.image_url} alt="property" />
        ))}
      </div>

      {/* PROPERTY INFO */}
      <div className="property-info">
        <h1>{property.title}</h1>
        <p className="price">${property.price}</p>
        <p>{property.description}</p>

        <div className="specs">
          <span>{property.bedrooms} Beds</span>
          <span>{property.bathrooms} Baths</span>
          <span>{property.size} sqft</span>
        </div>
      </div>

      {/* SELLER INFO */}
      <div className="seller-card">
        <h3>Contact Agent</h3>
        <p>{property.seller?.name}</p>
        <p>{property.seller?.email}</p>
        <p>Landlord ID: {property.landlord_id}</p>

        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write your message..."
          rows={3}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "8px",
            borderRadius: "6px"
          }}
        />

        <button onClick={handleSendMessage} style={{ marginTop: "10px" }}>
        Send Message
        </button>

        {messageStatus && (
          <p style={{ marginTop: "10px" }}>{messageStatus}</p>
        )}
      </div>

      {/* MAP */}
      <div className="map-section">
        <iframe
          title="map"
          src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
        ></iframe>
      </div>

      {/* FURNITURE RECOMMENDATION */}
      <div className="furniture-section">
        <h2>Recommended Furniture</h2>
        <div className="furniture-grid">
          {furniture.map((item) => (
            <div key={item.id} className="furniture-card">
              <img 
                src={item.image_url} 
                alt="furniture" 
                style={{ width: "150px", height: "120px", objectFit: "cover", borderRadius: "8px" }} 
              />
              <p>{item.name}</p>
              <p>${item.price}</p>
              <p>{item.room}</p>
              <p style={{
                  fontWeight: "bold",
                  color: item.fits ? "green" : "red"}}>
                {item.fits ? "Fits in room" : "Does not fit"}</p>
              <p style={{ color: item.fits ? "green" : "red" }}>
                {item.reason}
              </p>
              <p>Clearance Space:{" "}
                {item.clearance_space !== null
                  ? Number(item.clearance_space).toFixed(2)
                  : "N/A"}
              </p>
            </div>
          ))}
        </div>
      </div>
      </div>
      {/* basisah - added Airbnb-style booking card with
       check-in, checkout, guests and reserve button */}
      <div className="booking-card">
      <div className="booking-card-inner">
        <h2>${property.price} <span>/night</span></h2>
        <div className="booking-inputs">
          <div className="booking-dates">
            <div className="booking-date-field">
              <label>CHECK-IN</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div className="booking-date-field">
              <label>CHECKOUT</label>
              <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="booking-guests">
            <label>GUESTS</label>
            <select value={guests} onChange={e => setGuests(e.target.value)}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>
        {nights > 0 && <p className="booking-total">${property.price} × {nights} nights = <strong>${total.toFixed(2)}</strong></p>}
        <button className="reserve-btn" onClick={handleReserve}>Reserve</button>
        <p className="booking-note">You won't be charged yet</p>
        {bookingMessage && <p className={bookingMessage.includes("successful") ? "booking-message-success" : "booking-message-error"}>{bookingMessage}</p>}
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
    </div>
  );
}
