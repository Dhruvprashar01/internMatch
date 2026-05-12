import api from "./api";

export const getProfile         = ()         => api.get("/candidates/profile");
export const updateProfile      = (data)     => api.put("/candidates/profile", data);
export const uploadResume       = (formData) => api.post("/resume/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getResumeData      = ()         => api.get("/resume/my-data");
export const getRecommendations = ()         => api.get("/recommendations");
export const getExplanation     = (id)       => api.get(`/recommendations/explain/${id}`);
export const getMyApplications  = (params)   => api.get("/applications/my-applications", { params });
export const applyToInternship  = (id, data) => api.post(`/applications/${id}`, data);
export const withdrawApplication= (id)       => api.patch(`/applications/${id}/withdraw`);
export const saveInternship     = (id)       => api.post(`/candidates/save-internship/${id}`);

// ── Readiness Roadmap ─────────────────────────────────────────────────────
export const getRoadmap = (internshipId) => api.get(`/roadmap/${internshipId}`);