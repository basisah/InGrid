import { Link ,useNavigate} from "react-router-dom"; //basisah - added Link import for navigation
import React, {  useEffect, useState, useRef } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Close dropdown when clicking outside

 // basisah -Check login status on mount

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

<<<<<<< HEAD
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

=======
>>>>>>> 9d866fcba2ddb5eeb84a652927a784f8b54e566b
    const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate("/home");
  };

  return (
    <nav className="navbar">
      <div className="logo">INGRID</div>

      <ul className="nav-links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/listings">Listings</Link></li>
        <li><Link to="/compare">Compare</Link></li>
<<<<<<< HEAD
        <li><Link to="/post-property">Become a Landlord</Link></li>
        {/* basisah - Added conditional rendering for profile dropdown and dropdown button */}
        <li className="profile-menu" ref={dropdownRef}>
          {/* Dropdown button that toggles menu open/closed */}
          <div className="profile-icon" onClick={() => setDropdownOpen(!dropdownOpen)}>
            ☰ 
          </div>
=======
        <li><Link to="/post-property">Post Property</Link></li>

>>>>>>> 9d866fcba2ddb5eeb84a652927a784f8b54e566b

          {dropdownOpen && (
          <div className="profile-dropdown" >
            {isLoggedIn ? (
              <>
                <Link to="/wishlist" onClick={() => setDropdownOpen(false)}>Wishlist</Link>
                <Link to="/trips" onClick={() => setDropdownOpen(false)}>Trip History</Link>
                <Link to="/messages" onClick={() => setDropdownOpen(false)}>Messages</Link>
                <Link to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                <hr />
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>Account Settings</Link>
                <Link to="/help" onClick={() => setDropdownOpen(false)}>Help Centre</Link>
                <hr />
                <span onClick={handleLogout}>Logout</span>
              </>
            ) : (
              <>
                <Link to="/help" onClick={() => setDropdownOpen(false)}>Help Centre</Link>
                <hr />
                <Link to="/login" onClick={() => setDropdownOpen(false)}>Login / Signup</Link>
              </>
            )}
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;