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
  const { location, type, minPrice, maxPrice } = req.query;

  let query = "SELECT * FROM properties WHERE 1=1";
  let values = [];

  if (location) {
    query += " AND address LIKE ?";
    values.push(`%${location}%`);
  }

  if (type) {
    query += " AND type = ?";
    values.push(type.toLowerCase()); // match ENUM in DB
  }
  if (minPrice) {
    query += " AND price >= ?";
    values.push(minPrice);
  }

  if (maxPrice) {
    query += " AND price <= ?";
    values.push(maxPrice);
  }

  try {
    const [results] = await db.query(query, values);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET SINGLE PROPERTY
app.get("/api/properties/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM properties WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Property not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// MAKE PAYMENT / BOOK PROPERTY
app.post("/api/payments", authenticate, async (req, res) => {
  const { property_id, check_in, check_out, guests, amount } = req.body;
  const user_id = req.user.id;
  try {
    await db.query(
      "INSERT INTO payments (user_id, property_id, check_in, check_out, guests, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'completed')",
      [user_id, property_id, check_in, check_out, guests, amount]
    );
    res.json({ message: "Booking successful" });
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

// GET FURNITURE RECOMMENDATIONS FOR A PROPERTY
app.get("/api/furniture/:id", async (req, res) => {
  try {
    const propertyId = req.params.id;

    const rooms = [
      { name: "Living Room", width: 12, depth: 15 },
      { name: "Bedroom", width: 10, depth: 12 },
      { name: "Dining Room", width: 8, depth: 8 }
    ];

    const furnitureItems = [
      {
        id: 1,
        name: "Compact Sofa",
        price: 499,
        image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        room: "Living Room",
        width: 6,
        depth: 3
      },
      {
        id: 2,
        name: "Queen Bed",
        price: 699,
        image_url: "https://images.unsplash.com/photo-1505693314120-0d443867891c",
        room: "Bedroom",
        width: 5,
        depth: 7
      },
      {
        id: 3,
        name: "Dining Table",
        price: 299,
        image_url: "https://plus.unsplash.com/premium_photo-1684445034959-b3faeb4597d2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZGluaW5nJTIwdGFibGV8ZW58MHx8MHx8fDA%3D",
        room: "Dining Room",
        width: 9,
        depth: 5
      }
    ];

    const furnitureRecommendations = furnitureItems.map((item) => {
      const room = rooms.find((r) => r.name === item.room);

      if (!room) {
        return {
          ...item,
          fits: false,
          clearance_space: null,
          reason: "No matching room found"
        };
      }

      const fits = item.width <= room.width && item.depth <= room.depth;

      return {
        ...item,
        fits,
        clearance_space: fits ? (room.width - item.width) * (room.depth - item.depth) : null,
        reason: fits ? "Fits in the room" : "Too large for the room"
      };
    });

    res.json(furnitureRecommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
app.post("/api/messages", authenticate, async (req, res) => {
  const { receiver_id, property_id, message } = req.body;

  // Validate inputs
  if (!receiver_id || !property_id) {
    return res.status(400).json({ message: "Missing receiver or property" });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message required" });
  }

  if (message.length > 1000) {
    return res.status(400).json({ message: "Message too long" });
  }

  try {
    // Check receiver exists
    const [user] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [receiver_id]
    );
    if (!user.length) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Check property exists
    const [property] = await db.query(
      "SELECT id FROM properties WHERE id = ?",
      [property_id]
    );
    if (!property.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    await db.query(
      "INSERT INTO messages (sender_id, receiver_id, property_id, message) VALUES (?, ?, ?, ?)",
      [req.user.id, receiver_id, property_id, message.trim()]
    );

    res.json({ message: "Message sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
// ------------------- START SERVER -------------------
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
