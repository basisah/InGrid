import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./furniturestore.css";

export default function FurnitureStore() {
  const [furniture, setFurniture] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFurniture = async () => {
    try {
      const response = await axios.get("/api/furniture");
      setFurniture(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching furniture:", error);
      toast.error("Failed to load furniture.");
      setFurniture([]);
    } finally {
      setLoading(false);
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

  const handleCheckout = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in first.");
      navigate("/login");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Select at least one furniture item.");
      return;
    }

    navigate("/payment", {
      state: {
        furnitureItems: selectedItems,
        furnitureTotal: totalPrice
      }
    });
  };

  useEffect(() => {
    fetchFurniture();
  }, []);

  return (
    <>
      <Navbar />

      <div className="furniture-page">
        <div className="furniture-header">
          <h1>Furniture Store</h1>
          <p>
            Explore home furniture ideas and save items you may want to include
            in your housing plans.
          </p>
        </div>

        {loading ? (
          <p className="furniture-empty">Loading furniture...</p>
        ) : furniture.length === 0 ? (
          <p className="furniture-empty">No furniture available right now.</p>
        ) : (
          <div className="furniture-grid-page">
            {furniture.map((item) => {
              const selected = selectedItems.find((i) => i.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={`furniture-shop-card ${selected ? "selected" : ""}`}
                >
                  <img src={item.image_url} alt={item.name} />

                  <div className="furniture-shop-body">
                    <h3>{item.name}</h3>
                    <p><strong>Category:</strong> {item.category}</p>
                    <p><strong>Color:</strong> {item.color_theme}</p>
                    <p className="furniture-shop-price">${Number(item.price).toFixed(2)}</p>

                    {selected && (
                      <span className="furniture-added-badge">Added</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="furniture-cart-box">
          <p>
            <strong>{selectedItems.length}</strong> item
            {selectedItems.length !== 1 ? "s" : ""} selected
          </p>
          <p>
            <strong>Total:</strong> ${totalPrice.toFixed(2)}
          </p>

          <button onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}