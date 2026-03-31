import React, { useEffect, useState } from "react";

import { Navigate } from "react-router-dom";
import { useNavigate, Navigate } from "react-router-dom";
import "./admin.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Access denied:", res.status);
        setUsers([]);
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setUsers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setProperties([]);
    }
  };
  const approveProperty = async (id) => {
    await fetch(`/api/admin/approve/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchProperties(); // refresh list
  };
  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/admin/pending-users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPendingUsers([]);
    }
  };

  const verifyUser = async (id) => {
    await fetch(`/api/verify-user/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchUsers();
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
    fetchProperties();
    fetchPendingUsers();
  }, []);

  if (!token) return <Navigate to="/login" />;

  // proper count (non-admin users)
  const nonAdminUsers = users.filter(u => u.role !== "admin");

  return (
    <div className="admin-container">

      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <h2>Ingrid Admin</h2>

        <button 
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>

        <button 
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>

        <button 
          className={activeTab === "properties" ? "active" : ""}
          onClick={() => setActiveTab("properties")}
        >
          Properties
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-content">

        {activeTab === "dashboard" && (
          <div>
            <h2>Dashboard Overview</h2>

            <div className="admin-stats">

              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{users.length}</p>
              </div>

              <div className="stat-card">
                <h3>Pending Properties</h3>
                <p>{properties.length}</p>
              </div>

              {/*  FIXED CARD */}
              <div className="stat-card">
                <h3>Pending Users</h3>
                <p>{pendingUsers.length}</p>
              </div>

            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2>User Management</h2>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verify</th>
                </tr>
              </thead>

              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {/* don't verify admins */}
                      {user.role === "admin" ? (
                        <span style={{ color: "gray" }}>—</span>
                      ) : (
                        <button
                          className="verify-btn"
                          onClick={() => verifyUser(user.id)}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                    <td>
                      {pendingUsers.find(p => p.id === user.id) && (
                        <span style={{ color: "#f39c12" }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {activeTab === "properties" && (
          <div>
            <h2>Pending Property Listings</h2>

            <div className="admin-properties">

              {properties.map(p => (
                <div className="property-card admin-card" key={p.id}>

                  <img src={p.main_image} alt="property"/>

                  <h3>{p.title}</h3>
                  <p>{p.address}</p>
                  <p>${p.price}</p>

                  <button
                    className="approve-btn"
                    onClick={() => approveProperty(p.id)}
                  >
                    Approve
                  </button>
                </div>
              ))}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default AdminDashboard;