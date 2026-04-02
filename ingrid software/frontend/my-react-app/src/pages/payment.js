import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./payment.css";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;
  const furnitureItems = booking?.furnitureItems || [];
  const furnitureTotal = booking?.furnitureTotal || 0;

  const propertyTotal = booking?.total || 0;

  const subtotal = propertyTotal + furnitureTotal;

  const gst = subtotal * 0.05;
  const pst = subtotal * 0.06;
  const grandTotal = subtotal + gst + pst;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cardNumber: "",
    billingAddress: "",
    expiry: "",
    cvc: "",
    zip: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePay = async () => {
    if (!form.firstName || !form.lastName || !form.cardNumber || !form.billingAddress || !form.expiry || !form.cvc || !form.zip) {
      setMessage("Please fill in all fields.");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      await axios.post("/api/payments", {
        property_id: booking.property_id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        amount: grandTotal
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage("Payment successful! 🎉");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      setMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (!booking) return <p>No booking data found.</p>;

  return (
    <div className="payment-page">
      <h2>Complete Your Payment</h2>

      <div className="payment-layout">

        {/* LEFT — PAYMENT FORM */}
        <div className="payment-form">

          {/* Name */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input name="firstName" placeholder="First Name" onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="lastName" placeholder="Last Name" onChange={handleChange} />
            </div>
          </div>

          {/* Card Number */}
          <div className="form-group">
            <label>Credit Card Number</label>
            <input name="cardNumber" placeholder="1234 5678 9012 3456" onChange={handleChange} maxLength={19} />
          </div>

          {/* Billing Address */}
          <div className="form-group">
            <label>Billing Address</label>
            <input name="billingAddress" placeholder="123 Main St, Saskatoon" onChange={handleChange} />
          </div>

          {/* Expiry, CVC, ZIP */}
          <div className="form-row form-row-small">
            <div className="form-group">
              <label>MM/YY</label>
              <input name="expiry" placeholder="MM/YY" onChange={handleChange} maxLength={5} />
            </div>
            <div className="form-group">
              <label>CVC</label>
              <input name="cvc" placeholder="CVC" onChange={handleChange} maxLength={3} />
            </div>
            <div className="form-group">
              <label>ZIP / Postal</label>
              <input name="zip" placeholder="S7N 0W0" onChange={handleChange} />
            </div>
          </div>

          {/* Pay Button */}
          <button className="pay-btn" onClick={handlePay} disabled={loading}>
            {loading ? "Processing..." : "Pay"}
          </button>
          <p className="pay-note">Click once only</p>

          {message && (
            <p className={message.includes("successful") ? "pay-message-success" : "pay-message-error"}>
              {message}
            </p>
          )}
        </div>

        {/* RIGHT — BOOKING SUMMARY */}
        <div className="booking-summary">

          {/* PROPERTY (if exists) */}
          {booking.property_title && (
            <>
            {booking.property_image && (
              <img src={booking.property_image} alt="property" />
            )}

            <h3>{booking.property_title}</h3>

            <div className="summary-row">
              <span>Dates</span>
              <span>{booking.check_in} → {booking.check_out}</span>
            </div>

            <div className="summary-row">
              <span>Guests × Nights</span>
              <span>{booking.guests} × {booking.nights}</span>
            </div>

            <div className="summary-row">
              <span>Property Total</span>
              <span>${propertyTotal.toFixed(2)}</span>
            </div>

            <hr className="summary-divider" />
          </>
        )}

        {/* FURNITURE */}
        {furnitureItems.length > 0 && (
          <>
            <h3>Furniture</h3>

            {furnitureItems.map((item) => (
              <div key={item.id} className="summary-row">
              <span>{item.name}</span>
              <span>${item.price}</span>
            </div>
          ))}

          <div className="summary-row">
            <span>Furniture Total</span>
            <span>${furnitureTotal.toFixed(2)}</span>
          </div>

          <hr className="summary-divider" />
        </>
      )}

      {/* TAX */}
      <div className="summary-row">
        <span>GST (5%)</span>
        <span>${gst.toFixed(2)}</span>
      </div>

      <div className="summary-row">
        <span>PST (6%)</span>
        <span>${pst.toFixed(2)}</span>
      </div>

      <hr className="summary-divider" />

      {/* FINAL */}
      <div className="summary-total">
        <span>Total</span>
        <span>${grandTotal.toFixed(2)}</span>
      </div>
    </div>

      </div>
    </div>
  );
}