import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h2>INGRID</h2>
          <p>
            Your all-in-one housing platform for rentals, short stays, home
            buying, comparisons, reviews, and smarter decisions.
          </p>
        </div>

        <div className="footer-columns">
          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/home">Home</Link>
            <Link to="/listings">Listings</Link>
            <Link to="/compare">Compare</Link>
            <Link to="/furniture">Furniture</Link>
          </div>

          <div className="footer-column">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/wishlist">Wishlist</Link>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <Link to="/help">Help Centre</Link>
            <Link to="/post-property">Become a Landlord</Link>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Ingrid. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;