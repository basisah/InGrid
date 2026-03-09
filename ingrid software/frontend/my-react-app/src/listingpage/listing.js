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
  

  const fetchProperties = async () => {
    const response = await axios.get("/api/properties", { params: filters });
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
    setCompareList([...compareList, property]);
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
    </div>
  );
}