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
  getTournamentDetails: (tournamentId: string) => api.get(`/api/tournaments/${tournamentId}`),
  getLeaderboard: (tournamentId: string) => api.get(`/api/quiz/leaderboard/${tournamentId}`),
};

export const quizAPI = {
  startQuiz: (tournamentId: string) => api.post(`/api/quiz/${tournamentId}/start`),
  submitAnswer: (sessionId: string, questionIndex: number, answer: number, timeTaken: number = 5) => 
    api.post(`/api/quiz/${sessionId}/answer`, { 
      question_index: questionIndex, 
      answer, 
      time_taken: timeTaken 
    }),
  completeQuiz: (sessionId: string) => api.post(`/api/quiz/${sessionId}/complete`),
  getQuizResults: (sessionId: string) => api.get(`/api/quiz/${sessionId}/results`),
  reportViolation: (sessionId: string, type: string, timestamp: string) =>
    api.post(`/api/quiz/${sessionId}/report-violation`, { type, timestamp }),
};

export const paymentAPI = {
  createPaymentIntent: (tournamentId: string, amount: number = 39) => 
    api.post('/api/payments/create-payment-intent', { tournament_id: tournamentId, amount }),
  confirmPayment: (paymentIntentId: string) => 
    api.post('/api/payments/confirm-payment', { payment_intent_id: paymentIntentId }),
  getUserPayments: () => api.get('/api/payments/user-payments'),
  addFunds: (amount: number) => api.post('/api/payments/add-funds', { amount }),
  confirmWalletTopup: (paymentIntentId: string) =>
    api.post('/api/payments/confirm-wallet-topup', { payment_intent_id: paymentIntentId }),
  getWalletTransactions: () => api.get('/api/payments/wallet-transactions'),
};

export const adminAPI = {
  // User Management
  getUsers: () => api.get('/api/admin/users'),
  getUserReports: () => api.get('/api/admin/reports/users'),
  updateUserKYC: (userId: string, status: string) => 
    api.put(`/api/admin/users/${userId}/kyc`, { status }),
  
  // Question Management
  getQuestions: () => api.get('/api/admin/questions'),
  createQuestion: (data: any) => api.post('/api/admin/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/api/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/api/admin/questions/${id}`),
  
  // Tournament Management
  createTournament: (data: any) => api.post('/api/admin/tournaments', data),
  updateTournament: (id: string, data: any) => api.put(`/api/admin/tournaments/${id}`, data),
  getTournamentReports: () => api.get('/api/admin/reports/tournaments'),
  
  // Dashboard Stats
  getDashboardStats: () => api.get('/api/admin/dashboard/stats'),
};

export const statsAPI = {
  getRealtimeStats: () => api.get('/api/stats/realtime'),
};

// WebSocket class for real-time communication
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Function[]> = new Map();
  private userId: string | null = null;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  connect(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';
    this.ws = new WebSocket(`${wsUrl}/api/ws/${userId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type || 'message', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error });
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  send(type: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.userId!);
      }, this.reconnectInterval);
    }
  }

  // Tournament-specific methods
  joinTournamentRoom(tournamentId: string) {
    this.send('join_tournament', { tournament_id: tournamentId });
  }

  leaveTournamentRoom(tournamentId: string) {
    this.send('leave_tournament', { tournament_id: tournamentId });
  }

  ping() {
    this.send('ping');
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

export default api;