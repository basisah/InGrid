import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate("/home");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/home" className="logo">
          INGRID
        </Link>

        <ul className="nav-links">
          <li>
            <Link className={isActive("/home") ? "active-link" : ""} to="/home">
              Home
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/listings") ? "active-link" : ""}
              to="/listings"
            >
              Listings
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/furniture") ? "active-link" : ""}
              to="/furniture"
            >
              Furniture
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/compare") ? "active-link" : ""}
              to="/compare"
            >
              Compare
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/post-property") ? "active-link" : ""}
              to="/post-property"
            >
              Become a Landlord
            </Link>
          </li>

          <li className="profile-menu" ref={dropdownRef}>
            <button
              type="button"
              className="profile-icon"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              ☰
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                {isLoggedIn ? (
                  <>
                    <Link to="/wishlist" onClick={() => setDropdownOpen(false)}>
                      Wishlist
                    </Link>
                    <Link to="/trips" onClick={() => setDropdownOpen(false)}>
                      Trip History
                    </Link>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                      Profile
                    </Link>
                    <hr />
                    <Link to="/help" onClick={() => setDropdownOpen(false)}>
                      Help Centre
                    </Link>
                    <span onClick={handleLogout}>Logout</span>
                  </>
                ) : (
                  <>
                    <Link to="/help" onClick={() => setDropdownOpen(false)}>
                      Help Centre
                    </Link>
                    <hr />
                    <Link to="/login" onClick={() => setDropdownOpen(false)}>
                      Login / Signup
                    </Link>
                  </>
                )}
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;