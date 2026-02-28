import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState([]);
  const [history, setHistory] = useState([]);

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
    <div className="profile-container">
      <h2>Welcome, {user.first_name} {user.last_name}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone_number}</p>
      <p><strong>Address:</strong> {user.home_address}</p>
      <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <h3>Saved Listings</h3>
      {savedListings.length === 0 ? (
        <p>No saved listings yet.</p>
      ) : (
        <ul>
          {savedListings.map((listing) => (
            <li key={listing.id}>
              <strong>{listing.title}</strong> - ${listing.price}
            </li>
          ))}
        </ul>
      )}
    {/* THE HISTORY PAGE IN PROFILE */}
      <h3>Recently Viewed</h3>
      {history.length === 0 ? (
        <p>No viewing history yet.</p>
      ) : (
        <ul>
          {history.map((listing) => (
            <li key={listing.id}>
              <strong>{listing.title}</strong> - ${listing.price}
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Profile;
