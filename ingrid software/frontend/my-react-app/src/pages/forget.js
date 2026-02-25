import React, { useState } from "react";
import "./forget.css";
import logo from "../assets/logo.png"; // adjust path if needed

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";

      const response = await fetch(`${API_URL}/api/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });


      const data = await response.json();

      if (response.ok) {
        setMessage(
          "If your email exists, a password reset link has been sent."
        );
      } else {
        setMessage(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
      setEmail("");
    }
  };

  return (
    <div className={`forgot-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="forgot-card">

        {/* Logo */}
        <img src={logo} alt="Logo" className="forgot-logo" />

        <h2>Forgot Password</h2>

        <p className="subtitle">
          Enter your email and we’ll send you a reset link.
        </p>

        {/* Dark Mode Toggle */}
        <div className="dark-toggle">
          <label>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
            Dark Mode
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;
