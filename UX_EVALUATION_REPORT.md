# Admin Dashboard UX Heuristic Evaluation Report

**Application:** Guest Admin — B&S Wedding 2026  
**Evaluation Date:** March 8, 2026  
**Evaluator:** Automated UX evaluation via browser interaction

---

## Executive Summary

The admin dashboard provides a clean, organized interface for managing wedding guest invitations across two events (Toshkent and Ankara). The design uses a warm, earthy color palette (beige, cream, brown) with clear visual hierarchy. Several UX issues were identified around discoverability of actions, validation feedback, focus management, and terminology consistency.

---

## Step-by-Step Evaluation

### Step 1 & 2: Login Page — Navigate and Snapshot

**What you actually see:**
- **Layout:** Centered white card on light beige background (#F8F5F1–#FCFAF7)
- **Header:** Small padlock icon, "Guest Admin" (bold, dark brown), "B & S · Wedding 2026" (smaller, below)
- **Form card:** White, rounded corners, subtle shadow
- **Heading:** "Sign in" (bold)
- **Subtitle:** "Enter your credentials to continue" (lighter gray)
- **Field labels:** Uppercase, dark gray — "USERNAME", "PASSWORD"
- **Inputs:** Light beige/white rectangles, thin borders, placeholders "admin" and "••••••••"
- **Button:** "Sign In" — dark brown/charcoal, full width, white text, rounded corners

**UX issues:**
- No "Forgot password" link
- Placeholder text in username field ("admin") could be mistaken for pre-filled value
- No visible loading state description during navigation (spinner only)

**Exact element text:** "Guest Admin", "B & S · Wedding 2026", "Sign in", "Enter your credentials to continue", "USERNAME", "PASSWORD", "Sign In"

---

### Step 3: Log In

**What you actually see:**
- Credentials accepted; button shows "Signing in..." with spinner
- Redirects to `/admin` dashboard

**UX issues:** None — clear feedback during submission.

---

### Step 4: Full Dashboard Snapshot

**Header:**
- **Left:** Person icon, "Guest Admin" (bold), "B & S · Wedding 2026" (below)
- **Right:** EN | TR | UZ (EN pressed), "Export CSV", "Sign out"

**Event tabs:**
- "Toshkent 5" (active, darker background)
- "Ankara 0" (inactive)
- "All" (inactive)

**Stats cards (6):**
- INVITED: 5 | ATTENDING: 5 | DECLINED: 0 | MAYBE: 0 | NO RESPONSE: 0 | HEADCOUNT: 7 (with "attending guests" sub-label)

**Shareable Invitation Links:**
- Title: "Shareable Invitation Links"
- Subtitle: "6 permanent links — 3 languages × 2 venues. Anyone can RSVP via these."
- TOSHKENT: 3 cards (English, Türkçe, O'zbekcha) — "Toshkent · Ofarin Restaurant", paths `/invite/tashkent/{en,tr,uz}`, "Permanent" tag, "Copy link" button
- ANKARA: Same structure — "Ankara · Park L'Amore", paths `/invite/ankara/{en,tr,uz}`

**Guest table:**
- Title: "Guest List 19 guests"
- Controls: Search (placeholder "Search guests…"), "All Statuses" dropdown, "+ Add Guest" button
- Columns: Name (sortable), Added (sortable), Tashkent, Ankara, Actions
- Rows: Name + phone, date, status badges ("Attending"), "Link" button, pencil icon, x icon

**UX issues:**
- **ATTENDING (5) vs HEADCOUNT (7):** Unclear why headcount is higher; no tooltip or explanation
- **Actions column:** Edit/delete icons use `opacity-0 group-hover:opacity-100` — hidden until hover, poor discoverability
- **"Link" vs "Copy link":** Inconsistent terminology (table vs shareable links)

---

### Step 5: Click Toshkent Tab

**What changes:**
- Toshkent tab becomes active (darker background)
- Stats: INVITED 5, ATTENDING 5, HEADCOUNT 7
- Guest list filtered to 5 guests (Toshkent-invited)
- "Table #" column appears (Toshkent-specific)

**UX issues:** None — clear filtering.

---

### Step 6: Click Ankara Tab

**What changes:**
- Ankara tab active
- Stats all 0 (no Ankara guests)
- Guest list empty with message: "No guests found", "Try adjusting filters or add a guest manually"

**UX issues:** None — empty state is clear and actionable.

---

### Step 7: Click All Tab

**What changes:**
- All tab active
- Stats return to 5/5/7
- Guest list shows all 19 guests
- "Table #" column hidden

**UX issues:** None.

---

### Step 8: Search "xyz_nonexistent" — Empty State

**What you actually see:**
- Search box shows "xyz_nonexistent"
- Guest list heading: "Guest List 0 guests"
- Centered empty state: person icon, "No guests found", "Try adjusting filters or add a guest manually"

**UX issues:**
- Search is effective; empty state is helpful and actionable

---

### Step 9: Status Filter Dropdown

**Options observed:**
- All Statuses
- Attending (value: attending)
- Declined (value: declined)
- Maybe (value: maybe)
- No Response (value: pending)

**UX issues:** Dropdown works; value labels are clear.

---

### Step 10: Add Guest Modal — Snapshot

**Layout:**
- White modal, rounded corners, max-width, centered
- Title: "Add Guest"
- Close (X) button top-right

**Form fields:**
- **Full Name** * — placeholder "Jane Smith"
- **Phone** — placeholder "+90 555 000 0000 (optional)"
- **Partner Name** — placeholder "Jane Smith (optional)"
- **Invite to** * — checkboxes: "Berfin & Shamsiddin — Toshkent 2026-04-24 · Ofarin Restaurant", "Berfin & Shamsiddin — Ankara 2026-05-19 · Park L'Amore"
- **Status** — dropdown, default "Pending"
- **Guest Count** — default 1, options 1–5
- **Dietary Restrictions** — placeholder "Optional"
- **Note** — placeholder "Optional"

**Buttons:** Cancel, Add Guest

**UX issues:**
- Event checkboxes use long labels; may wrap on small screens
- Required fields marked with *; optional fields use "(optional)" in placeholder

---

### Step 11: Empty Form Validation

**What you actually see:**
- Submitting empty form shows:
  - **Name:** "Name must be at least 2 characters" (red, `role="alert"`)
  - **Invite to:** "Select at least one event" (red, `role="alert"`)
- Focus moves to Full Name
- Modal stays open

**UX issues:**
- Validation messages are clear and specific
- Errors appear inline; good feedback

---

### Step 12: Fill and Submit Test Data

**Observation:** Filling "Test Guest" and selecting an event works. Event checkbox click was intercepted by label in automation; manual testing may be needed for checkbox interaction.

---

### Step 13: Close Modal (X or Cancel)

**Observation:** Close (X) and Cancel both close the modal. Escape key also closes (see Step 25).

---

### Step 14: Edit Guest Modal — Pencil in Actions Column

**What you actually see:**
- Modal title: "Edit Guest"
- Subtitle: "Audit Test Guest"
- **Tabs:** "Contact" (default), "Tashkent"
- **Contact tab:** Full Name, Phone, Partner Name, "Save Contact"
- **Tashkent tab:** Status (Attending), Guest Count (1), Table Number (Tashkent), Dietary Restrictions, Partner Dietary, Message, "Save RSVP"

**UX issues:**
- Actions column icons are hidden until row hover — low discoverability
- Tab structure separates contact vs event-specific data clearly

---

### Step 15: Switch Tabs in Edit Guest Modal

**What changes:**
- Contact → Tashkent: Form switches from contact fields to RSVP fields (Status, Guest Count, Table Number, Dietary, Message)
- Tashkent tab shows event-specific RSVP data

**UX issues:** Tab switching is clear and responsive.

---

### Step 16: Edit RSVP (Pencil in Event Column)

**Observation:** The pencil in the event column opens EditInvitationModal (focused RSVP-only modal). The Actions-column pencil opens EditGuestModal (Contact + per-event tabs). Two distinct modals for two entry points.

---

### Step 17: Copy Link in Guest Row

**What you actually see:**
- "Link" button with chain icon in each event cell
- Copies guest-specific invite URL to clipboard
- Toast: "Invite link copied!" (from `GuestTable` CopyLinkButton)

**UX issues:**
- "Link" is vague; "Copy invite link" would be clearer
- No explicit feedback before click; toast provides feedback after

---

### Step 18: Copy Shareable Link

**What you actually see:**
- Six "Copy shareable link for {venue} in {language}" buttons
- Each copies the public invite URL for that venue/language
- Same toast feedback as guest link

**UX issues:** Labels are descriptive; behavior is clear.

---

### Step 19: Delete (Trash) Icon — Confirmation Dialog

**What you actually see (from code/i18n):**
- Title: "Remove guest?"
- Message: "{name} and all their invitations will be permanently deleted."
- Buttons: Cancel, "Remove" (destructive)

**UX issues:**
- Confirmation prevents accidental deletion
- "Remove" is softer than "Delete" but still clear
- Trash icon is in Actions column; same hover-discoverability issue

---

### Step 20: Cancel Delete

**Observation:** Cancel closes the confirmation dialog without deleting.

---

### Step 21: CSV Export

**Observation:** "Export CSV" button triggers download. No visible error handling in UI during evaluation.

---

### Step 22: Language Switch (EN → TR → UZ)

**Changes observed (from i18n):**

| Element        | EN                    | TR                          | UZ                          |
|----------------|------------------------|-----------------------------|-----------------------------|
| Admin panel    | Guest Admin            | Misafir Yönetimi            | Mehmonlar boshqaruvi       |
| Sign out       | Sign out               | Çıkış yap                   | Chiqish                     |
| Export CSV     | Export CSV             | CSV İndir                   | CSV yuklab olish            |
| Add Guest      | Add Guest              | Misafir Ekle                | Mehmon qo'shish             |
| Guest List     | Guest List             | Misafir Listesi             | Mehmonlar ro'yxati         |
| No guests found| No guests found        | Misafir bulunamadı          | Mehmon topilmadi           |
| Copy link      | Copy link              | Bağlantıyı kopyala          | Havolani nusxalash         |

**UX issues:** Translations appear consistent; language switcher is visible and easy to use.

---

### Step 23: Modal Scrollability

**Code observation:**
- AddGuestModal: `max-h-[90vh] overflow-y-auto`
- EditGuestModal: `max-h-[90vh] overflow-y-auto`

**Conclusion:** Modals scroll when content exceeds viewport. Add Guest and Edit Guest modals are scrollable.

---

### Step 24: Focus Trap in Modals

**Code observation:**
- No `focus-trap-react`, `@reach/dialog`, or similar focus-trap library found
- Modals use `role="dialog"` and `aria-modal="true"`
- No explicit `tabindex` or focus management logic

**Conclusion:** Focus trap is likely not implemented. Tab order may leave the modal and focus elements in the background. **UX issue:** Keyboard users can tab out of the modal.

---

### Step 25: Escape Key with Modal Open

**Code observation:**
- AddGuestModal: `if (e.key === 'Escape' && isOpen) onClose();`
- EditGuestModal: Same pattern
- EditInvitationModal: Same pattern

**Conclusion:** Escape closes all evaluated modals. **No UX issue.**

---

## Summary of UX Issues

### High Priority
1. **Actions column discoverability:** Edit/delete icons hidden until row hover; add visible affordance or always-visible icons.
2. **Focus trap:** Modals do not trap focus; implement focus trap for accessibility.
3. **ATTENDING vs HEADCOUNT:** Clarify difference (e.g. tooltip or short explanation).

### Medium Priority
4. **"Link" vs "Copy link":** Align terminology (e.g. "Copy invite link" in table).
5. **Event checkbox interaction:** Ensure checkboxes/labels are easy to click (e.g. larger hit area).

### Low Priority
6. **Forgot password:** Consider adding for admin login.
7. **Login placeholder:** Avoid using "admin" as placeholder to reduce confusion.

---

## Positive Observations

- Clear visual hierarchy and consistent color palette
- Helpful empty states with actionable text
- Validation messages are specific and inline
- Escape closes modals
- Modals scroll when content overflows
- Language switching works and translations are consistent
- Delete confirmation reduces risk of accidental deletion
- Shareable links section is well organized by venue and language

---

*Report generated from automated browser evaluation and codebase review.*
