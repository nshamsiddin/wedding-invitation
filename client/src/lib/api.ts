import axios from 'axios';
import type {
  EventData,
  AdminEvent,
  AdminGuest,
  AdminInvitation,
  AdminLoginValues,
  AddGuestValues,
  UpdateGuestContactValues,
  AddInvitationValues,
  UpdateInvitationValues,
  TokenLookupResponse,
  RSVPSubmitResponse,
} from '@invitation/shared';

export type {
  EventData,
  AdminEvent,
  AdminGuest,
  AdminInvitation,
  TokenLookupResponse,
  RSVPSubmitResponse,
};

export interface RSVPSubmitBody {
  token: string;
  status: 'attending' | 'declined' | 'maybe';
  guestCount?: number;
  dietary?: string;
  message?: string;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const rsvpApi = {
  getEvent: async (slug: string): Promise<EventData> => {
    const { data } = await api.get<EventData>(`/events/${slug}`);
    return data;
  },
  getByToken: async (token: string): Promise<TokenLookupResponse> => {
    const { data } = await api.get<TokenLookupResponse>(`/rsvp/token/${token}`);
    return data;
  },
  submit: async (body: RSVPSubmitBody): Promise<RSVPSubmitResponse> => {
    const { data } = await api.post<RSVPSubmitResponse>('/rsvp', body);
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
  getEvents: async (): Promise<AdminEvent[]> => {
    const { data } = await api.get<AdminEvent[]>('/admin/events');
    return data;
  },
  getGuests: async (params?: {
    eventId?: number;
    status?: string;
    search?: string;
  }): Promise<AdminGuest[]> => {
    const { data } = await api.get<AdminGuest[]>('/admin/guests', { params });
    return data;
  },
  addGuest: async (values: AddGuestValues): Promise<{ guest: AdminGuest; invitations: AdminInvitation[] }> => {
    const { data } = await api.post('/admin/guests', values);
    return data;
  },
  updateGuest: async (id: number, values: UpdateGuestContactValues): Promise<AdminGuest> => {
    const { data } = await api.put<AdminGuest>(`/admin/guests/${id}`, values);
    return data;
  },
  deleteGuest: async (id: number): Promise<void> => {
    await api.delete(`/admin/guests/${id}`);
  },
  addInvitation: async (values: AddInvitationValues): Promise<AdminInvitation> => {
    const { data } = await api.post<AdminInvitation>('/admin/invitations', values);
    return data;
  },
  updateInvitation: async (id: number, values: UpdateInvitationValues): Promise<AdminInvitation> => {
    const { data } = await api.put<AdminInvitation>(`/admin/invitations/${id}`, values);
    return data;
  },
  deleteInvitation: async (id: number): Promise<void> => {
    await api.delete(`/admin/invitations/${id}`);
  },
  getInviteLink: async (invitationId: number): Promise<string> => {
    const { data } = await api.get<{ url: string }>(`/admin/invitations/${invitationId}/link`);
    return data.url;
  },
  exportCSV: (eventId?: number): void => {
    const params = eventId ? `?eventId=${eventId}` : '';
    window.location.href = `/api/admin/export${params}`;
  },
};
