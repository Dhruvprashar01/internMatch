import api from "./api";

export const getCompanyProfile    = ()         => api.get("/companies/profile");
export const updateCompanyProfile = (data)     => api.put("/companies/profile", data);
export const requestVerification  = (data)     => api.post("/companies/request-verification", data);
export const getApplicants        = (id, p)    => api.get(`/applications/internship/${id}`, { params: p });
export const updateApplicationStatus = (id, d) => api.patch(`/applications/${id}/status`, d);
export const markInternshipComplete  = (id)    => api.patch(`/applications/${id}/complete`);