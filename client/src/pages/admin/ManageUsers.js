import React, { useEffect, useState, useCallback } from "react";
import { getAllUsers, toggleUserStatus, deleteUser } from "../../services/adminService";
import Alert from "../../components/common/Alert";
import Spinner from "../../components/common/Spinner";
import "./ManageUsers.css";

const ROLES = ["all", "candidate", "company", "admin"];

const ManageUsers = () => {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [roleFilter,setRoleFilter]= useState("all");
  const [search,    setSearch]    = useState("");
  const [deleting,  setDeleting]  = useState(null);
  const [confirm,   setConfirm]   = useState(null); // id pending delete confirm

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await getAllUsers(params);
      setUsers(data.data || []);
    } catch { setError("Failed to load users"); }
    finally { setLoading(false); }
  }, [roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleUserStatus(id);
      setUsers((p) => p.map((u) => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      setSuccess(data.data.isActive ? "User activated" : "User deactivated");
    } catch { setError("Could not update user status"); }
  };

  const handleDelete = async (id) => {
    setDeleting(id); setConfirm(null);
    try {
      await deleteUser(id);
      setUsers((p) => p.filter((u) => u._id !== id));
      setSuccess("User deleted successfully");
    } catch (e) { setError(e.response?.data?.message || "Delete failed"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="mu-page">
      <div className="mu-header">
        <div>
          <h1 className="mu-title">User Management</h1>
          <p className="mu-sub">{users.length} users found</p>
        </div>
      </div>

      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Confirm Delete Modal */}
      {confirm && (
        <div className="mu-overlay">
          <div className="mu-confirm-box">
            <div className="mu-confirm-icon">⚠</div>
            <h3>Delete User?</h3>
            <p>This will permanently delete the user and all their data. This cannot be undone.</p>
            <div className="mu-confirm-actions">
              <button className="mu-btn mu-btn-ghost"  onClick={() => setConfirm(null)}>Cancel</button>
              <button className="mu-btn mu-btn-danger" onClick={() => handleDelete(confirm)} disabled={deleting === confirm}>
                {deleting === confirm ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mu-filters">
        <input
          className="mu-search"
          placeholder="🔍  Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
        />
        <div className="mu-role-tabs">
          {ROLES.map((r) => (
            <button key={r} className={`mu-role-tab ${roleFilter === r ? "active" : ""}`} onClick={() => setRoleFilter(r)}>
              {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="mu-table-wrap">
          <table className="mu-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={!u.isActive ? "mu-row-inactive" : ""}>
                  <td>
                    <div className="mu-user-cell">
                      <div className="mu-avatar">{u.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="mu-name">{u.name}</div>
                        <div className="mu-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`mu-role mu-role-${u.role}`}>{u.role}</span></td>
                  <td><span className={`mu-status ${u.isActive ? "active" : "inactive"}`}>{u.isActive ? "● Active" : "○ Inactive"}</span></td>
                  <td className="mu-date">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <div className="mu-actions">
                      {u.role !== "admin" && (
                        <>
                          <button className={`mu-btn ${u.isActive ? "mu-btn-warn" : "mu-btn-success"}`} onClick={() => handleToggle(u._id)}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button className="mu-btn mu-btn-danger" onClick={() => setConfirm(u._id)}>Delete</button>
                        </>
                      )}
                      {u.role === "admin" && <span className="mu-protected">Protected</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={5} className="mu-empty">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;