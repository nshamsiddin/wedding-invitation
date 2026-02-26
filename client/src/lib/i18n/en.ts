export type Translations = {
  lang: string;
  cordiallyInvited: string;
  rsvpButton: string;
  scrollDown: string;
  aboutEvent: string;
  eventSubheading: string;
  venue: string;
  date: string;
  time: string;
  dressCode: string;
  rsvpDeadline: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  kindlyReply: string;
  rsvpHeading: string;
  rsvpDeadlineNote: string;
  emailLabel: string;
  emailPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  attendanceLabel: string;
  attendingOption: string;
  decliningOption: string;
  maybeOption: string;
  guestCountLabel: string;
  guestCountSingle: string;
  guestCountPlural: string;
  dietaryLabel: string;
  dietaryPlaceholder: string;
  dietaryOptional: string;
  messageLabel: string;
  messagePlaceholder: string;
  messageOptional: string;
  sendRsvp: string;
  updateRsvp: string;
  sending: string;
  rsvpFoundTitle: string;
  rsvpFoundSub: string;
  errorGeneric: string;
  rsvpDeadlineHint: string;
  rsvpConfirmed: string;
  rsvpUpdated: string;
  attendingHeadline: string;
  attendingSub: (count: number) => string;
  declinedHeadline: string;
  declinedSub: string;
  maybeHeadline: string;
  maybeSub: string;
  defaultHeadline: string;
  defaultSub: string;
  yourDetails: string;
  detailName: string;
  detailEvent: string;
  detailDate: string;
  updateRsvpLink: string;
  allRightsReserved: string;
};

export const en: Translations = {
  lang: 'EN',

  // Hero
  cordiallyInvited: 'You are cordially invited to the wedding of',
  rsvpButton: 'RSVP',
  scrollDown: 'Scroll to RSVP',

  // Event details section
  aboutEvent: 'The Celebration',
  eventSubheading: 'An Enchanted Evening',
  venue: 'Venue',
  date: 'Date',
  time: 'Time',
  dressCode: 'Dress Code',
  rsvpDeadline: 'Kindly Reply By',

  // Countdown
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',

  // RSVP section
  kindlyReply: 'Kindly Reply',
  rsvpHeading: 'RSVP',
  rsvpDeadlineNote: 'Please respond by',

  // RSVP form fields
  emailLabel: 'Email Address',
  emailPlaceholder: 'your@email.com',
  nameLabel: 'Full Name',
  namePlaceholder: 'Your full name',
  attendanceLabel: 'Will you be attending?',
  attendingOption: 'Attending',
  decliningOption: 'Declining',
  maybeOption: 'Maybe',
  guestCountLabel: 'Number of guests (including yourself)',
  guestCountSingle: 'guest',
  guestCountPlural: 'guests',
  dietaryLabel: 'Dietary Restrictions',
  dietaryPlaceholder: 'e.g. Vegetarian, Gluten-free, Nut allergy',
  dietaryOptional: '(optional)',
  messageLabel: 'Message to the Happy Couple',
  messagePlaceholder: 'Share your well wishes or a personal note…',
  messageOptional: '(optional)',

  // RSVP form actions
  sendRsvp: 'Send RSVP',
  updateRsvp: 'Update RSVP',
  sending: 'Sending…',

  // Update banner
  rsvpFoundTitle: 'We found your RSVP!',
  rsvpFoundSub: 'You can update your response below.',

  // Errors
  errorGeneric: 'Something went wrong. Please try again.',
  rsvpDeadlineHint: 'Please respond before the deadline.',

  // Success screen
  rsvpConfirmed: 'RSVP Confirmed',
  rsvpUpdated: 'RSVP Updated',
  attendingHeadline: "We can't wait to celebrate with you!",
  attendingSub: (count: number) =>
    `You've confirmed attendance for ${count} ${count === 1 ? 'guest' : 'guests'}. We'll be in touch with more details.`,
  declinedHeadline: 'We will miss you!',
  declinedSub: "Thank you for letting us know. We'll miss having you there to celebrate.",
  maybeHeadline: 'We hope you can make it!',
  maybeSub: "We've noted your tentative response. Please update your RSVP once you know for sure.",
  defaultHeadline: 'RSVP Received!',
  defaultSub: 'Thank you for your response.',
  yourDetails: 'Your Details',
  detailName: 'Name',
  detailEvent: 'Event',
  detailDate: 'Date',
  updateRsvpLink: 'Need to update your RSVP?',

  // Footer
  allRightsReserved: 'All rights reserved.',
};
