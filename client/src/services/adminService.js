import api from "./api";

export const getPlatformStats  = ()       => api.get("/admin/stats");
export const getDiversityStats = ()       => api.get("/admin/diversity-stats");
export const getAllUsers        = (params) => api.get("/admin/users", { params });
export const toggleUserStatus  = (id)     => api.patch(`/admin/users/${id}/toggle-active`);
export const deleteUser        = (id)     => api.delete(`/admin/users/${id}`);
export const getAllInternships  = (params) => api.get("/admin/internships", { params });
export const deleteInternship  = (id)     => api.delete(`/admin/internships/${id}`);
export const getAllApplications = (params) => api.get("/admin/applications", { params });

// ── Company Verification ──────────────────────────────────────────────────
export const getPendingVerifications = (params) => api.get("/admin/verifications", { params });
export const verifyCompany           = (id)     => api.patch(`/admin/verifications/${id}/approve`);
export const rejectVerification      = (id, data) => api.patch(`/admin/verifications/${id}/reject`, data);