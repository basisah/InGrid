import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import "./listing.css";

export default function Listings() {
  const [properties, setProperties] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const locationHook = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });

  const fetchProperties = async (customFilters = filters) => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || "";

      const cleanedFilters = Object.fromEntries(
        Object.entries(customFilters).filter(([, value]) => value !== "")
      );

      const response = await axios.get(`${API_URL}/api/properties`, {
        params: cleanedFilters,
      });

      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(locationHook.search);

    const newFilters = {
      location: params.get("location") || "",
      type: params.get("type") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
    };

    setFilters(newFilters);
    fetchProperties(newFilters);
  }, [locationHook.search]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setWishlist(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (filters.location) params.set("location", filters.location);
    if (filters.type) params.set("type", filters.type);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    navigate(`/listings?${params.toString()}`);
  };

  const toggleWishlist = async (propertyId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      if (wishlist.includes(propertyId)) {
        await axios.delete(`/api/wishlist/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlist((prev) => prev.filter((id) => id !== propertyId));
        setWishlistMessage("Removed from wishlist");
      } else {
        await axios.post(
          `/api/wishlist/${propertyId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setWishlist((prev) => [...prev, propertyId]);
        setWishlistMessage("Added to wishlist");
      }

      setTimeout(() => setWishlistMessage(""), 2000);
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  const handleCompare = (property) => {
    if (compareList.find((p) => p.id === property.id)) return;

    if (compareList.length >= 3) {
      alert("You can only compare up to 3 properties.");
      return;
    }

    setCompareList((prev) => [...prev, property]);
  };

  return (
    <>
      <Navbar />

      <div className="listings-page">
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
          />

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="rental">Rental</option>
            <option value="short-term">Short-Term</option>
            <option value="buy">Buy</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
          />

          <button className="filter-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {loading ? (
          <p>Loading properties...</p>
        ) : properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          <div className="property-grid">
            {properties.map((property) => (
              <div className="home-property-card" key={property.id}>
                <div className="card-image" style={{ position: "relative" }}>
                  <img src={property.main_image} alt={property.title} />

                  <button
                    className={`save-icon-btn ${
                      wishlist.includes(property.id) ? "saved" : ""
                    }`}
                    onClick={() => toggleWishlist(property.id)}
                    type="button"
                  >
                    {wishlist.includes(property.id) ? "❤️" : "🤍"}
                  </button>

                  <span className="price-badge">${property.price}</span>
                </div>

                <div className="card-content">
                  <h3>{property.title}</h3>
                  <p className="address">{property.address}</p>

                  <div className="details">
                    <span>{property.bedrooms} Beds</span>
                    <span>{property.bathrooms} Baths</span>
                    <span>{property.size} sqft</span>
                  </div>

                  <div className="card-buttons">
                    <Link to={`/property/${property.id}`}>
                      <button className="view-btn">View Details</button>
                    </Link>

                    <button
                      className="compare-btn"
                      onClick={() => handleCompare(property)}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {compareList.length > 0 && (
          <div className="compare-bar">
            <Link to="/compare" state={{ properties: compareList }}>
              Compare ({compareList.length})
            </Link>
          </div>
        )}

        {wishlistMessage && (
          <div
            style={{
              position: "fixed",
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1b5e20",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              zIndex: 1000,
            }}
          >
            {wishlistMessage}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}