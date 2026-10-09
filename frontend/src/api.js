const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api');

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cricket_vault_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'An error occurred. Please try again.';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (playerData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(playerData) }),
  getMe: () => apiFetch('/auth/me'),

  // Profile Photo Uploads
  uploadPhotoFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/upload/photo', { method: 'POST', body: formData });
  },
  uploadPhotoBase64: (photoData) =>
    apiFetch('/upload/photo-base64', { method: 'POST', body: JSON.stringify({ photo_data: photoData }) }),
  removePhoto: () => apiFetch('/upload/photo', { method: 'DELETE' }),

  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  markNotificationsRead: () => apiFetch('/notifications/read-all', { method: 'POST' }),

  // Admin
  getAdminStats: () => apiFetch('/admin/stats'),
  getRevenueTrend: () => apiFetch('/admin/revenue-trend'),
  getRevenueMix: () => apiFetch('/admin/revenue-mix'),
  getAdminPlayers: () => apiFetch('/admin/players'),
  createAdminPlayer: (data) => apiFetch('/admin/players', { method: 'POST', body: JSON.stringify(data) }),
  togglePlayerStatus: (id) => apiFetch(`/admin/players/${id}/status`, { method: 'PATCH' }),
  getAdminCoaches: () => apiFetch('/admin/coaches'),
  createAdminCoach: (data) => apiFetch('/admin/coaches', { method: 'POST', body: JSON.stringify(data) }),
  getAdminReviews: () => apiFetch('/admin/reviews'),
  assignCoach: (reviewId, coachId) =>
    apiFetch(`/admin/reviews/${reviewId}/assign`, { method: 'PATCH', body: JSON.stringify({ coach_id: coachId }) }),
  getAdminSubscriptions: () => apiFetch('/admin/subscriptions'),
  getAdminPayments: () => apiFetch('/admin/payments'),
  getAdminEbooks: () => apiFetch('/admin/ebooks'),

  // Coach
  getCoachStats: () => apiFetch('/coach/stats'),
  getCoachReviews: (status) => apiFetch(`/coach/reviews${status ? `?status=${status}` : ''}`),
  getCoachReviewDetail: (id) => apiFetch(`/coach/reviews/${id}`),
  startCoachReview: (id) => apiFetch(`/coach/reviews/${id}/start`, { method: 'POST' }),
  saveCoachDraft: (id, feedback) =>
    apiFetch(`/coach/reviews/${id}/draft`, { method: 'PUT', body: JSON.stringify({ feedback }) }),
  submitCoachReview: (id, feedback) =>
    apiFetch(`/coach/reviews/${id}/submit`, { method: 'POST', body: JSON.stringify({ feedback }) }),
  getCoachEarnings: () => apiFetch('/coach/earnings'),
  getCoachRatings: () => apiFetch('/coach/ratings'),
  getCoachProfile: () => apiFetch('/coach/profile'),
  updateCoachProfile: (data) => apiFetch('/coach/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getCoachThreads: () => apiFetch('/coach/threads'),
  getCoachThreadMessages: (threadId) => apiFetch(`/coach/threads/${threadId}/messages`),
  sendCoachMessage: (threadId, body) =>
    apiFetch(`/coach/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  // Coach Announcements
  getCoachAnnouncements: () => apiFetch('/coach/announcements'),
  createCoachAnnouncement: (data) =>
    apiFetch('/coach/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateCoachAnnouncement: (id, data) =>
    apiFetch(`/coach/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoachAnnouncement: (id) =>
    apiFetch(`/coach/announcements/${id}`, { method: 'DELETE' }),
  togglePublishAnnouncement: (id) =>
    apiFetch(`/coach/announcements/${id}/publish`, { method: 'POST' }),
  getAnnouncementRecipients: () => apiFetch('/coach/announcement-recipients'),

  // Player
  getPlayerOverview: () => apiFetch('/player/overview'),
  getPlayerReviews: () => apiFetch('/player/reviews'),
  getPlayerReviewDetail: (id) => apiFetch(`/player/reviews/${id}`),
  submitPlayerReview: (data) => apiFetch('/player/reviews', { method: 'POST', body: JSON.stringify(data) }),
  rateReview: (id, rating, comment) =>
    apiFetch(`/player/reviews/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, rating_comment: comment }) }),
  getPlayerSubscription: () => apiFetch('/player/subscription'),
  getPlayerPlans: () => apiFetch('/player/plans'),
  getPlayerEbooks: () => apiFetch('/player/ebooks'),
  getPlayerLibrary: () => apiFetch('/player/library'),
  getPlayerProfile: () => apiFetch('/player/profile'),
  updatePlayerProfile: (data) => apiFetch('/player/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getPlayerThreads: () => apiFetch('/player/threads'),
  startPlayerThread: (coachId) =>
    apiFetch('/player/threads/start', { method: 'POST', body: JSON.stringify({ coach_id: coachId }) }),
  getPlayerThreadMessages: (threadId) => apiFetch(`/player/threads/${threadId}/messages`),
  sendPlayerMessage: (threadId, body) =>
    apiFetch(`/player/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  // Player Announcements
  getPlayerAnnouncements: () => apiFetch('/player/announcements'),
  markAnnouncementRead: (id) =>
    apiFetch(`/player/announcements/${id}/read`, { method: 'POST' }),
  markAllAnnouncementsRead: () =>
    apiFetch('/player/announcements/read-all', { method: 'POST' }),

  // Payments
  createOrder: (type, itemId) =>
    apiFetch('/payments/create-order', { method: 'POST', body: JSON.stringify({ type, item_id: itemId }) }),
  testAuthorizePayment: (orderId) =>
    apiFetch('/payments/test-authorize', { method: 'POST', body: JSON.stringify({ order_id: orderId }) }),
  verifyPayment: (data) => apiFetch('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Coach Directory & Academy Integration
  getCoachesDirectory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/coaches/directory${query ? `?${query}` : ''}`);
  },
  getCoachDirectoryDetail: (coachId) => apiFetch(`/coaches/directory/${coachId}`),
};
