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
  const today = new Date(); // for filtering current vs past trips
  const formatDate = (dateStr) => dateStr?.split("T")[0]; // helper to format date strings
  const currentTrips = trips.filter(t => new Date(t.check_out) >= today); // filter for current/upcoming trips
  const pastTrips = trips.filter(t => new Date(t.check_out) < today); // filter for past trips
  const [editingPicture, setEditingPicture] = useState(false);

const handlePictureUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result;
    const token = localStorage.getItem("token");
    await axios.put("/api/profile/picture", 
      { profile_picture: base64 },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    setUser({ ...user, profile_picture: base64 });
    setEditingPicture(false);
  };
  reader.readAsDataURL(file);
};
  

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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "8px" }}>
            <h4 style={{ margin: 0 }}>Current Reservations</h4>
          </div>
          <hr style={{ marginBottom: "12px" }} />
          {currentTrips.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#777" }}>No current reservations.</p>
          ) : (
            currentTrips.map(t => (
              <div key={t.id} style={{ background: "#f5f5f5", borderRadius: "10px", padding: "12px", marginBottom: "10px", fontSize: "14px" }}>
                <strong>{t.title}</strong>
                <p style={{ margin: "4px 0", color: "#555" }}>{t.address}</p>
                <p style={{ margin: "4px 0", color: "#1b5e20" }}>${t.amount}</p>
                <p style={{ margin: "0", color: "#888" }}>{formatDate(t.check_in)} → {formatDate(t.check_out)}</p>
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
            <span onClick={() => navigate("/trips")} style={{ color: "#1b5e20", cursor: "pointer", fontSize: "14px" }}>See all →</span>
          </div>
          <hr style={{ marginBottom: "20px" }} />

          {pastTrips.length === 0 ? (
            <p style={{ color: "#777" }}>No past trips yet.</p> //basisah - added message for no past trips
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {pastTrips.map(trip => (
                <div key={trip.id} style={{ borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", cursor: "pointer" }}
                  onClick={() => navigate(`/property/${trip.property_id}`)}>
                  <div style={{ height: "140px", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
                    🏠
                  </div>
                  <div style={{ padding: "12px" }}>
                    <strong>{trip.title}</strong>
                    <p style={{ fontSize: "13px", color: "#555", margin: "4px 0" }}>{trip.address}</p>
                    <p style={{ fontSize: "13px", color: "#1b5e20", margin: "0" }}>${trip.amount} · {formatDate(trip.check_in)} → {formatDate(trip.check_out)}</p> 
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



