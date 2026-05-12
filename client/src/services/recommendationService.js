import api from "./api";

export const getRecommendations = () => api.get("/recommendations");
export const getExplanation     = (internshipId) => api.get(`/recommendations/explain/${internshipId}`);
