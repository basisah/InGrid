import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/signup";
import Login from "./pages/login";
import ForgotPassword from "./pages/forget";
import ResetPassword from "./pages/reset";
import Profile from "./userprofile/profile";
import Home from "./home/home";

import Listings from "./listingpage/listing";
import PropertyDetail from "./listingpage/propertydetail";
import Compare from "./listingpage/compare";
// import AdminDashboard from "./pages/AdminDashboard";

// PrivateRoute component to guard protected routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" />} />

        {/* Public Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/compare" element={<Compare />} />

        {/* nelson update - i commented out the private routes because i want to test the public routes first and i need to see the public routes work correctly */}
        
        {/* Protected Routes
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/listings"
          element={
            <PrivateRoute>
              <Listings />
            </PrivateRoute>
          }
        />

        <Route
          path="/property/:id"
          element={
            <PrivateRoute>
              <PropertyDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/compare"
          element={
            <PrivateRoute>
              <Compare />
            </PrivateRoute>
          }
        /> */}

        <Route path="*" element={<p>Page Not Found</p>} />

      </Routes>
    </Router>
  );
}

export default App;