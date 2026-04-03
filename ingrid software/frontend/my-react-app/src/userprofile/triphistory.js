import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "../listingpage/listing.css";

export default function TripHistory() {
  const navigate = useNavigate();
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) => dateStr?.split("T")[0];
  const today = new Date();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        const past = r.data.filter((t) => new Date(t.check_out) < today);
        setPastTrips(past);
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <p style={{ padding: "40px" }}>Loading trip history...</p>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px 60px", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "8px" }}>Trip History</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Your previous stays and bookings.
          </p>
        </div>

        {pastTrips.length === 0 ? (
          <p style={{ color: "#777" }}>No past trips yet.</p>
        ) : (
          <div className="property-grid">
            {pastTrips.map((trip) => (
              <div
                className="property-card"
                key={trip.id}
                onClick={() => navigate(`/property/${trip.property_id}`)}
                style={{ cursor: "pointer", overflow: "hidden" }}
              >
                <img
                  src={trip.main_image || "https://via.placeholder.com/400x240?text=Property"}
                  alt={trip.title}
                />

                <div style={{ padding: "16px" }}>
                  <h3>{trip.title}</h3>
                  <p>{trip.address}</p>
                  <p className="price">${trip.amount}</p>
                  <p style={{ fontSize: "13px", color: "#555" }}>
                    {formatDate(trip.check_in)} → {formatDate(trip.check_out)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}