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
        <li>Home</li>
        <li>listings</li>
        <li>Compare</li>
        <li>Post Property</li>


        {isLoggedIn ? (
          <li className="login-btn" onClick={handleLogout}>
            Logout
          </li>
        ) : (
          <li className="login-btn">Login</li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;