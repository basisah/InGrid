import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./reset.css";
import logo from "../assets/logo.png"; // adjust path if needed

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const getStrength = () => {
    if (password.length < 6) return { level: "Weak", width: "33%" };
    if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.length >= 8
    )
      return { level: "Strong", width: "100%" };
    return { level: "Medium", width: "66%" };
  };
  const passwordRules = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
};

const isPasswordValid = Object.values(passwordRules).every(Boolean);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!isPasswordValid) {
    setMessage("Password does not meet requirements.");
    return;
    }

    if (password !== confirmPassword) {
     setMessage("Passwords do not match");
     return;
    }


    setLoading(true);

    try {
      // const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";

      const response = await fetch(`/api/reset/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });


      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successful! Redirecting...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setMessage(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength();

  return (
    <div className={`reset-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="reset-card">

        {/* Logo */}
        <img src={logo} alt="Logo" className="reset-logo" />

        <h2>Reset Password</h2>

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

          {/* Password */}
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {/* Strength Bar */}
          {password && (
            <div className="strength-wrapper">
              <div className="strength-bar">
                <div
                  className={`strength-fill ${strength.level.toLowerCase()}`}
                  style={{ width: strength.width }}
                ></div>
              </div>
              <span className={`strength-text ${strength.level.toLowerCase()}`}>
                {strength.level}
              </span>
            </div>
          )}

          {/* Password Rules */}
          {/* Password Requirements */}
          {password && (
            <div className="requirements">
              <p className={passwordRules.length ? "valid" : "invalid"}>
                {passwordRules.length ? "✔" : "✖"} At least 8 characters
              </p>
              <p className={passwordRules.uppercase ? "valid" : "invalid"}>
                {passwordRules.uppercase ? "✔" : "✖"} One uppercase letter
              </p>
              <p className={passwordRules.lowercase ? "valid" : "invalid"}>
                {passwordRules.lowercase ? "✔" : "✖"} One lowercase letter
              </p>
              <p className={passwordRules.number ? "valid" : "invalid"}>
                {passwordRules.number ? "✔" : "✖"} One number
              </p>
              <p className={passwordRules.special ? "valid" : "invalid"}>
                {passwordRules.special ? "✔" : "✖"} One special character
              </p>
            </div>
          )}

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Reset Password"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;
