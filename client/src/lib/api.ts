import axios from 'axios';
import type {
  EventData,
  PartialEventData,
  AdminEvent,
  AdminGuest,
  AdminInvitation,
  OpenInvitation,
  AdminLoginValues,
  AddGuestValues,
  UpdateGuestContactValues,
  AddInvitationValues,
  UpdateInvitationValues,
  TokenLookupResponse,
  RSVPSubmitResponse,
  ClaimInvitationValues,
  ClaimInvitationResponse,
  CreateOpenInvitationValues,
  PublicRsvpValues,
  PublicPageRsvpValues,
  BulkAddGuestsValues,
  BulkAddGuestsResult,
} from '@invitation/shared';

export type {
  EventData,
  PartialEventData,
  AdminEvent,
  AdminGuest,
  AdminInvitation,
  OpenInvitation,
  TokenLookupResponse,
  RSVPSubmitResponse,
  ClaimInvitationResponse,
  BulkAddGuestsResult,
};

export interface RSVPSubmitBody {
  token: string;
  status: 'attending' | 'declined' | 'maybe';
  guestCount?: number;
  dietary?: string;
  partnerDietary?: string;
  message?: string;
  name?: string;
  partnerName?: string;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const rsvpApi = {
  getEvent: async (slug: string): Promise<EventData | PartialEventData> => {
    const { data } = await api.get<EventData | PartialEventData>(`/events/${slug}`);
    return data;
  },
  getByToken: async (token: string): Promise<TokenLookupResponse> => {
    try {
      const { data } = await api.get<TokenLookupResponse>(`/rsvp/token/${token}`);
      return data;
    } catch (err: unknown) {
      // HTTP 410 means the one-time link was already claimed. Surface this as
      // a successful response with type='claimed' so the UI can show a helpful
      // message rather than a generic error screen.
      if (
        typeof err === 'object' && err !== null &&
        'response' in err &&
        typeof (err as { response?: { status?: number; data?: unknown } }).response === 'object'
      ) {
        const response = (err as { response: { status: number; data: unknown } }).response;
        if (response.status === 410 && typeof response.data === 'object' && response.data !== null) {
          return response.data as TokenLookupResponse;
        }
      }
      throw err;
    }
  },
  submit: async (body: RSVPSubmitBody): Promise<RSVPSubmitResponse> => {
    const { data } = await api.post<RSVPSubmitResponse>('/rsvp', body);
    return data;
  },
  claim: async (values: ClaimInvitationValues): Promise<ClaimInvitationResponse> => {
    const { data } = await api.post<ClaimInvitationResponse>('/rsvp/claim', values);
    return data;
  },
  submitPublic: async (values: PublicRsvpValues): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/rsvp/public', values);
    return data;
  },
  submitPublicPage: async (values: PublicPageRsvpValues): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/rsvp/public-page', values);
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
    page?: number;
    limit?: number;
  }): Promise<{ guests: AdminGuest[]; total: number; page: number; limit: number }> => {
    const { data } = await api.get<{ guests: AdminGuest[]; total: number; page: number; limit: number }>('/admin/guests', { params });
    return data;
  },
  addGuest: async (values: AddGuestValues): Promise<{ guest: AdminGuest; invitations: AdminInvitation[] }> => {
    const { data } = await api.post('/admin/guests', values);
    return data;
  },
  // Use PATCH for partial updates; PUT is still supported on the server for backward compat.
  updateGuest: async (id: number, values: UpdateGuestContactValues): Promise<AdminGuest> => {
    const { data } = await api.patch<AdminGuest>(`/admin/guests/${id}`, values);
    return data;
  },
  deleteGuest: async (id: number): Promise<void> => {
    await api.delete(`/admin/guests/${id}`);
  },
  addInvitation: async (values: AddInvitationValues): Promise<AdminInvitation> => {
    const { data } = await api.post<AdminInvitation>('/admin/invitations', values);
    return data;
  },
  // Use PATCH for partial updates; PUT is still supported on the server for backward compat.
  updateInvitation: async (id: number, values: UpdateInvitationValues): Promise<AdminInvitation> => {
    const { data } = await api.patch<AdminInvitation>(`/admin/invitations/${id}`, values);
    return data;
  },
  deleteInvitation: async (id: number): Promise<void> => {
    await api.delete(`/admin/invitations/${id}`);
  },
  getInviteLink: async (invitationId: number): Promise<string> => {
    const { data } = await api.get<{ url: string }>(`/admin/invitations/${invitationId}/link`);
    return data.url;
  },
  createOpenInvitation: async (values: CreateOpenInvitationValues): Promise<OpenInvitation[]> => {
    const { data } = await api.post<OpenInvitation[]>('/admin/invitations/open', values);
    return data;
  },
  getOpenInvitations: async (): Promise<OpenInvitation[]> => {
    const { data } = await api.get<OpenInvitation[]>('/admin/invitations/open');
    return data;
  },
  bulkAddGuests: async (values: BulkAddGuestsValues): Promise<BulkAddGuestsResult> => {
    const { data } = await api.post<BulkAddGuestsResult>('/admin/guests/bulk', values);
    return data;
  },
  exportCSV: (eventId?: number): void => {
    const params = eventId ? `?eventId=${eventId}` : '';
    window.location.href = `/api/admin/export${params}`;
  },
  exportEventTablesCSV: (eventId?: number): void => {
    const params = eventId ? `?eventId=${eventId}` : '';
    window.location.href = `/api/admin/export/event-tables${params}`;
  },
};

export interface AdminNotification {
  id: number;
  type: 'rsvp_new' | 'rsvp_updated';
  guestName: string;
  eventSlug: string;
  eventName: string;
  status: 'attending' | 'declined' | 'maybe' | 'pending';
  guestCount: number;
  message: string | null;
  invitationId: number;
  guestId: number | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: async (params?: {
    unread?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: AdminNotification[]; total: number; page: number; limit: number }> => {
    const { data } = await api.get('/admin/notifications', { params });
    return data;
  },
  getUnreadCount: async (): Promise<{ count: number }> => {
    const { data } = await api.get<{ count: number }>('/admin/notifications/unread-count');
    return data;
  },
  markRead: async (id: number): Promise<void> => {
    await api.patch(`/admin/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.patch('/admin/notifications/read-all');
  },
};

export const configApi = {
  getConfig: async (): Promise<{ baseUrl: string }> => {
    const { data } = await api.get<{ baseUrl: string }>('/config');
    return data;
  },
};
