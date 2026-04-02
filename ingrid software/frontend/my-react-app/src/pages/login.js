import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import background from "../assets/background.png";
import logo from "../assets/logo.png";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Both email and password are required.");
      return;
    }

    try {
      // const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          // Store JWT in localStorage
          localStorage.setItem("token", data.token);
        }

        setMessage("Login successful!");
        // Navigate to home/dashboard after 1 second
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMessage(data.message || "Invalid email or password.");
      }

    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server error. Please try again later.");
    }

    // Optional: clear password for security
    setPassword("");
  };

  return (
  <div
    className="login-container"
    style={{ backgroundImage: `url(${background})` }}
  >
    <div className="login-card">
      <div className="logo-section">
        <img src={logo} alt="Ingrid Logo" className="logo" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit">Sign In</button>

        {message && <p className="message">{message}</p>}

        <div className="links">
          <a href="/forgotpassword">Forgot password?</a>
          <a href="/help">Help</a>
          <a href="/signup">Don't have an account? Sign Up</a>
        </div>
      </form>
    </div>
  </div>
);

}

export default Login;
