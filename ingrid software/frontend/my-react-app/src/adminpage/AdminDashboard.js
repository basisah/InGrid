import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import "./admin.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingUsers, setPendingUsers] = useState([]);
  const navigate = useNavigate();

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
      console.error("Fetch users error:", err);
      setUsers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Fetch properties failed:", res.status);
        setProperties([]);
        return;
      }

      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch properties error:", err);
      setProperties([]);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/admin/pending-users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Fetch pending users failed:", res.status);
        setPendingUsers([]);
        return;
      }

      const data = await res.json();
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch pending users error:", err);
      setPendingUsers([]);
    }
  };

  const approveProperty = async (id) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Approve failed:", res.status);
        return;
      }

      fetchProperties();
    } catch (err) {
      console.error("Approve property error:", err);
    }
  };

  const verifyUser = async (id) => {
    try {
      const res = await fetch(`/api/verify-user/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error("Verify failed:", res.status);
        return;
      }

      fetchUsers();
      fetchPendingUsers();
    } catch (err) {
      console.error("Verify user error:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
    fetchProperties();
    fetchPendingUsers();
  }, [token, navigate]);

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="admin-container">
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
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
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
                      {pendingUsers.find((p) => p.id === user.id) ? (
                        <span style={{ color: "#f39c12" }}>Pending</span>
                      ) : (
                        <span style={{ color: "#10b981" }}>Checked</span>
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
              {properties.map((p) => (
                <div className="property-card admin-card" key={p.id}>
                  <img src={p.main_image} alt="property" />
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