import React, { useState } from "react";
import { toast } from "react-hot-toast";
import "./forget.css";
import logo from "../assets/logo.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("If your email exists, a reset link has been sent.");
      } else {
        toast.error(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Server error. Please try again later.");
    } finally {
      setLoading(false);
      setEmail("");
    }
  };

  return (
    <div className={`forgot-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="forgot-card">
        <img src={logo} alt="Logo" className="forgot-logo" />

        <h2>Forgot Password</h2>

        <p className="subtitle">
          Enter your email and we’ll send you a reset link.
        </p>

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
      </div>
    </div>
  );
}

export default ForgotPassword;