import axios from 'axios';

const api = axios.create({ baseURL: (import.meta as any).env?.VITE_API_URL || '/api' });

export const getDashboard = () => api.get('/dashboard').then((r) => r.data);
export const getBookings = () => api.get('/bookings').then((r) => r.data);
export const getBooking = (id: string) => api.get(`/bookings/${id}`).then((r) => r.data);
export const createBooking = (data: object) => api.post('/bookings', data).then((r) => r.data);
export const deleteBooking = (id: string) => api.delete(`/bookings/${id}`).then((r) => r.data);

export const getActivities = (bookingId?: string) =>
  api.get('/activities', { params: bookingId ? { bookingId } : {} }).then((r) => r.data);
export const confirmActivity = (id: string) => api.patch(`/activities/${id}/confirm`).then((r) => r.data);
export const completeActivity = (id: string) => api.patch(`/activities/${id}/complete`).then((r) => r.data);
export const rejectActivity = (id: string, newStartDate: string) =>
  api.patch(`/activities/${id}/reject`, { newStartDate }).then((r) => r.data);

export const getTeams = () => api.get('/teams').then((r) => r.data);
export const createTeam = (data: { name: string; workerCount: number }) => api.post('/teams', data).then((r) => r.data);
export const updateTeam = (id: string, data: { name: string; workerCount: number }) => api.put(`/teams/${id}`, data).then((r) => r.data);
export const getCropTemplates = () => api.get('/crops').then((r) => r.data);

export default api;
