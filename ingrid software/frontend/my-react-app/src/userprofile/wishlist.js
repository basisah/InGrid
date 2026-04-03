import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "../listingpage/listing.css";
import "./wishlist.css";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistProperties, setWishlistProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchWishlist = async () => {
      try {
        const wishlistRes = await axios.get("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ids = wishlistRes.data;

        const propertiesRes = await axios.get("/api/properties");
        const saved = propertiesRes.data.filter((p) => ids.includes(p.id));
        setWishlistProperties(saved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const removeFromWishlist = async (propertyId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`/api/wishlist/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setWishlistProperties((prev) =>
        prev.filter((p) => p.id !== propertyId)
      );
    } catch (err) {
      console.error("Remove wishlist failed:", err);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <p style={{ padding: "40px" }}>Loading wishlist...</p>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="wishlist-page">
        <div className="wishlist-header">
          <h2>Your Wishlist ❤️</h2>
          <p>Saved places you may want to come back to.</p>
        </div>

        {wishlistProperties.length === 0 ? (
          <p className="wishlist-empty">
            No saved properties yet. Click the ❤️ on a listing to save it.
          </p>
        ) : (
          <div className="property-grid">
            {wishlistProperties.map((property) => (
              <div className="property-card wishlist-card" key={property.id}>
                <div style={{ position: "relative" }}>
                  <img src={property.main_image} alt={property.title} />

                  <button
                    className="wishlist-remove-btn"
                    onClick={() => removeFromWishlist(property.id)}
                    type="button"
                  >
                    ❤️
                  </button>
                </div>

                <div className="wishlist-card-body">
                  <h3>{property.title}</h3>
                  <p>{property.address}</p>
                  <p className="price">${property.price}</p>

                  <div className="details">
                    <span>{property.bedrooms} Beds</span>
                    <span>{property.bathrooms} Baths</span>
                    <span>{property.size} sqft</span>
                  </div>

                  <div className="card-buttons">
                    <Link to={`/property/${property.id}`}>
                      <button className="view-btn">View Details</button>
                    </Link>
                  </div>
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