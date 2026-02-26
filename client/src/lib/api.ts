import axios from 'axios';
import type { RSVPFormValues, Guest, AdminLoginValues, AddGuestValues, UpdateGuestValues } from '@invitation/shared';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export interface RSVPCheckResponse {
  exists: boolean;
  guest?: Guest;
}

export interface RSVPSubmitResponse {
  guest: Guest;
  updated: boolean;
}

export interface StatsResponse {
  total: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
  totalHeadcount: number;
}

export const rsvpApi = {
  check: async (email: string): Promise<RSVPCheckResponse> => {
    const { data } = await api.get<RSVPCheckResponse>(`/rsvp/${encodeURIComponent(email)}`);
    return data;
  },
  submit: async (values: RSVPFormValues): Promise<RSVPSubmitResponse> => {
    const { data } = await api.post<RSVPSubmitResponse>('/rsvp', values);
    return data;
  },
};

export const adminApi = {
  login: async (values: AdminLoginValues): Promise<void> => {
    await api.post('/admin/login', values);
  },
  logout: async (): Promise<void> => {
    await api.post('/admin/logout');
  },
  checkAuth: async (): Promise<boolean> => {
    try {
      await api.get('/admin/me');
      return true;
    } catch {
      return false;
    }
  },
  getStats: async (): Promise<StatsResponse> => {
    const { data } = await api.get<StatsResponse>('/admin/stats');
    return data;
  },
  getGuests: async (params?: { status?: string; search?: string }): Promise<Guest[]> => {
    const { data } = await api.get<Guest[]>('/admin/guests', { params });
    return data;
  },
  addGuest: async (values: AddGuestValues): Promise<Guest> => {
    const { data } = await api.post<Guest>('/admin/guests', values);
    return data;
  },
  updateGuest: async (id: number, values: UpdateGuestValues): Promise<Guest> => {
    const { data } = await api.put<Guest>(`/admin/guests/${id}`, values);
    return data;
  },
  deleteGuest: async (id: number): Promise<void> => {
    await api.delete(`/admin/guests/${id}`);
  },
  exportCSV: (): void => {
    window.location.href = '/api/admin/export';
  },
};
