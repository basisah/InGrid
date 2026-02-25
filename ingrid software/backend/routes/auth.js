const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role || "buyer"]
    );

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Email already exists" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (!users.length) return res.status(400).json({ message: "User not found" });

  const user = users[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "7d" }
  );

  res.json({ token });
});

module.exports = router;