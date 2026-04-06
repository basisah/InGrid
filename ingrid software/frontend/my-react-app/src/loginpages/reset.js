import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./reset.css";
import logo from "../assets/logoV2.png";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const getStrength = () => {
    if (password.length < 6) return { level: "Weak", width: "33%" };
    if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.length >= 8
    ) {
      return { level: "Strong", width: "100%" };
    }
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

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Password does not meet requirements.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/reset/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successful!");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength();

  return (
    <div className={`reset-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="reset-card">
        <img src={logo} alt="Logo" className="reset-logo" />

        <h2>Reset Password</h2>

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
      </div>
    </div>
  );
}

export default ResetPassword;