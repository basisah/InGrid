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
  const [showPostForm, setShowPostForm] = useState(false);
  const [postingFurniture, setPostingFurniture] = useState(false);
  const [furnitureForm, setFurnitureForm] = useState({
    name: "",
    category: "Living Room",
    price: "",
    color_theme: "",
    sizeCategory: "medium",
    images: []
  });
  const navigate = useNavigate();
  const [furnitureWishlist, setFurnitureWishlist] = useState([]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;
  axios.get("/api/furniture-wishlist", { headers: { Authorization: `Bearer ${token}` } })
    .then(r => setFurnitureWishlist(r.data))
    .catch(() => {});
}, []);

const toggleFurnitureWishlist = async (e, furnitureId) => {
  e.stopPropagation();
  const token = localStorage.getItem("token");
  if (!token) { toast.error("Please log in first."); return; }
  if (furnitureWishlist.includes(furnitureId)) {
    await axios.delete(`/api/furniture-wishlist/${furnitureId}`, { headers: { Authorization: `Bearer ${token}` } });
    setFurnitureWishlist(furnitureWishlist.filter(id => id !== furnitureId));
    toast.success("Removed from wishlist");
  } else {
    await axios.post(`/api/furniture-wishlist/${furnitureId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setFurnitureWishlist([...furnitureWishlist, furnitureId]);
    toast.success("Added to wishlist ❤️");
  }
};

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

  const handleFurnitureFormChange = (e) => {
    const { name, value } = e.target;
    setFurnitureForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostFurnitureClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in first.");
      navigate("/login");
      return;
    }

    setShowPostForm((prev) => !prev);
  };

  const handleFurnitureImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    try {
      const imagePromises = files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );

      const uploadedImages = await Promise.all(imagePromises);

      setFurnitureForm((prev) => ({
        ...prev,
        images: uploadedImages
      }));
    } catch (error) {
      console.error("Furniture image upload error:", error);
      toast.error("Failed to read selected image files.");
    }
  };

  const handleFurniturePost = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in first.");
      navigate("/login");
      return;
    }

    if (
      !furnitureForm.name.trim() ||
      !furnitureForm.category.trim() ||
      !String(furnitureForm.price).trim()
    ) {
      toast.error("Name, room type, and price are required.");
      return;
    }

    try {
      setPostingFurniture(true);

      await axios.post("/api/furniture", furnitureForm, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Furniture posted successfully.");

      setFurnitureForm({
        name: "",
        category: "Living Room",
        price: "",
        color_theme: "",
        sizeCategory: "medium",
        images: []
      });

      setShowPostForm(false);
      fetchFurniture();
    } catch (error) {
      console.error("Error posting furniture:", error);
      toast.error(
        error?.response?.data?.message || "Failed to post furniture."
      );
    } finally {
      setPostingFurniture(false);
    }
  };

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

          <button
            type="button"
            className="post-furniture-toggle-btn"
            onClick={handlePostFurnitureClick}
          >
            {showPostForm ? "Close Furniture Form" : "Post Furniture"}
          </button>
        </div>

        {showPostForm && (
          <form className="post-furniture-form" onSubmit={handleFurniturePost}>
            <h2>Post Furniture</h2>

            <div className="post-furniture-grid">
              <input
                type="text"
                name="name"
                placeholder="Furniture name"
                value={furnitureForm.name}
                onChange={handleFurnitureFormChange}
              />

              <select
                name="category"
                value={furnitureForm.category}
                onChange={handleFurnitureFormChange}
              >
                <option value="Living Room">Living Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Office">Office</option>
                <option value="Storage">Storage</option>
              </select>

              <input
                type="number"
                name="price"
                placeholder="Price"
                value={furnitureForm.price}
                onChange={handleFurnitureFormChange}
                min="0"
                step="0.01"
              />

              <input
                type="text"
                name="color_theme"
                placeholder="Color"
                value={furnitureForm.color_theme}
                onChange={handleFurnitureFormChange}
              />

              <select
                name="sizeCategory"
                value={furnitureForm.sizeCategory}
                onChange={handleFurnitureFormChange}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFurnitureImageUpload}
              />
            </div>

            {furnitureForm.images.length > 0 && (
              <p>
                {furnitureForm.images.length} image
                {furnitureForm.images.length !== 1 ? "s" : ""} selected
              </p>
            )}


            <button type="submit" disabled={postingFurniture}>
              {postingFurniture ? "Posting..." : "Submit Furniture"}
            </button>
          </form>
        )}


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