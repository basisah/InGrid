import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import "./listing.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const [navigate] = useState(Navigate);
  const [property, setProperty] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
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
  try {
    await axios.post("/api/payments", { property_id: id, check_in: checkIn, check_out: checkOut, guests, amount: total },
      { headers: { Authorization: `Bearer ${token}` } });
    setBookingMessage("Booking successful! 🎉");
    setTimeout(() => navigate("/profile"), 1500);
  } catch (err) {
    setBookingMessage("Booking failed. Please try again.");
  }
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
    <div className="property-detail">
      {/* IMAGE GALLERY */}
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
  );
}