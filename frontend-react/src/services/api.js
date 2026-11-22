import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Don't attach token for login/register requests
  if (token && !config.url.startsWith('/auth/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', response.data.username);
  }
  return response.data;
};

export const processResumes = async (formData) => {
  const response = await api.post('/jobs/process-resumes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listJobs = async () => (await api.get('/jobs')).data;
export const listCandidates = async (jobId) => (await api.get(`/jobs/${jobId}/candidates`)).data;
export const updateCandidateStage = async (id, stage, reason) =>
  (await api.patch(`/candidates/${id}/stage`, { stage, reason })).data;
export const candidateHistory = async (id) => (await api.get(`/candidates/${id}/events`)).data;
export const createJob = async (job) => (await api.post('/jobs', job)).data;
export const publishJob = async (id) => (await api.patch(`/jobs/${id}/publish`)).data;
export const pauseJob = async (id) => (await api.patch(`/jobs/${id}/pause`)).data;
export const closeJob = async (id) => (await api.patch(`/jobs/${id}/close`)).data;
export const deleteJob = async (id) => (await api.delete(`/jobs/${id}`)).data;
export const unpublishJob = async (id) => (await api.patch(`/jobs/${id}/close`)).data;
export const publicJobs = async () => (await api.get('/public/jobs')).data;
export const applyForJob = async (id, formData) => (await api.post(`/public/jobs/${id}/apply`, formData)).data;
export const uploadResumesToJob = async (jobId, formData) => {
  const response = await api.post(`/jobs/${jobId}/screen-resumes`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
export const downloadResume = async (id) => (await api.get(`/candidates/${id}/resume`, { responseType: 'blob' })).data;

export default api;
