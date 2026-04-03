import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [editingPicture, setEditingPicture] = useState(false);

  const today = new Date();
  const formatDate = (dateStr) => dateStr?.split("T")[0];

  const currentTrips = trips.filter((t) => new Date(t.check_out) >= today);
  const pastTrips = trips.filter((t) => new Date(t.check_out) < today);

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const token = localStorage.getItem("token");

        await axios.put(
          "/api/profile/picture",
          { profile_picture: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser((prev) => ({ ...prev, profile_picture: base64 }));
        setEditingPicture(false);
      } catch (error) {
        console.error("Profile picture upload failed:", error);
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const profileRes = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await profileRes.json();
        setUser(data.user);

        const verifyRes = await axios.get(`/api/verify-status/${data.user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVerificationStatus(verifyRes.data.status);

        const tripsRes = await axios.get("/api/payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : []);
      } catch (error) {
        console.error("Profile fetch error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <p style={{ padding: "40px" }}>Loading profile...</p>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <p style={{ padding: "40px" }}>No user data available.</p>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="profile-shell">
        <div className="profile-layout">
          <aside className="profile-sidebar-panel">
            <div className="profile-avatar-wrap">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="avatar"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">👤</div>
              )}

              <button
                className="profile-edit-btn"
                onClick={() => setEditingPicture(!editingPicture)}
                type="button"
              >
                ✏️
              </button>
            </div>

            {editingPicture && (
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                className="profile-file-input"
              />
            )}

            <h2 className="profile-name">
              {user.first_name} {user.last_name}
              {verificationStatus === "verified" && (
                <span className="profile-verified">✅</span>
              )}
              {verificationStatus === "pending" && (
                <span className="profile-pending">⏳</span>
              )}
              {verificationStatus === "rejected" && (
                <span className="profile-rejected">❌</span>
              )}
            </h2>

            <div className="profile-mini-stats">
              <span><strong>{trips.length}</strong> Trips</span>
              <span>|</span>
              <span><strong>{pastTrips.length}</strong> Past</span>
            </div>

            <p className="profile-location">
              📍 {user.home_address || "Saskatoon, Canada"}
            </p>

            <div className="profile-info-card">
              <h3>Account Info</h3>
              <p>📧 {user.email}</p>
              <p>📞 {user.phone_number || "Not provided"}</p>
              <p>🎂 {user.date_of_birth || "Not provided"}</p>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </aside>

          <main className="profile-main-panel">
            <section className="profile-block">
              <div className="profile-block-header">
                <h3>Current Reservations</h3>
              </div>

              {currentTrips.length === 0 ? (
                <p className="profile-empty">No current reservations.</p>
              ) : (
                <div className="profile-trip-list">
                  {currentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="profile-reservation-card"
                      onClick={() => navigate(`/property/${trip.property_id}`)}
                    >
                      <img
                        src={trip.main_image || "https://via.placeholder.com/400x240?text=Property"}
                        alt={trip.title}
                      />
                      <div className="profile-reservation-info">
                        <strong>{trip.title}</strong>
                        <p>{trip.address}</p>
                        <p>${trip.amount}</p>
                        <span>
                          {formatDate(trip.check_in)} → {formatDate(trip.check_out)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="profile-block">
              <div className="profile-block-header">
                <h3>Previous Trips</h3>
                <span onClick={() => navigate("/trips")} className="profile-linkish">
                  See all →
                </span>
              </div>

              {pastTrips.length === 0 ? (
                <p className="profile-empty">No past trips yet.</p>
              ) : (
                <div className="profile-trip-grid">
                  {pastTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="profile-trip-card"
                      onClick={() => navigate(`/property/${trip.property_id}`)}
                    >
                      <img
                        src={trip.main_image || "https://via.placeholder.com/400x240?text=Property"}
                        alt={trip.title}
                      />
                      <div className="profile-trip-content">
                        <strong>{trip.title}</strong>
                        <p>{trip.address}</p>
                        <p className="profile-trip-price">
                          ${trip.amount} · {formatDate(trip.check_in)} → {formatDate(trip.check_out)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Profile;