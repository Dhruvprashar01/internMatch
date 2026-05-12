import api from "./api";

export const getAllInternships   = (params) => api.get("/internships", { params });
export const getInternshipById  = (id)      => api.get(`/internships/${id}`);
export const getMyInternships   = (params)  => api.get("/internships/company/my-internships", { params });
export const createInternship   = (data)    => api.post("/internships", data);
export const updateInternship   = (id, data)=> api.put(`/internships/${id}`, data);
export const deleteInternship   = (id)      => api.delete(`/internships/${id}`);
