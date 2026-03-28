import type { Page } from '@playwright/test';

// ─── Shared test data ─────────────────────────────────────────────────────────

export const MOCK_EVENTS = [
  {
    id: 1,
    slug: 'ankara',
    name: 'Ankara',
    date: '2026-05-19T12:00:00.000Z',
    venue: "Park L'Amore",
    stats: { total: 10, attending: 6, declined: 2, maybe: 1, pending: 1, totalHeadcount: 8 },
  },
  {
    id: 2,
    slug: 'tashkent',
    name: 'Tashkent',
    date: '2026-04-24T12:00:00.000Z',
    venue: 'Ofarin Restaurant',
    stats: { total: 8, attending: 5, declined: 1, maybe: 1, pending: 1, totalHeadcount: 7 },
  },
];

export const MOCK_GUESTS = [
  {
    id: 1,
    name: 'Alice Smith',
    partnerName: 'Bob Smith',
    phone: '+1234567890',
    createdAt: '2026-01-15T10:00:00.000Z',
    invitations: [
      {
        id: 101,
        eventId: 1,
        eventSlug: 'ankara',
        eventName: 'Ankara',
        token: 'tok-alice-ankara',
        status: 'attending',
        guestCount: 2,
        tableNumber: 3,
        dietaryRestrictions: null,
        partnerDietary: null,
        language: 'en',
        note: null,
        message: null,
      },
    ],
  },
  {
    id: 2,
    name: 'Charlie Doe',
    partnerName: null,
    phone: null,
    createdAt: '2026-02-01T09:00:00.000Z',
    invitations: [
      {
        id: 102,
        eventId: 2,
        eventSlug: 'tashkent',
        eventName: 'Tashkent',
        token: 'tok-charlie-tashkent',
        status: 'pending',
        guestCount: 1,
        tableNumber: null,
        dietaryRestrictions: null,
        partnerDietary: null,
        language: 'uz',
        note: null,
        message: null,
      },
    ],
  },
];

// Must match PersonalTokenLookupResponse from shared/src/schemas.ts
export const MOCK_RSVP_TOKEN_RESPONSE = {
  type: 'personal' as const,
  guest: { id: 1, name: 'Alice Smith', partnerName: 'Bob Smith' },
  invitation: {
    id: 101,
    token: 'tok-alice-ankara',
    status: 'pending' as const,
    guestCount: 1,
    dietary: null,
    partnerDietary: null,
    message: null,
    tableNumber: null,
    language: 'en' as const,
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  event: {
    id: 1,
    slug: 'ankara',
    name: 'Ankara',
    date: '2026-05-19',
    time: '14:00',
    venueName: "Park L'Amore",
    venueAddress: 'Ankara, Turkey',
    dressCode: null,
    mapsUrl: null,
  },
};

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/** Mock all admin API endpoints so tests run without a backend. */
export async function mockAdminApi(page: Page) {
  // Auth check — return 200 so the app treats us as logged in
  await page.route('**/api/admin/me', (route) =>
    route.fulfill({ json: { id: 1, username: 'admin' } }),
  );

  await page.route('**/api/admin/events', (route) =>
    route.fulfill({ json: MOCK_EVENTS }),
  );

  await page.route('**/api/admin/guests**', (route) =>
    route.fulfill({
      json: { guests: MOCK_GUESTS, total: MOCK_GUESTS.length, page: 1, limit: 50 },
    }),
  );
}

/** Mock the RSVP token lookup endpoint. */
export async function mockRsvpToken(page: Page, token = 'tok-alice-ankara') {
  await page.route(`**/api/rsvp/token/${token}`, (route) =>
    route.fulfill({ json: MOCK_RSVP_TOKEN_RESPONSE }),
  );
}

/** Mock the public RSVP events endpoint. */
export async function mockPublicEvents(page: Page) {
  await page.route('**/api/rsvp/public-page', (route) =>
    route.fulfill({
      json: [
        {
          slug: 'ankara',
          name: 'Ankara',
          date: '2026-05-19T12:00:00.000Z',
          venue: "Park L'Amore",
        },
      ],
    }),
  );
}
