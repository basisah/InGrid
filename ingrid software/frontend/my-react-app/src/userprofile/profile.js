import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//mking changes to profilepage
function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]); //exchanged saved listings,history for trips
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("pending");// state for verification status

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // redirect if no token
        return;
      }
      try {
        const profileRes = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await profileRes.json();
        setUser(data.user); // assuming backend sends { user: { ... } }

        const verifyRes = await axios.get(`/api/verify-status/${data.user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setVerificationStatus(verifyRes.data.status);

    const tripsRes = await axios.get("/api/payments", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTrips(tripsRes.data);
  }     catch (error) {
        console.error("Profile fetch error:", error);
        navigate("/login"); // redirect on error (e.g. invalid token)
      } finally {
        setLoading(false);
      }
    };
 fetchProfile();
  }, [navigate]);

  if (loading) return <p style={{ padding: "40px" }}>Loading profile...</p>;
  if (!user) return <p style={{ padding: "40px" }}>No user data available.</p>;

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", maxWidth: "1100px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", gap: "60px" }}>

        {/* LEFT SIDE */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#1b5e20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", color: "white", marginBottom: "16px" }}>
            👤
          </div>

          <h2 style={{ margin: "0 0 4px" }}>
            {user.first_name} {user.last_name}
            {verificationStatus === "verified" && <span style={{ marginLeft: "8px", color: "#27ae60" }}>✅</span>}
            {verificationStatus === "pending" && <span style={{ marginLeft: "8px", color: "#f39c12" }}>⏳</span>}
            {verificationStatus === "rejected" && <span style={{ marginLeft: "8px", color: "#e74c3c" }}>❌</span>}
          </h2>

          <div style={{ display: "flex", gap: "16px", margin: "12px 0", fontSize: "14px", color: "#555" }}>
            <span><strong>{trips.length}</strong> Trips</span>
            <span>|</span>
            <span><strong>0</strong> Reviews</span>
          </div>

          <p style={{ fontSize: "14px", color: "#555", marginBottom: "16px" }}>
            📍 {user.home_address || "Saskatoon, Canada"}
          </p>

          <h4 style={{ marginBottom: "8px" }}>Bio</h4>
          <hr style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", color: "#777" }}>No bio yet.</p>

          <h4 style={{ marginTop: "30px", marginBottom: "8px" }}>Current Reservations</h4>
          <hr style={{ marginBottom: "12px" }} />
          {trips.filter(t => t.status === "completed").length === 0 ? (
            <p style={{ fontSize: "14px", color: "#777" }}>No current reservations.</p>
          ) : (
            trips.filter(t => t.status === "completed").map(t => (
              <div key={t.id} style={{ background: "#f5f5f5", borderRadius: "10px", padding: "12px", marginBottom: "10px", fontSize: "14px" }}>
                <strong>{t.title}</strong>
                <p style={{ margin: "4px 0", color: "#555" }}>{t.address}</p>
                <p style={{ margin: "4px 0", color: "#1b5e20" }}>${t.amount}</p>
                <p style={{ margin: "0", color: "#888" }}>{t.check_in} → {t.check_out}</p>
              </div>
            ))
          )}

          <h4 style={{ marginTop: "30px", marginBottom: "8px" }}>Account Info</h4>
          <hr style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "14px", color: "#555" }}>📧 {user.email}</p>
          <p style={{ fontSize: "14px", color: "#555" }}>📞 {user.phone_number || "Not provided"}</p>
          <p style={{ fontSize: "14px", color: "#555" }}>🎂 {user.date_of_birth || "Not provided"}</p>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Previous Trips</h3>
            <span style={{ color: "#1b5e20", cursor: "pointer", fontSize: "14px" }}>See all →</span>
          </div>
          <hr style={{ marginBottom: "20px" }} />

          {trips.length === 0 ? (
            <p style={{ color: "#777" }}>No trips yet. Book a property to get started!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {trips.map(trip => (
                <div key={trip.id} style={{ borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", cursor: "pointer" }}
                  onClick={() => navigate(`/property/${trip.property_id}`)}>
                  <div style={{ height: "140px", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
                    🏠
                  </div>
                  <div style={{ padding: "12px" }}>
                    <strong>{trip.title}</strong>
                    <p style={{ fontSize: "13px", color: "#555", margin: "4px 0" }}>{trip.address}</p>
                    <p style={{ fontSize: "13px", color: "#1b5e20", margin: "0" }}>${trip.amount} · {trip.check_in} → {trip.check_out}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
export default Profile;



