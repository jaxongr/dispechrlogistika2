import apiClient from './client';

// Bot Users
export const botUsersApi = {
  list: (params?: any) => apiClient.get('/api/bot-users', { params }),
  stats: () => apiClient.get('/api/bot-users/stats'),
  getById: (id: number) => apiClient.get(`/api/bot-users/${id}`),
  block: (telegramId: string) => apiClient.patch(`/api/bot-users/${telegramId}/block`),
  unblock: (telegramId: string) => apiClient.patch(`/api/bot-users/${telegramId}/unblock`),
};

// Subscriptions
export const subscriptionsApi = {
  stats: () => apiClient.get('/api/subscriptions/stats'),
  expiring: (days: number) => apiClient.get('/api/subscriptions/expiring', { params: { days } }),
};

// Payments
export const paymentsApi = {
  list: (params?: any) => apiClient.get('/api/payments', { params }),
  stats: () => apiClient.get('/api/payments/stats'),
};

// VIP
export const vipApi = {
  list: (params?: any) => apiClient.get('/api/vip', { params }),
  stats: () => apiClient.get('/api/vip/stats'),
};

// Health
export const healthApi = {
  check: () => apiClient.get('/health'),
};
