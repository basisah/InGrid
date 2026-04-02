'use strict';

const express = require('express');
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 80;
const HOST = '0.0.0.0';

// --- Secrets from environment variables ---
const EMAIL_SECRET = process.env.EMAIL_SECRET;
const LOGIN_SECRET = process.env.LOGIN_SECRET;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // optional frontend
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
// --- MySQL Pool ---
const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "ingriddb",
});

// ------------------- ROUTES -------------------

// SIGNUP
app.post("/api/signup", async (req, res) => {
  const { firstName, middleName, lastName, dateOfBirth, homeAddress, phoneNumber, email, password } = req.body;

  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users 
      (first_name, middle_name, last_name, date_of_birth, home_address, phone_number, email, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, middleName, lastName, dateOfBirth, homeAddress, phoneNumber, email, hashedPassword]
    );

    const token = jwt.sign({ email }, EMAIL_SECRET, { expiresIn: "1d" });
    const verificationLink = `${FRONTEND_URL}/verify/${token}`;

    // Send verification email
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
    });
    await transporter.sendMail({
      from: `Ingrid <${GMAIL_USER}>`,
      to: email,
      subject: "Verify Your Ingrid Account",
      html: `<h2>Welcome to Ingrid</h2>
             <p>Click the link below to verify your account:</p>
             <a href="${verificationLink}">${verificationLink}</a>`
    });

    res.json({ message: "Signup successful. Check your email to verify your account." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// EMAIL VERIFICATION
app.get("/api/verify/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, EMAIL_SECRET);
    await db.query("UPDATE users SET is_verified = true WHERE email = ?", [decoded.email]);
    res.send("Email verified successfully. You can now login.");
  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Invalid email or password" });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.is_verified) return res.status(403).json({ message: "Please verify your email first" });

    const loginToken = jwt.sign({ id: user.id, role: user.role }, LOGIN_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token: loginToken });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// FORGOT PASSWORD
app.post("/api/forgot", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(404).json({ message: "Email not found" });

    const userId = rows[0].id;
    const token = jwt.sign({ email }, EMAIL_SECRET, { expiresIn: "30m" });

    await db.query("INSERT INTO password_resets (user_id, token) VALUES (?, ?)", [userId, token]);
    const resetLink = `${FRONTEND_URL}/reset/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `Ingrid <${GMAIL_USER}>`,
      to: email,
      subject: "Reset Your Ingrid Password",
      html: `<p>Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ message: "Password reset link sent to your email." });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
app.post("/api/reset/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, EMAIL_SECRET);
    const [rows] = await db.query(
      "SELECT * FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.token = ?",
      [token]
    );

    if (!rows.length) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password=? WHERE id=?", [hashedPassword, rows[0].id]);
    await db.query("DELETE FROM password_resets WHERE token=?", [token]);

    res.json({ message: "Password reset successfully." });

  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// PROTECTED ROUTE
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  jwt.verify(token, LOGIN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

//profile route
app.get("/api/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    const [saved] = await db.query(
      "SELECT l.* FROM saved_listings s JOIN properties l ON s.property_id = l.id WHERE s.user_id = ?",
      [userId]
    );

    const [history] = await db.query(
      "SELECT l.* FROM view_history h JOIN properties l ON h.property_id = l.id WHERE h.user_id = ?",
      [userId]
    );

    res.json({
      user: user[0],
      savedListings: saved,
      history: history
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE PROFILE PICTURE
app.put("/api/profile/picture", authenticate, async (req, res) => {
  const { profile_picture } = req.body;
  try {
    await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profile_picture, req.user.id]
    );
    res.json({ message: "Profile picture updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET VERIFICATION STATUS
app.get("/api/verify-status/:userId", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM account_verification WHERE user_id = ?",
      [req.params.userId]
    );
    if (!rows.length) return res.json({ status: "pending" });
    res.json({ status: rows[0].status, verified_at: rows[0].verified_at });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE VERIFICATION STATUS (admin only)
app.post("/api/verify-user/:userId", authenticate, async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT * FROM account_verification WHERE user_id = ?",
      [req.params.userId]
    );
    if (existing.length) {
      await db.query(
        "UPDATE account_verification SET status = 'verified', verified_at = NOW() WHERE user_id = ?",
        [req.params.userId]
      );
    } else {
      await db.query(
        "INSERT INTO account_verification (user_id, status, verified_at) VALUES (?, 'verified', NOW())",
        [req.params.userId]
      );
    }
    res.json({ message: "User verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL LISTINGS (Homepage Search) - made some edits to this route to support search filters, will need to update frontend to match
app.get("/api/properties", async (req, res) => {
  const { keyword, location, type, minPrice, maxPrice } = req.query;

  let query = "SELECT * FROM properties WHERE is_verified = true";
  const values = [];

  if (keyword) {
    query += " AND (title LIKE ? OR description LIKE ? OR address LIKE ?)";
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (location) {
    query += " AND address LIKE ?";
    values.push(`%${location}%`);
  }

  if (type) {
    query += " AND type = ?";
    values.push(type.toLowerCase());
  }

  if (minPrice) {
    query += " AND price >= ?";
    values.push(Number(minPrice));
  }

  if (maxPrice) {
    query += " AND price <= ?";
    values.push(Number(maxPrice));
  }

  query += " ORDER BY id DESC";

  try {
    const [results] = await db.query(query, values);
    res.json(results);
  } catch (err) {
    console.error("Property search error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET SINGLE PROPERTY
app.get("/api/properties/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.*,
         COALESCE(p.landlord_id, 1) AS landlord_id,
         u.id AS seller_id,
         u.first_name,
         u.last_name,
         u.email
       FROM properties p
       LEFT JOIN users u
         ON u.id = COALESCE(p.landlord_id, 1)
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const [images] = await db.query(
      "SELECT * FROM property_images WHERE property_id = ?",
      [req.params.id]
    );

    const property = rows[0];

    res.json({
      ...property,
      seller: {
        id: property.seller_id || 1,
        name: `${property.first_name || "Demo"} ${property.last_name || "Agent"}`,
        email: property.email || "admin@ingrid.com"
      },
      images
    });
  } catch (err) {
    console.error("GET /api/properties/:id error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// MAKE PAYMENT / BOOK PROPERTY
app.post("/api/payments", authenticate, async (req, res) => {
  const { property_id, check_in, check_out, guests, amount } = req.body;
  const user_id = req.user.id;
  try {
    const [result] = await db.query(
      "INSERT INTO payments (user_id, property_id, check_in, check_out, guests, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'completed')",
      [user_id, property_id, check_in, check_out, guests, amount]
    );
    res.json({ message: "Booking successful", paymentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// GET USER PAYMENTS
app.get("/api/payments", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT p.*, pr.title, pr.address FROM payments p JOIN properties pr ON p.property_id = pr.id WHERE p.user_id = ?",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET WISHLIST
app.get("/api/wishlist", authenticate, async (req, res) => {
  const [rows] = await db.query(
    "SELECT property_id FROM saved_listings WHERE user_id = ?",
    [req.user.id]
  );
  res.json(rows.map(r => r.property_id));
});

// ADD TO WISHLIST
app.post("/api/wishlist/:propertyId", authenticate, async (req, res) => {
  await db.query(
    "INSERT IGNORE INTO saved_listings (user_id, property_id) VALUES (?, ?)",
    [req.user.id, req.params.propertyId]
  );
  res.json({ message: "Added to wishlist" });
});

// REMOVE FROM WISHLIST
app.delete("/api/wishlist/:propertyId", authenticate, async (req, res) => {
  await db.query(
    "DELETE FROM saved_listings WHERE user_id = ? AND property_id = ?",
    [req.user.id, req.params.propertyId]
  );
  res.json({ message: "Removed from wishlist" });
});


app.get("/api/furniture", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM furniture");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch furniture" });
  }
});
// GET FURNITURE RECOMMENDATIONS FOR A PROPERTY
app.get("/api/furniture/:id", async (req, res) => {
  try {
    const propertyId = req.params.id;

    const [propertyRows] = await db.query(
      "SELECT id, type FROM properties WHERE id = ?",
      [propertyId]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const [rows] = await db.query(
      `SELECT id, name, category, price, image_url, color_theme, width, depth
       FROM furniture`
    );

    const rooms = {
      "Living Room": { width: 12, depth: 15 },
      "Bedroom": { width: 10, depth: 12 },
      "Dining Room": { width: 8, depth: 8 },
      "Office": { width: 8, depth: 10 },
      "Storage": { width: 6, depth: 8 }
    };

    const furnitureWithFitInfo = rows.map((item) => {
      const room = rooms[item.category];

      if (!room) {
        return {
          ...item,
          room: item.category,
          fits: false,
          clearance_space: null,
          reason: "No matching room found for this furniture category"
        };
      }

      const fits =
        Number(item.width) <= room.width && Number(item.depth) <= room.depth;

      return {
        ...item,
        room: item.category,
        fits,
        clearance_space: fits
          ? (room.width - Number(item.width)) * (room.depth - Number(item.depth))
          : null,
        reason: fits ? "Fits in the room" : "Too large for the room"
      };
    });

    res.json(furnitureWithFitInfo);
  } catch (err) {
    console.error("Error fetching furniture:", err);
    res.status(500).json({ error: "Failed to fetch furniture" });
  }
});
// GET ALL USERS (ADMIN)
app.get("/api/admin/users", authenticate, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const [users] = await db.query(
      "SELECT id, first_name, last_name, email, role FROM users"
    );

    res.json(users);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

});

// POST PROPERTY (Landlord posts property)
app.post("/api/properties", authenticate, async (req, res) => {
  try {
    const {
      title,
      address,
      // city,
      // province,
      type,
      price,
      bedrooms,
      bathrooms,
      size,
      description,
      main_image
    } = req.body;

    const landlordId = req.user.id;

    await db.query(
      `INSERT INTO properties 
      (title, address, type, price, bedrooms, bathrooms, size, description, main_image, landlord_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        address,
        // city,
        // province,
        type,
        price,
        bedrooms,
        bathrooms,
        size,
        description,
        main_image,
        landlordId
      ]
    );

    res.json({ message: "Property posted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to post property" });
  }
});
// GET RECOMMENDATIONS BASED ON VIEW HISTORY
app.get("/api/recommendations", authenticate, async (req, res) => {
  const userId = req.user.id;

  // get user's viewed properties
  const [history] = await db.query(
    "SELECT * FROM view_history h JOIN properties p ON h.property_id = p.id WHERE h.user_id = ?",
    [userId]
  );

  if (history.length === 0) {
    return res.json([]);
  }

  const preferredType = history[0].type;

  const [recommendations] = await db.query(
    "SELECT * FROM properties WHERE type = ? LIMIT 5",
    [preferredType]
  );

  res.json(recommendations);
});
// SEND MESSAGE TO LANDLORD`
app.post("/api/messages", async (req, res) => {
  const { receiver_id, property_id, message } = req.body;

  

  try {
    await db.query(
      "INSERT INTO messages (sender_id, receiver_id, property_id, message) VALUES (?, ?, ?, ?)",
      [
        1,
        receiver_id || 1,
        property_id || 1,
        message || "test message"
      ]
    );

    res.json({ message: "Message stored successfully" });
  } catch (err) {
    console.error("INSERT ERROR:", err);
    res.status(500).json({ message: "DB insert failed" });
  }
});
// GET UNVERIFIED PROPERTIES (ADMIN)
app.get("/api/admin/properties", authenticate, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  const [rows] = await db.query(
    "SELECT * FROM properties WHERE is_verified = false"
  );

  res.json(rows);
});

// VERIFY PROPERTY (ADMIN)
app.post("/api/admin/approve/:id", authenticate, async (req, res) => {

  if(req.user.role !== "admin"){
    return res.sendStatus(403);
   }

  await db.query(
    "UPDATE properties SET is_verified = true WHERE id = ?",
    [req.params.id]
  );
});
// GET PROPERTY DETAILS
app.get("/api/properties/:id", async (req, res) => {
  try {
    const [property] = await db.query(
      "SELECT * FROM properties WHERE id=?",
      [req.params.id]
    );

    if (!property.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const [images] = await db.query(
      "SELECT * FROM property_images WHERE property_id=?",
      [req.params.id]
    );

    res.json({
      ...property[0],
      images
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/messages/:propertyId/:receiverId", async (req, res) => {
  const { propertyId, receiverId } = req.params;
  const currentUserId = 1;

  try {
    const [rows] = await db.query(
      `SELECT 
         m.id,
         m.sender_id,
         m.receiver_id,
         m.property_id,
         m.message,
         m.created_at,
         u.first_name AS sender_first_name,
         u.last_name AS sender_last_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.property_id = ?
         AND (
           (m.sender_id = ? AND m.receiver_id = ?)
           OR
           (m.sender_id = ? AND m.receiver_id = ?)
         )
       ORDER BY m.id ASC`,
      [propertyId, currentUserId, receiverId, receiverId, currentUserId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    res.status(500).json({ message: err.sqlMessage || "Failed to load messages" });
  }
});

// SAVE LISTING
app.post("/api/save/:id", authenticate, async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;

  try {
    await db.query(
      "INSERT IGNORE INTO saved_listings (user_id, property_id) VALUES (?, ?)",
      [userId, propertyId]
    );

    res.json({ message: "Saved!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving listing" });
  }
});

// REMOVE SAVED
app.delete("/api/save/:id", authenticate, async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;

  try {
    await db.query(
      "DELETE FROM saved_listings WHERE user_id=? AND property_id=?",
      [userId, propertyId]
    );

    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ message: "Error removing listing" });
  }
});
// GET PENDING USERS (ADMIN)
app.get("/api/admin/pending-users", authenticate, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  try {
    const [rows] = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.role
      FROM users u
      JOIN account_verification av ON u.id = av.user_id
      WHERE av.status = 'pending'
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// REJECT PROPERTY (ADMIN)
app.post("/api/admin/reject/:id", authenticate, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  try {
    await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    res.json({ message: "Property rejected and removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

//REVIEW SESSION
const reviewController = require("./controller/reviewController");

// REVIEWS
app.post("/api/reviews", authenticate, reviewController.createReview);
app.get("/api/reviews/property/:id", reviewController.getPropertyReviews);
app.get("/api/reviews/landlord/:id", reviewController.getLandlordReviews);
app.get("/api/reviews/area/:name", reviewController.getAreaReviews);


// ------------------- START SERVER -------------------
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
