const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ADD TO FAVORITES
router.post("/:propertyId", authenticate, async (req, res) => {
  await db.query(
    "INSERT INTO favorites (user_id, property_id) VALUES (?, ?)",
    [req.user.id, req.params.propertyId]
  );

  res.json({ message: "Added to favorites" });
});

// GET USER FAVORITES
router.get("/", authenticate, async (req, res) => {
  const [favorites] = await db.query(
    `SELECT p.* FROM properties p
     JOIN favorites f ON p.id = f.property_id
     WHERE f.user_id = ?`,
    [req.user.id]
  );

  res.json(favorites);
});

module.exports = router;