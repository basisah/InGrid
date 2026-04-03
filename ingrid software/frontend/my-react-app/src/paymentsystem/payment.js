import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "./payment.css";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;

  const furnitureItems = booking?.furnitureItems || [];
  const furnitureTotal = Number(booking?.furnitureTotal || 0);
  const propertyTotal = Number(booking?.total || 0);

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

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let value = e.target.value;

    if (e.target.name === "cardNumber") {
      value = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }

    if (e.target.name === "expiry") {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    if (e.target.name === "cvc") {
      value = value.replace(/\D/g, "").slice(0, 3);
    }

    setForm({ ...form, [e.target.name]: value });
  };

  const handlePay = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.cardNumber.trim() ||
      !form.billingAddress.trim() ||
      !form.expiry.trim() ||
      !form.cvc.trim() ||
      !form.zip.trim()
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!booking?.property_id && furnitureItems.length === 0) {
      toast.error("Missing booking information.");
      return;
    }

    if (booking?.property_id) {
      if (!booking?.check_in || !booking?.check_out) {
        toast.error("Missing booking dates.");
        return;
      }

      if (new Date(booking.check_out) <= new Date(booking.check_in)) {
        toast.error("Check-out must be after check-in.");
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in first.");
      setTimeout(() => navigate("/login"), 1000);
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "/api/payments",
        {
          property_id: booking?.property_id,
          check_in: booking?.check_in,
          check_out: booking?.check_out,
          guests: booking?.guests || 1,
          amount: grandTotal
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Booking successful!");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      console.error("Payment error:", err.response?.data || err);
      toast.error(err.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <>
        <Navbar />
        <div className="payment-page">
          <h2>No booking data found.</h2>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="payment-page">
        <h2>Complete Your Booking</h2>

        <div className="payment-layout">
          <div className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Credit Card Number</label>
              <input
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={form.cardNumber}
                onChange={handleChange}
                maxLength={19}
              />
            </div>

            <div className="form-group">
              <label>Billing Address</label>
              <input
                name="billingAddress"
                placeholder="123 Main St, Saskatoon"
                value={form.billingAddress}
                onChange={handleChange}
              />
            </div>

            <div className="form-row form-row-small">
              <div className="form-group">
                <label>MM/YY</label>
                <input
                  name="expiry"
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={handleChange}
                  maxLength={5}
                />
              </div>

              <div className="form-group">
                <label>CVC</label>
                <input
                  name="cvc"
                  placeholder="CVC"
                  value={form.cvc}
                  onChange={handleChange}
                  maxLength={3}
                />
              </div>

              <div className="form-group">
                <label>ZIP / Postal</label>
                <input
                  name="zip"
                  placeholder="S7N 0W0"
                  value={form.zip}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button className="pay-btn" onClick={handlePay} disabled={loading}>
              {loading ? "Processing..." : "Confirm Booking"}
            </button>

            <p className="pay-note">This is a demo checkout flow for booking confirmation.</p>
          </div>

          <div className="booking-summary">
            {booking.property_title && (
              <>
                {booking.property_image && (
                  <img src={booking.property_image} alt="property" />
                )}

                <h3>{booking.property_title}</h3>

                <div className="summary-row">
                  <span>Dates</span>
                  <span>
                    {booking.check_in} → {booking.check_out}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Guests × Nights</span>
                  <span>
                    {booking.guests} × {booking.nights}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Property Total</span>
                  <span>${propertyTotal.toFixed(2)}</span>
                </div>

                <hr className="summary-divider" />
              </>
            )}

            {furnitureItems.length > 0 && (
              <>
                <h3>Furniture</h3>

                {furnitureItems.map((item) => (
                  <div key={item.id} className="summary-row">
                    <span>{item.name}</span>
                    <span>${Number(item.price).toFixed(2)}</span>
                  </div>
                ))}

                <div className="summary-row">
                  <span>Furniture Total</span>
                  <span>${furnitureTotal.toFixed(2)}</span>
                </div>

                <hr className="summary-divider" />
              </>
            )}

            <div className="summary-row">
              <span>GST (5%)</span>
              <span>${gst.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>PST (6%)</span>
              <span>${pst.toFixed(2)}</span>
            </div>

            <hr className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}