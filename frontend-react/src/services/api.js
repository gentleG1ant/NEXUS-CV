import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
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
export const publicJobs = async () => (await api.get('/public/jobs')).data;
export const applyForJob = async (id, formData) => (await api.post(`/public/jobs/${id}/apply`, formData)).data;
export const downloadResume = async (id) => (await api.get(`/candidates/${id}/resume`, { responseType: 'blob' })).data;

export default api;
