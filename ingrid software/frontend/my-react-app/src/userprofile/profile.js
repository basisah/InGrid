import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState([]);
  const [history, setHistory] = useState([]);

  //state for verification status
  const [verificationStatus, setVerificationStatus] = useState("pending");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login"); // redirect if no token
        return;
      }

      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";

        const response = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });


        const data = await response.json();

        if (response.ok) {
          setUser(data.user); // assuming backend sends { user: { ... } }
          setSavedListings(data.savedListings || []);
          setHistory(data.history || []);
        } else {
          setMessage(data.message || "Failed to fetch profile.");
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        }
        //Add fetch for verification status
        const verifyRes = await fetch(`${API_URL}/api/verify-status/${data.user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
});
        const verifyData = await verifyRes.json();
        setVerificationStatus(verifyData.status);
      } catch (error) {
        console.error("Profile fetch error:", error);
        setMessage("Server error. Please try again later.");
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

  if (loading) return <p>Loading profile...</p>;

  if (!user) return <p>{message || "No user data available."}</p>;

  return (
    <div className="profile-page">
      //Add verification status badge next to user's name
      <div className="profile-card">
        <h2> 
          Welcome, {user.first_name} {user.last_name}
          {verificationStatus === "verified" && (
          <span style={{ marginLeft: "10px", color: "#27ae60" }}>✅ Verified</span>
            )}
          {verificationStatus === "pending" && (
          <span style={{ marginLeft: "10px", color: "#f39c12" }}>⏳ Pending Verification</span>
          )}
          {verificationStatus === "rejected" && (
          <span style={{ marginLeft: "10px", color: "#e74c3c" }}>❌ Verification Rejected</span>
        )}
</h2>

        <div className="profile-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone_number}</p>
          <p><strong>Address:</strong> {user.home_address}</p>
          <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
{/* saved lisitng  */}
  <div className="profile-section">
    <h3>Saved Listings</h3>
    {savedListings.length === 0 ? (
      <p>No saved listings yet.</p>
    ) : (
      <div className="listing-grid">
        {savedListings.map((listing) => (
          <div key={listing.id} className="listing-card">
            <h4>{listing.title}</h4>
            <p>${listing.price}</p>
          </div>
        ))}
      </div>
    )}
  </div>
{/* recently viewed page */}
  <div className="profile-section">
    <h3>Recently Viewed</h3>
    {history.length === 0 ? (
      <p>No viewing history yet.</p>
    ) : (
      <div className="listing-grid">
        {history.map((listing) => (
          <div key={listing.id} className="listing-card">
            <h4>{listing.title}</h4>
            <p>${listing.price}</p>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
  );
}

export default Profile;
