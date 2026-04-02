import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Payment from "./pages/payment.js";
import Wishlist from "./pages/wishlist.js";
import TripHistory from "./pages/triphistory.js";
import { Toaster } from "react-hot-toast";

import Signup from "./pages/signup";
import Login from "./pages/login";
import ForgotPassword from "./pages/forget";
import ResetPassword from "./pages/reset";
import Profile from "./userprofile/profile";
import Home from "./home/home";
import Listings from "./listingpage/listing";
import PropertyDetail from "./listingpage/propertydetail";
import Compare from "./listingpage/compare";
import PostProperty from "./property/property";
import AdminDashboard from "./adminpage/AdminDashboard";
import Verify from "./pages/verify";
import ChatPage from "./pages/chat";
import FurnitureStore from "./pages/furniturestore";

// PrivateRoute component to guard protected routes
// const PrivateRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? children : <Navigate to="/login" />;
// };
//  Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" />} />

        {/* Public Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/furniture" element={<FurnitureStore />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/post-property" element={<PostProperty />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/trips" element={<TripHistory />} />
        <Route path="/chat/:propertyId/:receiverId" element={<ChatPage />} />
        

        {/* nelson update - i commented out the private routes because i want to test the public routes first and i need to see the public routes work correctly */}

        {/* Protected Routes
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
      {/*  Global Toast System */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#111827",
            color: "#fff",
            borderRadius: "12px",
            padding: "14px 18px",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
          },
          success: {
            duration: 2500,
            iconTheme: {
              primary: "#4f46e5",
              secondary: "#fff"
            }
          },
          error: {
            duration: 3500,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff"
            }
          },
          loading: {
            iconTheme: {
              primary: "#6366f1",
              secondary: "#fff"
            }
          }
        }}
      />

      <div style={{ minHeight: "100vh" }}>
        <Routes>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/home" />} />

          {/*  Public Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          {/*  Protected Routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

        <Route path="*" element={<p>Page Not Found</p>} />
      </Routes>
          <Route
            path="/compare"
            element={
              <PrivateRoute>
                <Compare />
              </PrivateRoute>
            }
          />

          <Route
            path="/post-property"
            element={
              <PrivateRoute>
                <PostProperty />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<p style={{ padding: "40px" }}>Page Not Found</p>} />

        </Routes>
      </div>

    </Router>
  );
}

export default App;