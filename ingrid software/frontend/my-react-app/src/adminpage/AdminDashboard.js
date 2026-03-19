import React, { useEffect, useState } from "react";
import "./admin.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:80";
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
  };

  const fetchProperties = async () => {
    const res = await fetch(`${API_URL}/api/properties`);
    const data = await res.json();
    setProperties(data);
  };

  const verifyUser = async (id) => {
    await fetch(`${API_URL}/api/verify-user/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
    fetchProperties();
  }, []);

  return (
    <div className="admin-container">

      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <h2>Ingrid Admin</h2>

        <button onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>

        <button onClick={() => setActiveTab("users")}>
          Users
        </button>

        <button onClick={() => setActiveTab("properties")}>
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
                <h3>Total Properties</h3>
                <p>{properties.length}</p>
              </div>

              <div className="stat-card">
                <h3>Pending Verification</h3>
                <p>
                  {users.filter(u => u.role === "user").length}
                </p>
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
                      <button
                        className="verify-btn"
                        onClick={() => verifyUser(user.id)}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {activeTab === "properties" && (
          <div>
            <h2>Property Listings</h2>

            <div className="admin-properties">

              {properties.map(p => (
                <div className="property-card" key={p.id}>

                  <img src={p.main_image} alt="property"/>

                  <h3>{p.title}</h3>
                  <p>{p.address}</p>
                  <p>${p.price}</p>

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