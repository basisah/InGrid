import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";
import logo from "../assets/logo.png"; // <-- update path if needed

function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const getPasswordStrength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8)
      return "Strong";
    return "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";

      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          homeAddress,
          phoneNumber,
          email,
          password
        })
      });


      const data = await response.json();

      if (response.ok) {
        setMessage("Signup successful! Please verify your email.");
        setTimeout(() => navigate("/login"), 4000);
      } else {
        setMessage(data.message || "Signup failed");
      }
    } catch {
      setMessage("Server error. Try again later.");
    }
  };

  return (
    <div className={`signup-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="signup-card">
        
        {/* Logo */}
        <img src={logo} alt="Logo" className="signup-logo" />

        <h2>Create Account</h2>

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

          <div className="form-row">
            <input type="text" placeholder="First Name"
              value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input type="text" placeholder="Middle Name"
              value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <input type="text" placeholder="Last Name"
              value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>

          <input type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)} />

          <input type="text" placeholder="Home Address"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)} />

          <div className="form-row">
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="tel" placeholder="Phone"
              value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>

          {/* Password Field with Eye Icon */}
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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

          {/* Password Strength Meter */}
          {password && (
            <div className={`strength ${getPasswordStrength().toLowerCase()}`}>
              Strength: {getPasswordStrength()}
            </div>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Create Account</button>
        </form>

        {message && <p className="signup-message">{message}</p>}
      </div>
    </div>
  );
}

export default Signup;
