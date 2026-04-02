import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";

export default function FurnitureStore() {
  const [furniture, setFurniture] = useState([]);

  const fetchFurniture = async () => {
    try {
      const response = await axios.get("/api/furniture");
      setFurniture(response.data);
    } catch (error) {
      console.error("Error fetching furniture:", error);
    }
  };

  useEffect(() => {
    fetchFurniture();
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ padding: "40px" }}>
        <h1 style={{ marginBottom: "24px" }}>Furniture Store</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px"
          }}
        >
          {furniture.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}
            >
              <img
                src={item.image_url}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "12px"
                }}
              />
              <h3>{item.name}</h3>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Color:</strong> {item.color_theme}</p>
              <p><strong>Price:</strong> ${item.price}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}