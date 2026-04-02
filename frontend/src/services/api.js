import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Surveys
export const getSurveys = () => api.get('/surveys');
export const getSurvey = (id) => api.get(`/surveys/${id}`);
export const createSurvey = (data) => api.post('/surveys', data);
export const updateSurvey = (id, data) => api.put(`/surveys/${id}`, data);
export const deleteSurvey = (id) => api.delete(`/surveys/${id}`);
export const publishSurvey = (id) => api.patch(`/surveys/${id}/publish`);
export const getSurveyResults = (id) => api.get(`/surveys/${id}/results`);

// Responses
export const submitResponse = (data) => api.post('/responses', data);
export const getSurveyResponses = (surveyId) => api.get(`/responses/survey/${surveyId}`);

export default api;
