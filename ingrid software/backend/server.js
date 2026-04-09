'use strict';

const express = require('express');
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});
const PORT = 80;
const HOST = '0.0.0.0';

// --- Secrets from environment variables ---
const EMAIL_SECRET = process.env.EMAIL_SECRET;
const LOGIN_SECRET = process.env.LOGIN_SECRET;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
// --- SOCKET.IO ---
const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join_user_room", (userId) => {
    if (!userId) return;
    const key = String(userId);
    onlineUsers.set(key, socket.id);
    socket.join(`user:${key}`);
    io.emit("users_online", Array.from(onlineUsers.keys()));
  });

  socket.on("join_conversation", ({ propertyId, userA, userB }) => {
    if (!propertyId || !userA || !userB) return;
    const sortedUsers = [Number(userA), Number(userB)].sort((a, b) => a - b);
    const roomName = `chat:${propertyId}:${sortedUsers[0]}:${sortedUsers[1]}`;
    socket.join(roomName);
  });

  socket.on("typing", ({ propertyId, senderId, receiverId, isTyping }) => {
    if (!propertyId || !senderId || !receiverId) return;
    const sortedUsers = [Number(senderId), Number(receiverId)].sort((a, b) => a - b);
    const roomName = `chat:${propertyId}:${sortedUsers[0]}:${sortedUsers[1]}`;

    socket.to(roomName).emit("typing", {
      propertyId: Number(propertyId),
      senderId: Number(senderId),
      receiverId: Number(receiverId),
      isTyping: Boolean(isTyping)
    });
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("users_online", Array.from(onlineUsers.keys()));
  });
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

  let query = `
    SELECT
      p.*,
      COALESCE(
        NULLIF(p.main_image, ''),
        (
          SELECT pi.image_url
          FROM property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.id ASC
          LIMIT 1
        )
      ) AS display_image
    FROM properties p
    WHERE p.is_verified = true
  `;
  const values = [];

  if (keyword) {
    query += " AND (p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)";
    values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (location) {
    query += " AND p.address LIKE ?";
    values.push(`%${location}%`);
  }

  if (type) {
    query += " AND p.type = ?";
    values.push(type.toLowerCase());
  }

  if (minPrice) {
    query += " AND p.price >= ?";
    values.push(Number(minPrice));
  }

  if (maxPrice) {
    query += " AND p.price <= ?";
    values.push(Number(maxPrice));
  }

  query += " ORDER BY p.id DESC";

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
         u.id AS seller_id,
         u.first_name,
         u.last_name,
         u.email,
         u.role
       FROM properties p
       LEFT JOIN users u ON u.id = p.landlord_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const [imageRows] = await db.query(
      "SELECT id, image_url FROM property_images WHERE property_id = ? ORDER BY id ASC",
      [req.params.id]
    );

    const [roomRows] = await db.query(
      "SELECT id, name, type, size_category AS sizeCategory FROM property_rooms WHERE property_id = ? ORDER BY id ASC",
      [req.params.id]
    );

    const property = rows[0];
    const gallery =
      imageRows.length > 0
        ? imageRows
        : property.main_image
          ? [{ id: "main", image_url: property.main_image }]
          : [];

    res.json({
      ...property,
      images: gallery,
      rooms: roomRows,
      seller: {
        id: property.seller_id,
        name: `${property.first_name || ""} ${property.last_name || ""}`.trim() || "Agent",
        email: property.email || "admin@ingrid.com"
      }
    });
  } catch (err) {
    console.error("GET /api/properties/:id error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// UPDATE PROPERTY (only landlord who posted or admin can edit)
app.put("/api/properties/:id", authenticate, async (req, res) => {
  try {
    const propertyId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const {
      title,
      address,
      type,
      price,
      bedrooms,
      bathrooms,
      size,
      description,
      main_image,
      images = [],
      rooms = [],
      latitude = null,
      longitude = null
    } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM properties WHERE id = ?",
      [propertyId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const property = rows[0];

    if (userRole !== "admin" && property.landlord_id !== userId) {
      return res.status(403).json({ message: "You can only edit your own listing." });
    }

    const safeMainImage =
      main_image && String(main_image).trim() !== ""
        ? main_image
        : (Array.isArray(images) && images.length > 0 ? images[0] : property.main_image);

    await db.query(
      `UPDATE properties
       SET title = ?, address = ?, type = ?, price = ?, bedrooms = ?, bathrooms = ?, size = ?,
           description = ?, main_image = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        title,
        address,
        type,
        Number(price),
        bedrooms || null,
        bathrooms || null,
        size || null,
        description || "",
        safeMainImage,
        latitude,
        longitude,
        propertyId
      ]
    );

    await db.query("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
    await db.query("DELETE FROM property_rooms WHERE property_id = ?", [propertyId]);

    if (Array.isArray(images) && images.length > 0) {
      const validImages = images.filter((img) => img && String(img).trim() !== "");
      if (validImages.length > 0) {
        const values = validImages.map((img) => [propertyId, img]);
        await db.query(
          "INSERT INTO property_images (property_id, image_url) VALUES ?",
          [values]
        );
      }
    }

    if (type === "buy" && Array.isArray(rooms) && rooms.length > 0) {
      const validRooms = rooms.filter(
        (room) =>
          room &&
          String(room.name || "").trim() !== "" &&
          String(room.type || "").trim() !== ""
      );

      if (validRooms.length > 0) {
        const roomValues = validRooms.map((room) => [
          propertyId,
          room.name,
          room.type,
          ["small", "medium", "large"].includes(room.sizeCategory)
            ? room.sizeCategory
            : "medium"
        ]);

        await db.query(
          "INSERT INTO property_rooms (property_id, name, type, size_category) VALUES ?",
          [roomValues]
        );
      }
    }

    res.json({ message: "Listing updated successfully." });
  } catch (err) {
    console.error("PUT /api/properties/:id error:", err);
    res.status(500).json({ message: "Failed to update listing." });
  }
});

// GET MY PROPERTIES (for landlords)
app.get("/api/my-properties", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.*,
        COALESCE(
          NULLIF(p.main_image, ''),
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.id ASC
            LIMIT 1
          )
        ) AS display_image
      FROM properties p
      WHERE p.landlord_id = ?
      ORDER BY p.created_at DESC, p.id DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/my-properties error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET MY FURNITURE
app.get("/api/my-furniture", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         name,
         category,
         price,
         image_url,
         size_category AS sizeCategory,
         is_user_posted AS isUserPosted,
         created_at AS createdAt
       FROM furniture
       WHERE seller_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/my-furniture error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// MAKE PAYMENT / BOOK PROPERTY
app.post("/api/payments", authenticate, async (req, res) => {
  const { property_id, check_in, check_out, guests, amount } = req.body;
  const user_id = req.user.id;

  try {
    if (!property_id || !check_in || !check_out || !amount) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    if (new Date(check_out) <= new Date(check_in)) {
      return res.status(400).json({ error: "Check-out must be after check-in" });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ error: "Guests must be at least 1" });
    }

    const [propertyRows] = await db.query(
      "SELECT id, is_verified, type FROM properties WHERE id = ?",
      [property_id]
    );

    if (!propertyRows.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    const property = propertyRows[0];

    if (!property.is_verified) {
      return res.status(400).json({ error: "Property is not available for booking" });
    }

    if (property.type !== "short-term") {
      return res.status(400).json({
        error: "Only short-term properties can be booked online. Contact the agent for rentals or purchase listings."
      });
    }

    const [result] = await db.query(
      `INSERT INTO payments
       (user_id, property_id, check_in, check_out, guests, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'completed')`,
      [user_id, property_id, check_in, check_out, guests || 1, amount]
    );

    res.json({
      message: "Booking successful",
      paymentId: result.insertId
    });
  } catch (err) {
    console.error("Payment route error:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

// GET USER PAYMENTS
app.get("/api/payments", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.*,
         pr.title,
         pr.address,
         pr.main_image
       FROM payments p
       JOIN properties pr ON p.property_id = pr.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/payments error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// SAVE PAYMENT METHOD
app.post("/api/payment-methods", authenticate, async (req, res) => {
  const { card_holder_name, last_four, expiry } = req.body;
  try {
    await db.query(
      "INSERT INTO saved_payment_methods (user_id, card_holder_name, last_four, expiry) VALUES (?, ?, ?, ?)",
      [req.user.id, card_holder_name, last_four, expiry]
    );
    res.json({ message: "Payment method saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET WISHLIST
app.get("/api/wishlist", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT property_id FROM saved_listings WHERE user_id = ?",
      [req.user.id]
    );

    res.json(rows.map((r) => r.property_id));
  } catch (err) {
    console.error("Wishlist fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
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

// GET ALL FURNITURE
app.get("/api/furniture", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         f.id,
         f.name,
         f.category,
         f.price,
         f.image_url,
         f.color_theme,
         f.width,
         f.depth,
         f.size_category AS sizeCategory,
         f.seller_id AS sellerId,
         f.is_user_posted AS isUserPosted,
         f.created_at AS createdAt
       FROM furniture f
       ORDER BY f.created_at DESC, f.id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/furniture error:", err);
    res.status(500).json({ error: "Failed to fetch furniture" });
  }
});

// GET FURNITURE RECOMMENDATIONS FOR A PROPERTY
app.get("/api/furniture/:id", async (req, res) => {
  try {
    const propertyId = req.params.id;

    const [propertyRows] = await db.query(
      "SELECT id FROM properties WHERE id = ?",
      [propertyId]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const [propertyRoomRows] = await db.query(
      `SELECT id, name, type, size_category AS sizeCategory
       FROM property_rooms
       WHERE property_id = ?
       ORDER BY id ASC`,
      [propertyId]
    );

    const [rows] = await db.query(
      `SELECT id, name, category, price, image_url, color_theme
       FROM furniture`
    );

    const normalize = (value) => String(value || "").trim().toLowerCase();

    const categoryKeywords = {
      "Living Room": ["living"],
      Bedroom: ["bed"],
      "Dining Room": ["dining"],
      Office: ["office", "study"],
      Storage: ["storage", "store"]
    };

    const sizeOrder = {
      small: 1,
      medium: 2,
      large: 3
    };

    const getRequiredSize = (item) => {
      const itemName = normalize(item.name);
      const itemCategory = normalize(item.category);

      if (itemName.includes("sofa") || itemName.includes("bed")) {
        return "medium";
      }

      if (itemCategory === "bedroom" && itemName.includes("bed")) {
        return "medium";
      }

      return "small";
    };

    const roomMatchesCategory = (room, category) => {
      const keywords = categoryKeywords[category] || [];
      const roomName = normalize(room.name);
      const roomType = normalize(room.type);

      return keywords.some(
        (keyword) => roomName.includes(keyword) || roomType.includes(keyword)
      );
    };

    const furnitureWithFitInfo = rows.map((item) => {
      const matchingRooms = propertyRoomRows.filter((room) =>
        roomMatchesCategory(room, item.category)
      );

      if (matchingRooms.length === 0) {
        return {
          ...item,
          room: null,
          fits: false,
          clearance_space: null,
          reason: `No ${item.category} found in this property`
        };
      }

      const requiredSize = getRequiredSize(item);

      const fitRoom = matchingRooms.find((room) => {
        const roomSize = normalize(room.sizeCategory) || "medium";
        return (sizeOrder[roomSize] || 0) >= (sizeOrder[requiredSize] || 0);
      });

      if (!fitRoom) {
        return {
          ...item,
          room: matchingRooms[0].name || item.category,
          fits: false,
          clearance_space: null,
          reason: `${item.name} needs a ${requiredSize} or large room`
        };
      }

      return {
        ...item,
        room: fitRoom.name || item.category,
        fits: true,
        clearance_space: null,
        reason: `Fits in ${fitRoom.name || item.category} (${fitRoom.sizeCategory})`
      };
    });

    res.json(furnitureWithFitInfo);
  } catch (err) {
    console.error("GET /api/furniture/:id error:", err);
    res.status(500).json({
      error: err.sqlMessage || "Failed to fetch furniture"
    });
  }
});

// POST FURNITURE
app.post("/api/furniture", authenticate, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      color_theme,
      sizeCategory,
      images = []
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        message: "Name, category, and price are required."
      });
    }

    const normalizedSizeCategory = ["small", "medium", "large"].includes(sizeCategory)
      ? sizeCategory
      : "medium";

    const validImages = Array.isArray(images)
      ? images.filter((img) => img && String(img).trim() !== "")
      : [];

    const mainImage = validImages.length > 0 ? validImages[0] : null;

    const [result] = await db.query(
      `INSERT INTO furniture
       (name, category, price, image_url, color_theme, width, depth, size_category, seller_id, is_user_posted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        String(name).trim(),
        String(category).trim(),
        Number(price),
        mainImage,
        color_theme ? String(color_theme).trim() : null,
        null,
        null,
        normalizedSizeCategory,
        req.user.id
      ]
    );

    const furnitureId = result.insertId;

    if (validImages.length > 0) {
      const imageValues = validImages.map((img) => [furnitureId, img]);

      await db.query(
        "INSERT INTO furniture_images (furniture_id, image_url) VALUES ?",
        [imageValues]
      );
    }

    res.status(201).json({
      message: "Furniture posted successfully.",
      furnitureId
    });
  } catch (err) {
    console.error("POST /api/furniture error:", err);
    res.status(500).json({
      message: err.sqlMessage || err.message || "Failed to post furniture"
    });
  }
});

// GET FURNITURE WISHLIST
app.get("/api/furniture-wishlist", authenticate, async (req, res) => {
  const [rows] = await db.query(
    "SELECT furniture_id FROM saved_furniture WHERE user_id = ?",
    [req.user.id]
  );
  res.json(rows.map(r => r.furniture_id));
});

// ADD TO FURNITURE WISHLIST
app.post("/api/furniture-wishlist/:furnitureId", authenticate, async (req, res) => {
  await db.query(
    "INSERT IGNORE INTO saved_furniture (user_id, furniture_id) VALUES (?, ?)",
    [req.user.id, req.params.furnitureId]
  );
  res.json({ message: "Added to wishlist" });
});

// REMOVE FROM FURNITURE WISHLIST
app.delete("/api/furniture-wishlist/:furnitureId", authenticate, async (req, res) => {
  await db.query(
    "DELETE FROM saved_furniture WHERE user_id = ? AND furniture_id = ?",
    [req.user.id, req.params.furnitureId]
  );
  res.json({ message: "Removed from wishlist" });
});

// GET ALL USERS (ADMIN)
app.get("/api/admin/users", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const [users] = await db.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        COALESCE(av.status, 'checked') AS verification_status
      FROM users u
      LEFT JOIN account_verification av ON u.id = av.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST PROPERTY
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
      main_image,
      images = [],
      rooms = [],
      latitude = null,
      longitude = null
    } = req.body;

    const userId = req.user.id;

    if (!title || !address || !type || !price) {
      return res.status(400).json({ message: "Title, address, type and price are required." });
    }

    if (!["rental", "short-term", "buy"].includes(type)) {
      return res.status(400).json({ message: "Invalid property type." });
    }

    // promote normal user to landlord when they post
    await db.query(
      `UPDATE users
       SET role = CASE
         WHEN role = 'user' THEN 'landlord'
         ELSE role
       END
       WHERE id = ?`,
      [userId]
    );

    const safeMainImage =
      main_image && String(main_image).trim() !== ""
        ? main_image
        : (Array.isArray(images) && images.length > 0 ? images[0] : null);

    const [result] = await db.query(
      `INSERT INTO properties
       (title, address, type, price, bedrooms, bathrooms, size, description, main_image, latitude, longitude, landlord_id, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false)`,
      [
        title,
        address,
        type,
        Number(price),
        bedrooms || null,
        bathrooms || null,
        size || null,
        description || "",
        safeMainImage,
        latitude,
        longitude,
        userId
      ]
    );

    const propertyId = result.insertId;

    if (Array.isArray(images) && images.length > 0) {
      const validImages = images.filter((img) => img && String(img).trim() !== "");
      if (validImages.length > 0) {
        const values = validImages.map((img) => [propertyId, img]);
        await db.query(
          "INSERT INTO property_images (property_id, image_url) VALUES ?",
          [values]
        );
      }
    }

    if (type === "buy" && Array.isArray(rooms) && rooms.length > 0) {
      const validRooms = rooms.filter(
        (room) =>
          room &&
          String(room.name || "").trim() !== "" &&
          String(room.type || "").trim() !== ""
      );

      if (validRooms.length > 0) {
        const roomValues = validRooms.map((room) => [
          propertyId,
          room.name,
          room.type,
          ["small", "medium", "large"].includes(room.sizeCategory)
            ? room.sizeCategory
            : "medium"
        ]);

        await db.query(
          "INSERT INTO property_rooms (property_id, name, type, size_category) VALUES ?",
          [roomValues]
        );
      }
    }

    res.status(201).json({
      message: "Property posted successfully and awaiting admin approval.",
      propertyId
    });
  } catch (err) {
    console.error("POST /api/properties error:", err);
    res.status(500).json({
      message: err.sqlMessage || err.message || "Failed to post property"
    });
  }
});

// GET RECOMMENDATIONS BASED ON VIEW HISTORY
app.get("/api/recommendations", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const [history] = await db.query(
      `SELECT * 
       FROM view_history h
       JOIN properties p ON h.property_id = p.id
       WHERE h.user_id = ?
       ORDER BY h.viewed_at DESC`,
      [userId]
    );

    if (history.length === 0) {
      return res.json([]);
    }

    const preferredType = history[0].type;

    const [recommendations] = await db.query(
      "SELECT * FROM properties WHERE type = ? AND is_verified = true LIMIT 5",
      [preferredType]
    );

    res.json(recommendations);
  } catch (err) {
    console.error("GET /api/recommendations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// SEND MESSAGE TO LANDLORD / USER
app.post("/api/messages", authenticate, async (req, res) => {
  const { receiver_id, property_id, message } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !property_id || !message?.trim()) {
    return res.status(400).json({
      message: "receiver_id, property_id, and message are required"
    });
  }

  if (Number(receiver_id) === Number(sender_id)) {
    return res.status(400).json({
      message: "You cannot message yourself"
    });
  }

  try {
    const [receiverRows] = await db.query(
      "SELECT id, first_name, last_name, role, profile_picture FROM users WHERE id = ?",
      [receiver_id]
    );

    if (!receiverRows.length) {
      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    const [propertyRows] = await db.query(
      "SELECT id, title, address, main_image FROM properties WHERE id = ?",
      [property_id]
    );

    if (!propertyRows.length) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    const [insertResult] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, property_id, message) VALUES (?, ?, ?, ?)",
      [sender_id, receiver_id, property_id, message.trim()]
    );

    const [senderRows] = await db.query(
      "SELECT id, first_name, last_name, role, profile_picture FROM users WHERE id = ?",
      [sender_id]
    );

    const savedMessage = {
      id: insertResult.insertId,
      sender_id: Number(sender_id),
      receiver_id: Number(receiver_id),
      property_id: Number(property_id),
      message: message.trim(),
      created_at: new Date(),
      sender_first_name: senderRows[0]?.first_name || "",
      sender_last_name: senderRows[0]?.last_name || "",
      receiver_first_name: receiverRows[0]?.first_name || "",
      receiver_last_name: receiverRows[0]?.last_name || "",
      property_title: propertyRows[0]?.title || "",
      property_address: propertyRows[0]?.address || "",
      property_image: propertyRows[0]?.main_image || ""
    };

    const sortedUsers = [Number(sender_id), Number(receiver_id)].sort((a, b) => a - b);
    const roomName = `chat:${property_id}:${sortedUsers[0]}:${sortedUsers[1]}`;

    io.to(roomName).emit("new_message", savedMessage);

    io.to(`user:${sender_id}`).emit("inbox_updated");
    io.to(`user:${receiver_id}`).emit("inbox_updated");

    res.json({
      message: "Message stored successfully",
      data: savedMessage
    });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    res.status(500).json({ message: "DB insert failed" });
  }
});



// GET MESSAGES FOR A PROPERTY BETWEEN USER AND LANDLORD
app.get("/api/messages/:propertyId/:receiverId", authenticate, async (req, res) => {
  const { propertyId, receiverId } = req.params;
  const currentUserId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
         m.id,
         m.sender_id,
         m.receiver_id,
         m.property_id,
         m.message,
         m.created_at,
         su.first_name AS sender_first_name,
         su.last_name AS sender_last_name,
         ru.first_name AS receiver_first_name,
         ru.last_name AS receiver_last_name,
         p.title AS property_title,
         p.address AS property_address,
         p.main_image AS property_image
       FROM messages m
       JOIN users su ON su.id = m.sender_id
       JOIN users ru ON ru.id = m.receiver_id
       LEFT JOIN properties p ON p.id = m.property_id
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

// GET MESSAGE INBOX FOR PROFILE PAGE
app.get("/api/messages/inbox", authenticate, async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const [rows] = await db.query(
      `
      SELECT
        m.property_id,
        p.title AS property_title,
        p.address AS property_address,
        p.main_image AS property_image,
        CASE
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END AS other_user_id,
        CASE
          WHEN m.sender_id = ? THEN CONCAT(COALESCE(ur.first_name, ''), ' ', COALESCE(ur.last_name, ''))
          ELSE CONCAT(COALESCE(us.first_name, ''), ' ', COALESCE(us.last_name, ''))
        END AS other_user_name,
        CASE
          WHEN m.sender_id = ? THEN ur.role
          ELSE us.role
        END AS other_user_role,
        CASE
          WHEN m.sender_id = ? THEN ur.profile_picture
          ELSE us.profile_picture
        END AS other_user_picture,
        m.message AS last_message,
        m.created_at AS last_message_time,
        (
          SELECT COUNT(*)
          FROM messages mx
          WHERE mx.property_id = m.property_id
            AND mx.sender_id = CASE
              WHEN m.sender_id = ? THEN m.receiver_id
              ELSE m.sender_id
            END
            AND mx.receiver_id = ?
            AND mx.is_read = FALSE
        ) AS unread_count
      FROM messages m
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN users us ON us.id = m.sender_id
      LEFT JOIN users ur ON ur.id = m.receiver_id
      INNER JOIN (
        SELECT
          property_id,
          LEAST(sender_id, receiver_id) AS user_low,
          GREATEST(sender_id, receiver_id) AS user_high,
          MAX(id) AS latest_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY property_id, LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
      ) latest
        ON latest.latest_id = m.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
      `,
      [
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId,
        currentUserId
      ]
    );

    const cleaned = rows.map((row) => ({
      ...row,
      other_user_name: row.other_user_name?.trim() || "User",
      unread_count: Number(row.unread_count || 0)
    }));

    res.json(cleaned);
  } catch (err) {
    console.error("GET /api/messages/inbox error:", err);
    res.status(500).json({ message: err.sqlMessage || "Failed to load inbox" });
  }
});

// MARK CONVERSATION AS READ
app.post("/api/messages/read", authenticate, async (req, res) => {
  const { property_id, other_user_id } = req.body;
  const currentUserId = req.user.id;

  if (!property_id || !other_user_id) {
    return res.status(400).json({ message: "property_id and other_user_id are required" });
  }

  try {
    await db.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE property_id = ?
         AND sender_id = ?
         AND receiver_id = ?
         AND is_read = FALSE`,
      [property_id, other_user_id, currentUserId]
    );

    io.to(`user:${currentUserId}`).emit("inbox_updated");
    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("POST /api/messages/read error:", err);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

// GET UNVERIFIED PROPERTIES (ADMIN)
app.get("/api/admin/properties", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM properties WHERE is_verified = false"
    );

    res.json(rows);
  } catch (err) {
    console.error("Admin properties error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY PROPERTY (ADMIN)
app.post("/api/admin/approve/:id", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  try {
    await db.query(
      "UPDATE properties SET is_verified = true WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: "Property approved successfully" });
  } catch (err) {
    console.error("Approve property error:", err);
    res.status(500).json({ message: "Server error" });
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
// REJECT USER (ADMIN)
app.post("/api/admin/reject-user/:userId", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }

  try {
    const userId = req.params.userId;

    const [userRows] = await db.query(
      "SELECT id, role FROM users WHERE id = ?",
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userRows[0].role === "admin") {
      return res.status(400).json({ message: "Admin users cannot be rejected" });
    }

    const [existing] = await db.query(
      "SELECT * FROM account_verification WHERE user_id = ?",
      [userId]
    );

    if (existing.length) {
      await db.query(
        "UPDATE account_verification SET status = 'rejected', verified_at = NULL WHERE user_id = ?",
        [userId]
      );
    } else {
      await db.query(
        "INSERT INTO account_verification (user_id, status, verified_at) VALUES (?, 'rejected', NULL)",
        [userId]
      );
    }

    res.json({ message: "User rejected successfully" });
  } catch (err) {
    console.error("Reject user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE FURNITURE (only seller who posted or admin can delete)
app.delete("/api/furniture/:id", authenticate, async (req, res) => {
  const furnitureId = Number(req.params.id);
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!Number.isInteger(furnitureId) || furnitureId <= 0) {
    return res.status(400).json({ message: "Invalid furniture id." });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, seller_id FROM furniture WHERE id = ?",
      [furnitureId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Furniture not found" });
    }

    const item = rows[0];

    if (userRole !== "admin" && Number(item.seller_id) !== Number(userId)) {
      return res.status(403).json({ message: "You can only delete your own furniture." });
    }

    await db.query("DELETE FROM furniture WHERE id = ?", [furnitureId]);

    res.json({ message: "Furniture deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/furniture/:id error:", err);
    res.status(500).json({ message: "Failed to delete furniture." });
  }
});

// DELETE PROPERTY (only landlord who posted or admin can delete)
app.delete("/api/properties/:id", authenticate, async (req, res) => {
  const propertyId = Number(req.params.id);
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return res.status(400).json({ message: "Invalid property id." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM properties WHERE id = ?",
      [propertyId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Property not found" });
    }

    const property = rows[0];

    if (userRole !== "admin" && Number(property.landlord_id) !== Number(userId)) {
      await connection.rollback();
      return res.status(403).json({ message: "You can only delete your own listing." });
    }

    await connection.query("DELETE FROM saved_listings WHERE property_id = ?", [propertyId]);
    await connection.query("DELETE FROM view_history WHERE property_id = ?", [propertyId]);
    await connection.query("DELETE FROM messages WHERE property_id = ?", [propertyId]);
    await connection.query("DELETE FROM payments WHERE property_id = ?", [propertyId]);
    await connection.query("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
    await connection.query("DELETE FROM properties WHERE id = ?", [propertyId]);

    await connection.commit();
    res.json({ message: "Property deleted successfully." });
  } catch (err) {
    await connection.rollback();
    console.error("DELETE /api/properties/:id error:", err);
    res.status(500).json({ message: "Failed to delete property." });
  } finally {
    connection.release();
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
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
