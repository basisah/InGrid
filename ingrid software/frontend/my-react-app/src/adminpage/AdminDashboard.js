import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./admin.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoadingUsers(true);
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
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
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
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/admin/pending-users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
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

  const verifyUser = async (id) => {
    const loadingToast = toast.loading("Verifying user...");

    try {
      const res = await fetch(`/api/verify-user/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        toast.error("Failed to verify user.", { id: loadingToast });
        return;
      }

      await Promise.all([fetchUsers(), fetchPendingUsers()]);
      toast.success("User verified successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Verify user error:", err);
      toast.error("Something went wrong while verifying user.", { id: loadingToast });
    }
  };

  const rejectUser = async (id) => {
    const confirmed = window.confirm("Reject this user?");
    if (!confirmed) return;

    const loadingToast = toast.loading("Rejecting user...");

    try {
      const res = await fetch(`/api/admin/reject-user/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        toast.error("Failed to reject user.", { id: loadingToast });
        return;
      }

      await Promise.all([fetchUsers(), fetchPendingUsers()]);
      toast.success("User rejected successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Reject user error:", err);
      toast.error("Something went wrong while rejecting user.", { id: loadingToast });
    }
  };

  const approveProperty = async (id) => {
    const loadingToast = toast.loading("Approving listing...");

    try {
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        toast.error("Failed to approve listing.", { id: loadingToast });
        return;
      }

      await fetchProperties();
      toast.success("Listing approved successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Approve property error:", err);
      toast.error("Something went wrong while approving listing.", { id: loadingToast });
    }
  };

  const rejectProperty = async (id) => {
    const confirmed = window.confirm("Reject and remove this listing?");
    if (!confirmed) return;

    const loadingToast = toast.loading("Rejecting listing...");

    try {
      const res = await fetch(`/api/admin/reject/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        toast.error("Failed to reject listing.", { id: loadingToast });
        return;
      }

      await fetchProperties();
      toast.success("Listing rejected successfully.", { id: loadingToast });
    } catch (err) {
      console.error("Reject property error:", err);
      toast.error("Something went wrong while rejecting listing.", { id: loadingToast });
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

  const pendingUserIds = useMemo(
    () => new Set(pendingUsers.map((u) => u.id)),
    [pendingUsers]
  );

  const totalUsers = users.filter((u) => u.role !== "admin").length;

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
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
          Listings
        </button>
      </aside>

      <main className="admin-content">
        {activeTab === "dashboard" && (
          <div>
            <h2>Dashboard Overview</h2>

            <div className="admin-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{totalUsers}</p>
              </div>

              <div className="stat-card">
                <h3>Pending Users</h3>
                <p>{pendingUsers.length}</p>
              </div>

              <div className="stat-card">
                <h3>Pending Listings</h3>
                <p>{properties.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="admin-section-header">
              <h2>User Management</h2>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="5" className="empty-state">Loading users...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">No users found.</td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const status =
                        user.role === "admin"
                          ? "Admin"
                          : pendingUserIds.has(user.id)
                          ? "Pending"
                          : "Checked";

                      return (
                        <tr key={user.id}>
                          <td>{user.first_name} {user.last_name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge role-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={
                                status === "Pending"
                                  ? "status pending"
                                  : status === "Checked"
                                  ? "status approved"
                                  : "status neutral"
                              }
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            {user.role === "admin" ? (
                              <span className="dash">—</span>
                            ) : (
                              <div className="action-group">
                                <button
                                  className="verify-btn"
                                  onClick={() => verifyUser(user.id)}
                                >
                                  Verify
                                </button>

                                <button
                                  className="reject-btn"
                                  onClick={() => rejectUser(user.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div>
            <div className="admin-section-header">
              <h2>Pending Property Listings</h2>
            </div>

            {loadingProperties ? (
              <p className="empty-state">Loading listings...</p>
            ) : properties.length === 0 ? (
              <p className="empty-state">No pending listings.</p>
            ) : (
              <div className="admin-properties">
                {properties.map((p) => (
                  <div className="property-card admin-card" key={p.id}>
                    <img src={p.main_image} alt={p.title} />

                    <div className="admin-card-body">
                      <h3>{p.title}</h3>
                      <p>{p.address}</p>
                      <p className="listing-price">${p.price}</p>

                      <div className="admin-card-actions">
                        <button
                          className="approve-btn"
                          onClick={() => approveProperty(p.id)}
                        >
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => rejectProperty(p.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;