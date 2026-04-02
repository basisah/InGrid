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
  if (!token) { navigate("/login"); return; }
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
        <button>Message Agent</button>
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
              <img src={item.image_url} alt="furniture" />
              <p>{item.name}</p>
              <p>${item.price}</p>
              <p>{item.room}</p>
              <p>{item.fits ? "Fits in room" : "Does not fit"}</p>
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
    </div>
  );
}