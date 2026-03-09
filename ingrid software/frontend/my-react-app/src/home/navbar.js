import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="logo">INGRID</div>

      <ul className="nav-links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/listing">Listings</Link></li>
        <li><Link to="/compare">Compare</Link></li>
        <li><Link to="/propertyList">Post Property</Link></li>


        {isLoggedIn ? (
          <li className="login-btn" onClick={handleLogout}>
            Logout
          </li>
        ) : (
          <li className="login-btn"><Link to="/login">Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;