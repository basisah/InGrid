import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./listing.css";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [furniture, setFurniture] = useState([]);

  const fetchProperty = async () => {
    const response = await axios.get(`/api/properties/${id}`);
    setProperty(response.data);
  };

  const fetchFurniture = async () => {
    const response = await axios.get(`/api/furniture/${id}`);
    setFurniture(response.data);
  };

  useEffect(() => {
    fetchFurniture();
    fetchProperty();
  }, [id]);

  if (!property) return <div>Loading...</div>;

  return (
    <div className="property-detail">
      {/* IMAGE GALLERY */}
      <div className="gallery">
        {property.images?.map((img) => (
          <img key={img.id} src={img.image_url} alt="property" />
        ))}
      </div>

      {/* PROPERTY INFO */}
      <div className="property-info">
        <h1>{property.title}</h1>
        <p className="price">${property.price}</p>
        <p>{property.description}</p>

        <div className="specs">
          <span>{property.bedrooms} Beds</span>
          <span>{property.bathrooms} Baths</span>
          <span>{property.size} sqft</span>
        </div>
      </div>

      {/* SELLER INFO */}
      <div className="seller-card">
        <h3>Contact Agent</h3>
        <p>{property.seller?.name}</p>
        <p>{property.seller?.email}</p>
        <button>Message Agent</button>
      </div>

      {/* MAP */}
      <div className="map-section">
        <iframe
          title="map"
          src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
        ></iframe>
      </div>

      {/* FURNITURE RECOMMENDATION */}
      <div className="furniture-section">
        <h2>Recommended Furniture</h2>
        <div className="furniture-grid">
          {furniture.map((item) => (
            <div key={item.id} className="furniture-card">
              <img src={item.image_url} alt="furniture" />
              <p>{item.name}</p>
              <p>${item.price}</p>
              <p>{item.room}</p>
              <p>{item.fits ? "Fits in room" : "Does not fit"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}