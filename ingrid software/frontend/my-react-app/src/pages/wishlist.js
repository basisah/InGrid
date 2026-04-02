import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../listingpage/listing.css";
import "./Wishlist.css";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistProperties, setWishlistProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchWishlist = async () => {
      try {
        const wishlistRes = await axios.get("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ids = wishlistRes.data;

        const propertiesRes = await axios.get("/api/properties");
        const saved = propertiesRes.data.filter(p => ids.includes(p.id));
        setWishlistProperties(saved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  if (loading) return <p style={{ padding: "40px" }}>Loading wishlist...</p>;

  return (
    <div className="wishlist-page">
      <h2>Your Wishlist ❤️</h2>

      {wishlistProperties.length === 0 ? (
        <p className="wishlist-empty">No saved properties yet. Click the ❤️ on a listing to save it!</p>
      ) : (
        <div className="property-grid">
          {wishlistProperties.map(property => (
            <div className="property-card" key={property.id}>
              <img src={property.main_image} alt="property" />
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
                  <button>View Details</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}