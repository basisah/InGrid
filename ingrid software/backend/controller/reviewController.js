const db = require("../config/db");

// CREATE REVIEW
exports.createReview = async (req, res) => {
  try {
    const reviewer_user_id = req.user.id;

    const {
      booking_id,
      property_id,
      reviewee_user_id,
      rating,
      description,
      review_type,
      area_name
    } = req.body;

    if (!booking_id || !property_id || !review_type || !rating) {
      return res.status(400).json({
        error: "booking_id, property_id, review_type, and rating are required"
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: "Rating must be 1–5" });
    }

    if (reviewer_user_id === reviewee_user_id) {
      return res.status(400).json({ error: "Cannot review yourself" });
    }

    if (!["PROPERTY", "LANDLORD", "AREA"].includes(review_type)) {
      return res.status(400).json({ error: "Invalid review_type" });
    }

    if (review_type === "LANDLORD" && !reviewee_user_id) {
      return res
        .status(400)
        .json({ error: "reviewee_user_id is required for landlord reviews" });
    }

    if (review_type === "AREA" && !area_name) {
      return res.status(400).json({ error: "area_name is required for area reviews" });
    }

    const [existing] = await db.query(
      `SELECT id
       FROM reviews
       WHERE booking_id = ? AND reviewer_user_id = ? AND review_type = ?`,
      [booking_id, reviewer_user_id, review_type]
    );

    if (existing.length) {
      return res.status(409).json({
        error: "You already submitted this review type for this booking"
      });
    }

    const [bookingRows] = await db.query(
      `SELECT p.id, p.property_id, p.user_id, p.status, pr.landlord_id
       FROM payments p
       JOIN properties pr ON pr.id = p.property_id
       WHERE p.id = ?`,
      [booking_id]
    );

    if (!bookingRows.length) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRows[0];

    if (booking.property_id !== Number(property_id)) {
      return res.status(400).json({ error: "Booking does not match property" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Only completed bookings can be reviewed" });
    }

    if (booking.user_id !== reviewer_user_id) {
      return res.status(403).json({ error: "You are not allowed to review this booking" });
    }

    if (
      review_type === "LANDLORD" &&
      Number(reviewee_user_id) !== Number(booking.landlord_id)
    ) {
      return res.status(400).json({ error: "Invalid landlord for this booking" });
    }

    await db.query(
      `INSERT INTO reviews
      (booking_id, property_id, reviewer_user_id, review_type, reviewee_user_id, area_name, rating, description, is_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
      [
        booking_id,
        property_id,
        reviewer_user_id,
        review_type,
        reviewee_user_id || null,
        area_name || null,
        Number(rating),
        description || null,
        true
      ]
    );

    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    console.error("[createReview]", err.message, err.sqlMessage, err);
    res.status(500).json({ error: err.sqlMessage || err.message || "Server error" });
  }
};

// GET PROPERTY REVIEWS
exports.getPropertyReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT
         r.id,
         r.booking_id,
         r.property_id,
         r.reviewer_user_id,
         r.review_type,
         r.reviewee_user_id,
         r.area_name,
         r.rating,
         r.description,
         r.is_verified,
         r.status,
         r.created_at,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.property_id = ?
         AND r.review_type = 'PROPERTY'
         AND r.status = 'PUBLISHED'
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    const [aggregateRows] = await db.query(
      `SELECT avg_rating, total_reviews
       FROM property_ratings
       WHERE property_id = ?`,
      [req.params.id]
    );

    res.json({
      aggregate: aggregateRows[0] || { avg_rating: 0, total_reviews: 0 },
      reviews
    });
  } catch (err) {
      console.error("[getPropertyReviews]", err.message, err.sqlMessage, err);
      res.status(500).json({ error: err.sqlMessage || err.message || "Server error" });
    }
};

// GET LANDLORD REVIEWS
exports.getLandlordReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         r.id,
         r.booking_id,
         r.property_id,
         r.reviewer_user_id,
         r.review_type,
         r.reviewee_user_id,
         r.area_name,
         r.rating,
         r.description,
         r.is_verified,
         r.status,
         r.created_at,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.reviewee_user_id = ?
         AND r.review_type = 'LANDLORD'
         AND r.status = 'PUBLISHED'
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
      console.error("[getLandlordReviews]", err.message, err.sqlMessage, err);
      res.status(500).json({ error: err.sqlMessage || err.message || "Server error" });
    }
};

// GET AREA REVIEWS
exports.getAreaReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         r.id,
         r.booking_id,
         r.property_id,
         r.reviewer_user_id,
         r.review_type,
         r.reviewee_user_id,
         r.area_name,
         r.rating,
         r.description,
         r.is_verified,
         r.status,
         r.created_at,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.area_name = ?
         AND r.review_type = 'AREA'
         AND r.status = 'PUBLISHED'
       ORDER BY r.created_at DESC`,
      [req.params.name]
    );

    res.json(rows);
  } catch (err) {
      console.error("[getAreaReviews]", err.message, err.sqlMessage, err);
      res.status(500).json({ error: err.sqlMessage || err.message || "Server error" });
    }
};