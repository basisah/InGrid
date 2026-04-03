import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./signup.css";
import logo from "../assets/logo.png";

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
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const getPasswordStrength = () => {
    if (password.length < 6) return "Weak";
    if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.length >= 8
    ) {
      return "Strong";
    }
    return "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
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
        toast.success("Signup successful! Please verify your email.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Frontend signup error:", err);
      toast.error("Server error. Try again later.");
    }
  };

  return (
    <div className={`signup-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="signup-card">
        <img src={logo} alt="Logo" className="signup-logo" />

        <h2>Create Account</h2>

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
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Middle Name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />

          <input
            type="text"
            placeholder="Home Address"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
          />

          <div className="form-row">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

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
      </div>
    </div>
  );
}

export default Signup;