# Foundation Management System — Project Plan

> A centralized platform to manage foundation membership applications, member records,
> and manual cash contribution tracking (weekly/monthly), with an admin-only dashboard.

**Stack:** Next.js 16 (existing boilerplate) · MongoDB / Mongoose · Next.js API routes · JWT auth

**Core rule:** Only Admins log into the system. Members are data records only — no member-side login in v1.

---

## Phase 0 — Project Setup

- [ ] Confirm Next.js 16 boilerplate structure (App Router route groups: `(public)`, `(admin)`)
- [ ] Set up MongoDB connection (Mongoose singleton pattern for Next.js hot-reload safety)
- [ ] Set up environment variables (`.env.local`): `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` or `S3_*`
- [ ] Install core packages: `mongoose`, `bcrypt`, `jsonwebtoken`, `zod` (validation), `speakeasy` + `qrcode` (TOTP 2FA)
- [ ] Decide file storage provider (Cloudinary vs S3) — finalize before Phase 5

---

## Phase 1 — Database Models (Mongoose Schemas)

Build in this order (later models reference earlier ones):

1. [ ] `User` model (admin accounts only, role enum `admin`/`member` for future-proofing)
2. [ ] `MembershipApplication` model (public form submissions)
3. [ ] `Member` model (created on approval)
4. [ ] `Contribution` model (append-only ledger, `periodLabel` uniqueness per member)
5. [ ] `HeroImage` model (homepage CMS)
6. [ ] Add indexes: `MembershipApplication.phone`, `Contribution.memberId + periodLabel` (compound), `User.email`

**Deliverable:** `/models/*.js` — one file per schema, exported Mongoose models.

---

## Phase 2 — Authentication & Authorization (Admin Only)

- [ ] Admin registration endpoint (likely seeded manually or invite-only — no public admin signup)
- [ ] Login endpoint — email + password → JWT (short-lived access token)
- [ ] Password hashing with bcrypt
- [ ] JWT middleware for protected API routes
- [ ] Role-based middleware (`requireAdmin`) — reuse your existing `checkPermission` pattern if applicable
- [ ] Session/logout handling
- [ ] Protect all `(admin)` routes and `/api/admin/*` endpoints

**Deliverable:** Working admin login with mandatory 2FA, protected dashboard shell.

---

## Phase 3 — Public Website (No Auth Required)

- [ ] Landing page layout (Hero section, About Foundation, Call-to-action)
- [ ] Hero section pulls active images from `HeroImage` collection dynamically
- [ ] Public "Become a Member" page with the Membership Application form
  - Form fields: full name, guardian name, phone, email, NID, address, DOB, occupation, photo upload, requested contribution type (weekly/monthly), requested amount
  - Client-side validation (zod schema shared with backend)
  - Duplicate check warning (phone/NID already has pending or approved application) — soft warning, not hard block
- [ ] Form submission → `POST /api/applications` → stored as `pending`
- [ ] Success confirmation page/message after submission
- [ ] Mobile-first responsive design pass on all public pages

**Deliverable:** Fully working public site with functional membership form.

---

## Phase 4 — Admin Dashboard Shell

- [ ] Dashboard layout (sidebar nav: Applications, Members, Contributions, Reports, Hero Images, Settings)
- [ ] Dashboard home — quick stats (pending applications count, active members count, this period's total collected, defaulters count)
- [ ] Reusable table component (search, filter, pagination) — will be reused across Applications/Members/Contributions

**Deliverable:** Empty but navigable admin shell with real stats on the home screen.

---

## Phase 5 — Membership Applications Management

- [ ] List view — filter by status (pending/approved/rejected), search by name/phone
- [ ] Application detail view — full submitted info + photo
- [ ] Approve action → creates `Member` record, copies relevant fields, locks in `contributionType`/`contributionAmount`, sets `status: active`
- [ ] Reject action → requires reason, updates `status: rejected`
- [ ] Prevent double-approval (once approved, application becomes read-only/linked to Member)

**Deliverable:** Admin can fully process incoming applications end-to-end.

---

## Phase 6 — Member Management

- [ ] Member list — filter by status (active/suspended/exited), search by name/phone
- [ ] Member detail page — profile info + full contribution history table
- [ ] Edit member profile (contact info, photo)
- [ ] Change member status: suspend / reactivate / mark exited
- [ ] (Decision needed) Handle premium amount changes — overwrite vs versioned history

**Deliverable:** Admin can manage the full lifecycle of a member post-approval.

---

## Phase 7 — Contribution Ledger

- [ ] "Record Contribution" form — select member → auto-fill type & amount from `Member` → select period (week/month) → confirm
- [ ] Prevent duplicate entries for the same member + `periodLabel` (unique compound index enforced at DB + UI level)
- [ ] Contribution list/history — filterable by member, period, date range
- [ ] Reversal action — instead of editing/deleting, create a reversing entry (`reversalOf` pointing to original), never mutate confirmed rows
- [ ] Defaulters view — members with no confirmed `Contribution` for the current active `periodLabel`

**Deliverable:** Core financial tracking fully functional, append-only and auditable.

---

## Phase 8 — Reporting & Export

- [ ] Monthly summary report (total collected, per-member breakdown, defaulters list)
- [ ] CSV export — all contributions, or filtered by member/date range
- [ ] (Optional later) PDF export for formal meeting reports

**Deliverable:** Admin can generate and download reports for foundation meetings.

---

## Phase 9 — Hero Image / CMS Management

- [ ] Upload image (to Cloudinary/S3) → save URL + order in `HeroImage`
- [ ] Reorder images (drag-and-drop or simple order number input)
- [ ] Activate/deactivate images without deleting
- [ ] Delete image (removes from storage + DB)

**Deliverable:** Admin can fully manage homepage hero content without a code deploy.

---

## Phase 10 — Polish & Hardening

- [ ] Input validation everywhere (zod on both client and API)
- [ ] Rate limiting on public form submission endpoint (prevent spam applications)
- [ ] Error handling & user-friendly error states across admin dashboard
- [ ] Loading states / skeletons for all data-fetching views
- [ ] Mobile responsiveness pass across admin dashboard (not just public site)
- [ ] Basic audit log (who approved/rejected/recorded what, with timestamp) — minimum: reuse `recordedBy`/`reviewedBy` fields already in schema, add a dedicated log view if time permits
- [ ] Backup strategy for MongoDB (scheduled dumps)

---

## Deferred / Future Ideas (not in v1 scope)

- Member self-login/portal
- Public or member-facing transparency page
- Payment gateway integration (bKash/Nagad/Stripe) instead of manual cash entry
- SMS/email payment reminders
- Multi-tenant support (if the foundation model is reused for other groups)
- Versioned premium amount history

---

## Open Decisions (resolve before Phase 6/7)

1. Defaulter tracking in v1 — yes/no?
2. Premium amount change handling — overwrite field vs versioned history with `effectiveFrom`?
3. File storage provider — Cloudinary vs S3-compatible bucket?

---

## How to Use This Plan

Work top to bottom, phase by phase. Each phase is a self-contained prompt unit —
give one phase at a time to an AI coding assistant along with the relevant schema/code
from the previous phase for context, rather than pasting the whole plan at once.
