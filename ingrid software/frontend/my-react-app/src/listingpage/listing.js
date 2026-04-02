import React, { useEffect, useState } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
=======
import { useLocation, useNavigate, Link } from "react-router-dom";
>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)
import axios from "axios";
import "./listing.css";
export default function Listings() {
  const [properties, setProperties] = useState([]);
<<<<<<< HEAD
=======
  const [compareList, setCompareList] = useState([]);
  const [saved, setSaved] = useState([]);
  const locationHook = useLocation();
  const navigate = useNavigate();

>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)
  const [filters, setFilters] = useState({
    location: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });
<<<<<<< HEAD
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
=======

  const fetchProperties = async (customFilters) => {
    try {
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
    }
>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)
  };
  
  useEffect(() => {
    fetchProperties();
  }, []);

<<<<<<< HEAD
  const handleCompare = (property) => {
  if (compareList.length >= 3) {
    alert("You can only compare up to 3 properties.");
    return;
  }
=======
    const newFilters = {
      location: params.get("location") || "",
      type: params.get("type") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
    };

    setFilters(newFilters);
    fetchProperties(newFilters);
  }, [locationHook.search]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (filters.location) params.set("location", filters.location);
    if (filters.type) params.set("type", filters.type);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    navigate(`/listings?${params.toString()}`);
  };

  const handleSave = async (property) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const isSaved = saved.find((p) => p.id === property.id);

    try {
      if (isSaved) {
        await fetch(`/api/save/${property.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        setSaved(saved.filter((p) => p.id !== property.id));
      } else {
        await fetch(`/api/save/${property.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        setSaved([...saved, property]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = (property) => {
    if (compareList.length >= 3) {
      alert("Max 3 properties");
      return;
    }

    if (compareList.find((p) => p.id === property.id)) return;
>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)

  if (compareList.find(p => p.id === property.id)) return;

  setCompareList(prev => [...prev, property]);
  };

  return (
    <div className="listings-page">

<<<<<<< HEAD
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
=======
      <div className="listings-page">
        <div className="filter-bar">
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
          />

          <select
            value={filters.type}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value })
            }
          >
            <option value="">All</option>
            <option value="rental">Rental</option>
            <option value="short-term">Short-Term</option>
            <option value="buy">Buy</option>
          </select>

          <input
            placeholder="Min Price"
            type="number"
            value={filters.minPrice}
            onChange={(e) =>
>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)
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
        

<<<<<<< HEAD
        <button onClick={fetchProperties}>Apply Filters</button>
=======
          <input
            placeholder="Max Price"
            type="number"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
          />

          <button className="filter-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="property-grid">
          {properties.length === 0 ? (
            <p>No properties found.</p>
          ) : (
            properties.map((property) => {
              const isSaved = saved.find((p) => p.id === property.id);

              return (
                <div className="home-property-card" key={property.id}>
                  <div className="card-image">
                    <img src={property.main_image} alt="property" />

                    <button
                      className={`save-icon-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => handleSave(property)}
                    >
                      {isSaved ? "❤️" : "🤍"}
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
                        <button className="view-btn">View</button>
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
              );
            })
          )}
        </div>

        {compareList.length > 0 && (
          <div className="compare-bar">
            <Link to="/compare" state={{ properties: compareList }}>
              Compare ({compareList.length})
            </Link>
          </div>
        )}
>>>>>>> 05e6657 (nelson- ui/ux and debugging of review module)
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