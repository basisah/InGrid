import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import "./profile.css";
import { io } from "socket.io-client";

const socket = io("/", {
  transports: ["websocket", "polling"]
});

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [messages, setMessages] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [messageTab, setMessageTab] = useState("all");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myFurniture, setMyFurniture] = useState([]);

  const token = localStorage.getItem("token");
  const today = new Date();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  const currentTrips = useMemo(
    () => trips.filter((t) => new Date(t.check_out) >= today),
    [trips]
  );

  const pastTrips = useMemo(
    () => trips.filter((t) => new Date(t.check_out) < today),
    [trips]
  );

  const filteredMessages = useMemo(() => {
    if (messageTab === "buyers") {
      return messages.filter((m) => m.other_user_role !== "landlord");
    }
    if (messageTab === "landlords") {
      return messages.filter((m) => m.other_user_role === "landlord");
    }
    return messages;
  }, [messages, messageTab]);

  const fetchInbox = async (authToken = token) => {
    if (!authToken) return;

    try {
      const inboxRes = await axios.get("/api/messages/inbox", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setMessages(Array.isArray(inboxRes.data) ? inboxRes.data : []);
    } catch (err) {
      console.error("Inbox fetch failed:", err);
      setMessages([]);
    }
  };

  const fetchProfileData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const profileRes = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        navigate("/login");
        return;
      }

      const profileData = await profileRes.json();
      setUser(profileData.user);

      const userId = profileData?.user?.id;

      if (userId) {
        try {
          const verifyRes = await axios.get(`/api/verify-status/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setVerificationStatus(verifyRes.data.status || "pending");
        } catch {
          setVerificationStatus("pending");
        }
      }

      try {
        const tripsRes = await axios.get("/api/payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : []);
      } catch {
        setTrips([]);
      }
      try {
        const myListingsRes = await axios.get("/api/my-properties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyListings(Array.isArray(myListingsRes.data) ? myListingsRes.data : []);
      } catch {
        setMyListings([]);
      }

      try {
        const myFurnitureRes = await axios.get("/api/my-furniture", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyFurniture(Array.isArray(myFurnitureRes.data) ? myFurnitureRes.data : []);
      } catch {
        setMyFurniture([]);
      }

      await fetchInbox(token);
    } catch (error) {
      console.error("Profile fetch error:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    socket.emit("join_user_room", user.id);

    const refreshInbox = async () => {
      await fetchInbox();
    };

    const handleUsersOnline = (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    };

    socket.on("inbox_updated", refreshInbox);
    socket.on("users_online", handleUsersOnline);

    return () => {
      socket.off("inbox_updated", refreshInbox);
      socket.off("users_online", handleUsersOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      alert("Please select an image file.");
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;

          await axios.put(
            "/api/profile/picture",
            { profile_picture: base64 },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setUser((prev) => ({
            ...prev,
            profile_picture: base64,
          }));
        } catch (err) {
          console.error("Upload failed:", err);
          alert("Failed to upload profile picture.");
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openConversation = async (msg) => {
    try {
      if (token) {
        await axios.post(
          "/api/messages/read",
          {
            property_id: Number(msg.property_id),
            other_user_id: Number(msg.other_user_id),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }

    navigate(`/chat/${msg.property_id}/${msg.other_user_id}`);
  };
  const handleDeleteListing = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      await axios.delete(`/api/properties/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyListings((prev) => prev.filter((listing) => listing.id !== listingId));
      alert("Listing deleted successfully.");
    } catch (err) {
      console.error("Delete listing failed:", err);
      alert(err.response?.data?.message || "Failed to delete listing.");
    }
  };

  const handleDeleteFurniture = async (furnitureId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this furniture post? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      await axios.delete(`/api/furniture/${furnitureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMyFurniture((prev) => prev.filter((item) => item.id !== furnitureId));
      alert("Furniture deleted successfully.");
    } catch (err) {
      console.error("Delete furniture failed:", err);
      alert(err.response?.data?.message || "Failed to delete furniture.");
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || "";
    const last = user?.last_name?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some((id) => String(id) === String(userId));
  };

  const totalUnread = messages.reduce(
    (sum, msg) => sum + Number(msg.unread_count || 0),
    0
  );

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading profile...</p>;
  }

  if (!user) {
    return <p style={{ padding: "40px" }}>No user data available.</p>;
  }

  return (
    <>
      <Navbar />

      <div className="profile-shell">
        <div className="profile-layout">
          <aside className="profile-sidebar-card">
            <div className="profile-avatar-wrap">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {getInitials()}
                </div>
              )}

              <button
                type="button"
                className="profile-edit-avatar-btn"
                onClick={triggerFileInput}
                title="Change profile picture"
              >
                ✎
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                className="profile-hidden-input"
              />
            </div>

            <div className="profile-identity">
              <h1>
                {user.first_name} {user.last_name}
                {verificationStatus === "verified" && (
                  <span className="verify-badge verified">Verified</span>
                )}
                {verificationStatus === "pending" && (
                  <span className="verify-badge pending">Pending</span>
                )}
                {verificationStatus === "rejected" && (
                  <span className="verify-badge rejected">Rejected</span>
                )}
              </h1>

              <p className="profile-subtext">{user.email}</p>
              <p className="profile-location">
                📍 {user.home_address || "Saskatoon, Canada"}
              </p>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <strong>{trips.length}</strong>
                <span>Trips</span>
              </div>
              <div className="stat-item">
                <strong>{pastTrips.length}</strong>
                <span>Past</span>
              </div>
              <div className="stat-item">
                <strong>{totalUnread}</strong>
                <span>Unread</span>
              </div>
            </div>

            <div className="profile-info-card">
              <h3>Account Info</h3>
              <div className="info-row">
                <span>📧</span>
                <p>{user.email}</p>
              </div>
              <div className="info-row">
                <span>📞</span>
                <p>{user.phone_number || "Not provided"}</p>
              </div>
              <div className="info-row">
                <span>🎂</span>
                <p>{user.date_of_birth ? formatDate(user.date_of_birth) : "Not provided"}</p>
              </div>
              <div className="info-row">
                <span>👤</span>
                <p>{user.role || "user"}</p>
              </div>
            </div>

            <button className="profile-logout-btn" onClick={handleLogout}>
              Log Out
            </button>

            {uploading && <p className="uploading-note">Uploading photo...</p>}
          </aside>

          <main className="profile-main">
            <section className="profile-panel">
              <div className="panel-header">
                <div>
                  <h2>Current Reservations</h2>
                  <p>Your active and upcoming stays</p>
                </div>
              </div>

              {currentTrips.length === 0 ? (
                <div className="empty-state">No current reservations.</div>
              ) : (
                <div className="reservation-list">
                  {currentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="reservation-card"
                      onClick={() => navigate(`/property/${trip.property_id}`)}
                    >
                      <div className="reservation-thumb">
                        {trip.main_image ? (
                          <img src={trip.main_image} alt={trip.title} />
                        ) : (
                          <div className="reservation-thumb-fallback">🏠</div>
                        )}
                      </div>

                      <div className="reservation-content">
                        <h4>{trip.title}</h4>
                        <p>{trip.address}</p>
                        <span>
                          {formatDate(trip.check_in)} - {formatDate(trip.check_out)}
                        </span>
                      </div>

                      <div className="reservation-price">${trip.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="profile-panel">
              <div className="panel-header">
                <div>
                  <h2>Messages</h2>
                  <p>Talk to buyers, landlords, and tenants like a marketplace inbox</p>
                </div>

                <div className="message-tabs">
                  <button
                    className={messageTab === "all" ? "active" : ""}
                    onClick={() => setMessageTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={messageTab === "buyers" ? "active" : ""}
                    onClick={() => setMessageTab("buyers")}
                  >
                    Buyers / Tenants
                  </button>
                  <button
                    className={messageTab === "landlords" ? "active" : ""}
                    onClick={() => setMessageTab("landlords")}
                  >
                    Landlords
                  </button>
                </div>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="empty-state">No conversations yet.</div>
              ) : (
                <div className="conversation-list">
                  {filteredMessages.map((msg) => (
                    <button
                      key={`${msg.property_id}-${msg.other_user_id}`}
                      className="conversation-card"
                      onClick={() => openConversation(msg)}
                      type="button"
                    >
                      <div className="conversation-left">
                        <div className="conversation-avatar">
                          {msg.other_user_picture ? (
                            <img
                              src={msg.other_user_picture}
                              alt={msg.other_user_name}
                            />
                          ) : (
                            <span>
                              {(msg.other_user_name || "U").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="conversation-body">
                          <div className="conversation-topline">
                            <h4>{msg.other_user_name || "User"}</h4>
                            <span className="conversation-role">
                              {msg.other_user_role || "user"}
                            </span>

                            {isUserOnline(msg.other_user_id) && (
                              <span className="conversation-online">Online</span>
                            )}
                          </div>

                          <p className="conversation-property">
                            About: {msg.property_title || `Listing #${msg.property_id}`}
                          </p>

                          <p className="conversation-preview">
                            {msg.last_message || "Open conversation"}
                          </p>
                        </div>
                      </div>

                      <div className="conversation-right">
                        <span>{formatDate(msg.last_message_time)}</span>

                        {Number(msg.unread_count || 0) > 0 && (
                          <span className="conversation-badge">
                            {msg.unread_count}
                          </span>
                        )}

                        <span className="conversation-open">Open →</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="profile-panel">
              <div className="panel-header">
                <div>
                  <h2>Previous Trips</h2>
                  <p>Your completed bookings</p>
                </div>

                <button
                  className="see-all-btn"
                  onClick={() => navigate("/trips")}
                >
                  See all →
                </button>
              </div>

              {pastTrips.length === 0 ? (
                <div className="empty-state">No past trips yet.</div>
              ) : (
                <div className="past-trip-grid">
                  {pastTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="trip-card"
                      onClick={() => navigate(`/property/${trip.property_id}`)}
                    >
                      <div className="trip-card-image">
                        {trip.main_image ? (
                          <img src={trip.main_image} alt={trip.title} />
                        ) : (
                          <div className="trip-card-fallback">🏠</div>
                        )}
                      </div>

                      <div className="trip-card-body">
                        <h4>{trip.title}</h4>
                        <p>{trip.address}</p>
                        <span>
                          {formatDate(trip.check_in)} - {formatDate(trip.check_out)}
                        </span>
                        <strong>${trip.amount}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="profile-panel">
              <div className="panel-header">
                <div>
                  <h2>My Listings</h2>
                  <p>Properties you posted as a landlord</p>
                </div>
              </div>

              {myListings.length === 0 ? (
                <div className="empty-state">You have not posted any listings yet.</div>
              ) : (
                <div className="my-listings-grid">
                  {myListings.map((listing) => (
                    <div className="my-listing-card" key={listing.id}>
                      <div
                        className="my-listing-image-wrap"
                        onClick={() => navigate(`/property/${listing.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            navigate(`/property/${listing.id}`);
                          }
                        }}
                      >
                        {listing.display_image || listing.main_image ? (
                          <img
                            src={listing.display_image || listing.main_image}
                            alt={listing.title}
                            className="my-listing-image"
                          />
                        ) : (
                          <div className="my-listing-fallback">🏠</div>
                        )}

                        <span className="my-listing-price">${listing.price}</span>
                      </div>

                      <div className="my-listing-body">
                        <h4>{listing.title}</h4>
                        <p className="my-listing-address">{listing.address}</p>

                        <div className="my-listing-meta">
                          <span style={{ textTransform: "capitalize" }}>{listing.type}</span>
                          <span>{listing.bedrooms || 0} Beds</span>
                          <span>{listing.bathrooms || 0} Baths</span>
                          <span>{listing.size || 0} sqft</span>
                        </div>

                        <div className="listing-card-actions">
                          <button
                            className="listing-card-btn secondary"
                            onClick={() => navigate(`/property/${listing.id}`)}
                            type="button"
                          >
                            View
                          </button>

                          <button
                            className="listing-card-btn primary"
                            onClick={() => navigate(`/post-property?edit=${listing.id}`)}
                            type="button"
                          >
                            Edit
                          </button>

                          <button
                            className="profile-delete-btn"
                            onClick={() => handleDeleteListing(listing.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="profile-panel">
              <div className="panel-header">
                <div>
                  <h2>My Furniture</h2>
                  <p>Furniture posts you created in the store</p>
                </div>
              </div>

              {myFurniture.length === 0 ? (
                <div className="empty-state">You have not posted any furniture yet.</div>
              ) : (
                <div className="my-listings-grid">
                  {myFurniture.map((item) => (
                    <div className="my-listing-card" key={item.id}>
                      <div className="my-listing-image-wrap">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="my-listing-image"
                          />
                        ) : (
                          <div className="my-listing-fallback">🪑</div>
                        )}

                        <span className="my-listing-price">${Number(item.price || 0).toFixed(2)}</span>
                      </div>

                      <div className="my-listing-body">
                        <h4>{item.name}</h4>
                        <p className="my-listing-address">{item.category}</p>

                        <div className="my-listing-meta">
                          <span>{item.sizeCategory || "medium"}</span>
                          <span>{item.isUserPosted ? "User Post" : "Store Item"}</span>
                        </div>

                        <div className="listing-card-actions">
                          <button
                            className="profile-delete-btn"
                            onClick={() => handleDeleteFurniture(item.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

export default Profile;