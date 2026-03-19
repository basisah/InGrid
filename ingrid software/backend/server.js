'use strict';

const express = require('express');
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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

// --- MySQL Pool ---
const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "postsdb"
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
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
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
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
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
      "SELECT l.* FROM saved_listings s JOIN listings l ON s.listing_id = l.id WHERE s.user_id = ?",
      [userId]
    );

    const [history] = await db.query(
      "SELECT l.* FROM view_history h JOIN listings l ON h.listing_id = l.id WHERE h.user_id = ?",
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

//
  try {
    const [results] = await db.query(query, values);
    res.json(results);
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
        image_url: "https://via.placeholder.com/200?text=Compact+Sofa",
        room: "Living Room",
        width: 6,
        depth: 3
      },
      {
        id: 2,
        name: "Queen Bed",
        price: 699,
        image_url: "https://via.placeholder.com/200?text=Queen+Bed",
        room: "Bedroom",
        width: 5,
        depth: 7
      },
      {
        id: 3,
        name: "Dining Table",
        price: 299,
        image_url: "https://via.placeholder.com/200?text=Dining+Table",
        room: "Dining Room",
        width: 9,
        depth: 5
      }
    ];

    const furnitureRecommendations = furnitureItems.map((item) => {
      const room = rooms.find((r) => r.name === item.room);
      const fits = room && item.width <= room.width && item.depth <= room.depth;

      return {
        ...item,
        fits,
        clearance_space: room ? (room.width - item.width) * (room.depth - item.depth) : null
      };
    });

    res.json(furnitureRecommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- START SERVER -------------------
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
