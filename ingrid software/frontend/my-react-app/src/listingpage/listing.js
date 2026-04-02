import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./listing.css";
export default function Listings() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });
  const [compareList, setCompareList] = useState([]);
  
  const [wishlist, setWishlist] = useState([]);
  const [wishlistMessage, setWishlistMessage] = useState("");

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;
  axios.get("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } })
    .then(r => setWishlist(r.data))
    .catch(() => {});
}, []);

const toggleWishlist = async (e, propertyId) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) return;
  if (wishlist.includes(propertyId)) {
    await axios.delete(`/api/wishlist/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
    setWishlist(wishlist.filter(id => id !== propertyId));
    setWishlistMessage("Removed from wishlist");
  } else {
    await axios.post(`/api/wishlist/${propertyId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setWishlist([...wishlist, propertyId]);
    setWishlistMessage("Added to wishlist");
  }
  setTimeout(() => setWishlistMessage(""), 2000);
};

  const fetchProperties = async () => {
    const API_URL = process.env.REACT_APP_API_URL || ""; //basisah - rremoved the api constant
    const response = await axios.get(`${API_URL}/api/properties`, { params: filters }); //basisah - added filters as query params
    setProperties(response.data);
  };
  
  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCompare = (property) => {
  if (compareList.length >= 3) {
    alert("You can only compare up to 3 properties.");
    return;
  }

  if (compareList.find(p => p.id === property.id)) return;

  setCompareList(prev => [...prev, property]);
  };

  return (
    <div className="listings-page">

      {/* FILTER SECTION */}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Location"
          onChange={(e) =>
            setFilters({ ...filters, location: e.target.value })
          }
        />

        <select
          onChange={(e) =>
            setFilters({ ...filters, type: e.target.value })
          }
        >
          <option value="">All Types</option>
          <option value="rental">Rental</option>
          <option value="short-term">Short-Term</option>
          <option value="buy">Buy</option>
        </select>
        <input
              type="number"
              placeholder="Min Price"
              onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
              }
              />
              <input
              type="number"
              placeholder="Max Price"
              onChange={(e) =>
                setFilters({ ...filters, maxPrice: e.target.value })
                }
                />
        

        <button onClick={fetchProperties}>Apply Filters</button>
      </div>

      {/* PROPERTY GRID */}
      <div className="property-grid">
        {properties.map((property) => (
          <div className="property-card" key={property.id}>
            <div style={{ position: "relative" }}>
              <img src={property.main_image} alt="property" />
              <span
              onClick={(e) => toggleWishlist(e, property.id)}
              style={{ position: "absolute", top: "8px", right: "8px", fontSize: "22px", cursor: "pointer" }}>
              {wishlist.includes(property.id) ? "❤️" : "🤍"}
              </span>
            </div>

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

              <button onClick={() => handleCompare(property)}>
                Compare
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COMPARE BUTTON */}
      {compareList.length > 0 && (
        <div className="compare-bar">
          <Link
            to="/compare"
            state={{ properties: compareList }}
          >
            Compare ({compareList.length})
          </Link>
        </div>
      )}
      {wishlistMessage && (
  <div style={{ position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", background: "#1b5e20", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", zIndex: 1000 }}>
    {wishlistMessage}
    </div>
      )}
    </div>
  );
}