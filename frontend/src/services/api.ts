import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  googleLogin: (data: any) => api.post('/api/auth/google', data),
  getProfile: () => api.get('/api/user/profile'),
  updateKYC: (data: any) => api.put('/api/user/kyc', data),
};

export const tournamentAPI = {
  getAllTournaments: () => api.get('/api/tournaments'),
  joinTournament: (tournamentId: string) => api.post(`/api/tournaments/${tournamentId}/join`),
  getTournamentDetails: (tournamentId: string) => api.get(`/api/tournaments/${tournamentId}`),
};

export const quizAPI = {
  startQuiz: (tournamentId: string) => api.post(`/api/quiz/${tournamentId}/start`),
  submitAnswer: (sessionId: string, questionIndex: number, answer: number) => 
    api.post(`/api/quiz/${sessionId}/answer`, { question_index: questionIndex, answer }),
  getQuizResults: (sessionId: string) => api.get(`/api/quiz/${sessionId}/results`),
};

export const paymentAPI = {
  createPaymentIntent: (amount: number, tournamentId: string) => 
    api.post('/api/payments/create-intent', { amount, tournament_id: tournamentId }),
  confirmPayment: (paymentIntentId: string) => 
    api.post('/api/payments/confirm', { payment_intent_id: paymentIntentId }),
};

export const adminAPI = {
  getUsers: () => api.get('/api/admin/users'),
  getQuestions: () => api.get('/api/admin/questions'),
  createQuestion: (data: any) => api.post('/api/admin/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/api/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/api/admin/questions/${id}`),
  createTournament: (data: any) => api.post('/api/admin/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/api/admin/tournaments/${id}`, data),
  getTournamentReports: () => api.get('/api/admin/reports/tournaments'),
  getUserReports: () => api.get('/api/admin/reports/users'),
};

export default api;