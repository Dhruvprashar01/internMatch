import api from "./api";

export const applyToInternship   = (internshipId, data) => api.post(`/applications/${internshipId}`, data);
export const getMyApplications   = (params)             => api.get("/applications/my-applications", { params });
export const getInternshipApplicants = (internshipId, params) => api.get(`/applications/internship/${internshipId}`, { params });
export const updateApplicationStatus = (appId, data)   => api.patch(`/applications/${appId}/status`, data);
export const withdrawApplication = (appId)              => api.patch(`/applications/${appId}/withdraw`);
