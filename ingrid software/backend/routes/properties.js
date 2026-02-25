const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

/* ===========================
   CREATE PROPERTY (Seller Only)
=========================== */
router.post("/", authenticate, authorize("seller", "agent", "admin"), async (req, res) => {
  const {
    title, description, type, price,
    bedrooms, bathrooms, size,
    address, latitude, longitude
  } = req.body;

  const [result] = await db.query(
    `INSERT INTO properties 
    (title, description, type, price, bedrooms, bathrooms, size,
     address, latitude, longitude, seller_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, description, type, price,
      bedrooms, bathrooms, size,
      address, latitude, longitude,
      req.user.id
    ]
  );

  res.json({ propertyId: result.insertId });
});

/* ===========================
   GET ALL PROPERTIES (Search)
=========================== */
router.get("/", async (req, res) => {
  const { type, minPrice, maxPrice, bedrooms } = req.query;

  let query = "SELECT * FROM properties WHERE 1=1";
  let params = [];

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  if (minPrice) {
    query += " AND price >= ?";
    params.push(minPrice);
  }

  if (maxPrice) {
    query += " AND price <= ?";
    params.push(maxPrice);
  }

  if (bedrooms) {
    query += " AND bedrooms >= ?";
    params.push(bedrooms);
  }

  const [rows] = await db.query(query, params);
  res.json(rows);
});

/* ===========================
   GET SINGLE PROPERTY
=========================== */
router.get("/:id", async (req, res) => {
  const [property] = await db.query(
    "SELECT * FROM properties WHERE id = ?",
    [req.params.id]
  );

  if (!property.length) {
    return res.status(404).json({ message: "Not found" });
  }

  const [images] = await db.query(
    "SELECT image_url FROM property_images WHERE property_id = ?",
    [req.params.id]
  );

  res.json({
    ...property[0],
    images
  });
});

module.exports = router;