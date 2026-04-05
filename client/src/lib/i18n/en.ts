export type Translations = {
  lang: string;
  cordiallyInvited: string;
  rsvpButton: string;
  scrollDown: string;
  scrollCta: string;
  scrollToRsvp: string;
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
  guestCountHint: string;
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
  // Loading / error states
  loadingInvitation: string;
  invitationNotFound: string;
  invitationNotFoundSub: string;
  invitationExpired: string;
  // EventPage — public page CTA
  learnMore: string;
  // EventPage — RSVP notice (no personal link)
  personalInviteRequired: string;
  personalInviteRequiredSub: string;
  personalLinkHint: string;
  // HomePage
  chooseCity: string;
  viewInvitation: string;
  // CountdownTimer completion
  celebrationBegun: string;
  // Footer
  madeWithLove: string;
  // EventPage / InvitePage — garden additions
  countingDown: string;
  untilTheDay: string;
  personalInvitationFor: string;
  youveBeenInvited: string;
  pleaseRegister: string;
  invitationAlreadyClaimed: string;
  invitationAlreadyClaimedSub: string;
  // RSVPForm — name editing toggle
  editName: string;
  lockName: string;
  // HomePage — hardcoded strings now translated
  writtenInBlooms: string;
  coupleQuote: string;
  joinUsInGarden: string;
  foreverAndAlways: string;
  // RSVPForm — section labels
  whosComing: string;
  aNoteToUs: string;
  // Partner name field
  partnerNameLabel: string;
  partnerNamePlaceholder: string;
  // Short form labels (used in open/public RSVP forms)
  guestsShortLabel: string;
  attendanceShortLabel: string;
  phoneLabel: string;
  phoneHint: string;
  // Navigation
  chapter: string;
  returnToHomepage: string;
  needHelp: string;
  // Toast messages
  rsvpReceived: string;
  submitFailed: string;
  registrationComplete: string;
  registerFailed: string;
  // Registration form
  confirmRegistration: string;
  registering: string;
  youreRegistered: string;
  thankYouRegistering: string;
  // Image alt text
  happyCoupleAlt: string;
  // RSVP form — partner dietary field
  partnerDietaryLabel: string;
  // Success screen — post-RSVP calendar CTA
  addToCalendar: string;
};

export const en: Translations = {
  lang: 'EN',

  // Hero
  cordiallyInvited: 'You are cordially invited to the wedding of',
  rsvpButton: 'Confirm Attendance',
  scrollDown: 'Scroll down to confirm',
  scrollCta: 'Discover our story',
  scrollToRsvp: 'Scroll down to confirm',

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
  rsvpHeading: 'Your Response',
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
  guestCountLabel: 'Number of guests',
  guestCountHint: 'Guest count includes the invitee',
  guestCountSingle: 'guest',
  guestCountPlural: 'guests',
  dietaryLabel: 'Dietary Restrictions',
  dietaryPlaceholder: 'e.g. Vegetarian, Gluten-free, Nut allergy',
  dietaryOptional: '(optional)',
  messageLabel: 'Message to the Happy Couple',
  messagePlaceholder: 'Share your well wishes or a personal note…',
  messageOptional: '(optional)',

  // RSVP form actions
  sendRsvp: 'Send Response',
  updateRsvp: 'Update Response',
  sending: 'Sending…',

  // Update banner
  rsvpFoundTitle: 'We found your response!',
  rsvpFoundSub: 'You can update your response below.',

  // Errors
  errorGeneric: 'Something went wrong. Please try again.',
  rsvpDeadlineHint: 'Please respond before the deadline.',

  // Success screen
  rsvpConfirmed: 'Confirmed!',
  rsvpUpdated: 'Updated!',
  attendingHeadline: "We can't wait to celebrate with you!",
  attendingSub: (count: number) =>
    `You've confirmed attendance for ${count} ${count === 1 ? 'guest' : 'guests'}. We'll be in touch with more details.`,
  declinedHeadline: 'We will miss you!',
  declinedSub: "Thank you for letting us know. We'll miss having you there to celebrate.",
  maybeHeadline: 'We hope you can make it!',
  maybeSub: "We've noted your tentative response. Please update your response once you know for sure.",
  defaultHeadline: 'Response Received!',
  defaultSub: 'Thank you for your response.',
  yourDetails: 'Your Details',
  detailName: 'Name',
  detailEvent: 'Event',
  detailDate: 'Date',
  updateRsvpLink: 'Need to update your response?',

  // Footer
  allRightsReserved: 'All rights reserved.',

  // Loading / error states
  loadingInvitation: 'Loading invitation…',
  invitationNotFound: 'Invitation Not Found',
  invitationNotFoundSub: 'This event page could not be loaded.',
  invitationExpired: 'This invitation link may have expired or is invalid.',

  // EventPage — public page CTA
  learnMore: 'Event Details',

  // EventPage — RSVP notice (no personal link)
  personalInviteRequired: 'Personal Invitation Required',
  personalInviteRequiredSub:
    'To confirm your attendance, please use the personal link included in your invitation. Each guest receives a unique personal link.',
  personalLinkHint: 'Your personal link was sent to you by SMS, WhatsApp, or printed card.',

  // HomePage
  chooseCity: 'Choose your wedding celebration',
  viewInvitation: 'View Invitation',

  // CountdownTimer completion
  celebrationBegun: 'The celebration has begun!',

  // Footer
  madeWithLove: 'Made with ♡ for Berfin & Shamsiddin',

  // EventPage / InvitePage — garden additions
  countingDown: 'Counting Down',
  untilTheDay: 'Until We Celebrate Together',
  personalInvitationFor: 'A Personal Invitation for',
  youveBeenInvited: "You've been invited",
  pleaseRegister: 'Please Register',
  invitationAlreadyClaimed: 'This invitation has already been claimed',
  invitationAlreadyClaimedSub: 'This link has already been used. If you believe this is an error, please contact the couple directly.',

  editName: 'Edit',
  lockName: 'Lock',

  writtenInBlooms: 'Written in blooms',
  coupleQuote: '"Two souls, one love, blooming together forever."',
  joinUsInGarden: 'Join us in the garden',
  foreverAndAlways: 'Forever & Always · 2026',

  whosComing: "Who's Coming",
  aNoteToUs: 'A Note to Us',
  partnerNameLabel: "Partner's Name",
  partnerNamePlaceholder: "Partner's full name",
  guestsShortLabel: 'Guests',
  attendanceShortLabel: 'Attendance',
  phoneLabel: 'Phone',
  phoneHint: 'So we can reach you with updates',
  chapter: 'Chapter',
  returnToHomepage: 'Return to homepage',
  needHelp: 'Need help? Contact us',
  rsvpReceived: 'Response received!',
  submitFailed: 'Failed to submit. Please try again.',
  registrationComplete: 'Registration complete!',
  registerFailed: 'Failed to register. Please try again.',
  confirmRegistration: 'Confirm Registration',
  registering: 'Registering…',
  youreRegistered: "You're registered!",
  thankYouRegistering: 'Thank you for registering. We look forward to celebrating with you.',
  happyCoupleAlt: 'The happy couple',
  partnerDietaryLabel: "Partner's Dietary Restrictions",
  addToCalendar: 'Add to Calendar',

};
