import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import { useNavigate } from "react-router-dom";

export default function FurnitureStore() {
  const [furniture, setFurniture] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const fetchFurniture = async () => {
    try {
      const response = await axios.get("/api/furniture");
      setFurniture(response.data);
    } catch (error) {
      console.error("Error fetching furniture:", error);
    }
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find((i) => i.id === item.id);

    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );

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
              onClick={() => toggleItem(item)}
              style={{
                border: selectedItems.find((i) => i.id === item.id)
                  ? "2px solid green"
                  : "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer"
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

              {selectedItems.find((i) => i.id === item.id) && (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  Added to cart
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHECKOUT BOX */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "white",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
        }}
      >
        <p><strong>Total:</strong> ${totalPrice.toFixed(2)}</p>

        <button
          onClick={() => {
            if (selectedItems.length === 0) {
              alert("Select at least one furniture");
              return;
            }

            navigate("/payment", {
              state: {
                furnitureItems: selectedItems,
                furnitureTotal: totalPrice
              }
            });
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1b5e20",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Checkout
        </button>
      </div>

      <Footer />
    </>
  );
}