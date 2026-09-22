# StackEDU whole system architecture

This is the development and system architecture for StackEDU. It explains the EMS frontend and backend stack, the parts of the system, and every API the app calls today.

Related notes (one topic each): `Realtime-Architecture-Decision.md`, `LMS-Classroom-Lifecycle.md`, `Timetable-Lifecycle.md`, `Course-Registration-Lifecycle.md`, `E-Library-Lifecycle.md`.

---

## 1. The whole system

StackEDU is three public sites plus one API.

| Site | Live URL | What it is |
| --- | --- | --- |
| Marketing | stackedu.rw / stackedu.africa | Public website. It does not run the school system. |
| Web app | app.stackedu.rw | Apply, Track, and every role portal. |
| API | api.stackedu.rw | All data, login, and file links. |
| User guides | GitHub Pages | How-to guides. Not part of the running app. |

On a local machine:

| Part | Address |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:8080 |
| Marketing | http://localhost:3001 |
| Postgres | localhost:5433 |

How a request travels:

```
Person
  → Web app (browser)
  → API (session cookie)
  → Institution database  (school data)
  → Platform database     (which school this login belongs to)
  → File storage          (documents, course files, library files)
  → Outside services      (email, live video, payments, AI)
```

The web app never talks to the database. Only the API does.

---

## 2. EMS tech stack

This is the stack for the EMS app only (`ems/`). The marketing site is a separate Next.js project at the repo root.

The EMS is a Bun monorepo. Shared request shapes live in `ems/packages/shared` so the web app and the API use the same types.

### Frontend stack (`ems/apps/web`)

| Tech | What it does |
| --- | --- |
| TypeScript | Types the web app. |
| React 19 | Builds the screens. |
| Vite | Starts the local web app and builds it for Vercel. |
| TanStack Router | Maps each URL to a page (Apply, student, lecturer, and the other portals). |
| TanStack Query | Loads and refreshes API data on those pages. |
| Tailwind CSS | Styles the app with the design-system colours. |
| Radix UI | Dialogs, selects, tabs, tooltips, and other controls (including confirm boxes). |
| Lucide | Icons. |
| LiveKit client | Puts the student or lecturer into the live class video room. |
| Excalidraw | Draws the classroom whiteboard. |
| Yjs + Hocuspocus | Keeps the whiteboard in sync while people draw. |
| jsPDF | Builds PDFs in the browser (registration list, receipts). |
| Recharts | Draws dashboard charts. |
| Sonner | Shows short success and error toasts. |
| xlsx | Reads spreadsheet imports (for example course bulk upload). |
| `@stackedu/shared` | Shared form and API shapes, so the browser and API agree. |

### Backend stack (`ems/apps/api`)

| Tech | What it does |
| --- | --- |
| TypeScript | Types the API. |
| Node 22 | Runs the API process. |
| Bun | Installs packages and runs the monorepo scripts. |
| Hono | Defines every API path listed later in this document. |
| Zod | Checks request bodies before any write. |
| Drizzle ORM | Talks to Postgres (schema, queries, migrations). |
| Postgres | Stores platform data and each school’s data. |
| `@stackedu/shared` | Same request and response shapes the web app uses. |
| Cloudflare R2 (S3 API) | Stores files in live. Local development writes to disk instead. |
| LiveKit server SDK | Creates live-class tokens and recording jobs. |
| Hocuspocus + Yjs | Hosts the live whiteboard sync. |
| Resend | Sends email when ICT turns it on. |
| otplib | Builds two-factor codes. |
| Vitest | Runs API tests. |
| Turbo | Runs web and API tasks together (`dev`, `test`, `check-types`). |

### Hosting for the EMS

| Tech | What it does |
| --- | --- |
| Vercel | Hosts the EMS web app (`app.stackedu.rw`). |
| Render | Hosts the API (`api.stackedu.rw`). |
| Docker Postgres | Local database on port 5433. |

---

## 3. What each part does

### Marketing site

Next.js site at the repo root. It sells the product. It is not the EMS.

### Web app (`ems/apps/web`)

Vite + React. One page for each role after sign-in. The account chooses the role. The person does not pick a role on the login screen.

Roles: Applicant, Student, Lecturer, Academic Admin, Bursar, Librarian, ICT Manager.

### API (`ems/apps/api`)

Hono on Node. Checks login, checks the role, then reads or writes data. Dates on screens are **DD-MM-YYYY**. Create, update, and delete ask the user to confirm in the web app before the API is called.

### Shared package (`ems/packages/shared`)

Zod schemas and types used by both the web app and the API. Request bodies are checked here first.

### Platform database

Holds institutions, branding, the email-to-school directory, platform admins, and the platform audit log.

### Institution database

One Postgres database per school. Holds people, courses, fees, library, results, timetable, and that school’s audit log.

### File storage

Metadata stays in Postgres. File bytes stay in object storage. Live uses Cloudflare R2. Local development writes to disk. Every object key starts with `institutions/<institutionId>/`.

### Email (Resend)

Sends admissions, account, timetable reminder, and notification emails when ICT turns Resend on.

### Live classroom (LiveKit)

Video and audio for a live class. ICT pastes the LiveKit keys. A live room is not the attendance register.

### Payments

Application fees and student fees. Sandbox can complete mobile money and card at once. Bank transfer stays pending until staff confirm it.

### AI helpers

Used when ICT turns AI on: study assistant, “describe this file”, and question generation.

---

## 4. Login and security

- Sign-in creates an **HttpOnly cookie**. The browser sends it with every API call.
- The API only accepts the web app origins in `ALLOWED_ORIGINS`.
- In production the cookie is shared with `COOKIE_DOMAIN=.stackedu.rw`.
- Two-factor can be turned on from the account APIs.
- Most file uploads use a short-lived signed link. The file does not pass through the API, except the institution logo and local-development uploads.

---

## 5. API calls

Base URL: `https://api.stackedu.rw` (live) or `http://localhost:8080` (local).

Unless noted, the caller must be signed in as that role.

### Health (no login)

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Says the API process is up. |
| GET | `/health/ready` | Says the API can reach the database. |
| GET | `/health/pools` | Shows database pool status. |

### Public (no login)

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/public/institution/:slug` | Loads the school name and branding for Apply. |
| GET | `/public/institution/:slug/logo` | Serves the school logo. |

### Auth

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/login` | Signs in with email, student number, or application ID. |
| POST | `/auth/2fa/verify` | Finishes sign-in when two-factor is on. |
| GET | `/auth/session` | Returns the current user, or empty if signed out. |
| POST | `/auth/logout` | Ends the session. |

### Account (any signed-in user)

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/account/profile` | Loads name, email, and phone. |
| PATCH | `/account/profile` | Updates profile fields that the user may change. |
| POST | `/account/phone/verify-request` | Sends a phone verification code. |
| POST | `/account/phone/verify` | Confirms the phone code. |
| POST | `/account/phone/resend` | Sends the phone code again. |
| POST | `/account/password` | Changes the password. |
| PATCH | `/account/security` | Updates security settings. |
| GET | `/account/notification-preferences` | Loads notification preferences. |
| PATCH | `/account/notification-preferences` | Saves notification preferences. |
| GET | `/account/notifications` | Lists in-app notifications. |
| POST | `/account/notifications/:id/read` | Marks one notification read. |
| POST | `/account/2fa/setup` | Starts two-factor setup. |
| POST | `/account/2fa/enable` | Turns two-factor on. |
| POST | `/account/2fa/disable` | Turns two-factor off. |

### Apply (applicant)

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/apply/programmes` | Lists programmes a person can apply for. |
| POST | `/apply/register` | Creates the applicant account. |
| POST | `/apply/verify-email` | Confirms the 6-digit email code. |
| POST | `/apply/resend-verification` | Sends a new email code. |
| GET | `/apply/application` | Loads the saved application form. |
| PATCH | `/apply/application` | Saves form answers. |
| GET | `/apply/documents` | Lists required and uploaded files. |
| POST | `/apply/documents/presign` | Gives a signed upload link. |
| PUT | `/apply/documents/upload/:token` | Receives the file in local development. |
| GET | `/apply/documents/file/:token` | Downloads a local-development file. |
| POST | `/apply/documents/confirm` | Attaches an uploaded file to the application. |
| DELETE | `/apply/documents/:documentId` | Removes an uploaded file. |
| GET | `/apply/documents/:documentId/url` | Gives a download link for one file. |
| POST | `/apply/documents/submit-response` | Sends extra documents the school asked for. |
| POST | `/apply/payment` | Starts the application-fee payment. |
| POST | `/apply/payment/acknowledge-bank` | Records that a bank transfer was started. |
| POST | `/apply/application/submit` | Submits the application after form, files, and fee. |
| POST | `/apply/accept-admission` | Accepts an offer. |
| POST | `/apply/decline-admission` | Declines an offer. |

### Academic Admin — applications

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/academic/applications` | Lists applications. |
| GET | `/academic/applications/:id` | Opens one application. |
| POST | `/academic/applications/:id/decision` | Saves under review, accept, reject, or request documents. |
| POST | `/academic/applications/:id/confirm-payment` | Confirms a pending bank fee. |
| GET | `/academic/applications/:id/documents/:documentId/url` | Opens an applicant file for review. |

### Academic Admin — registry

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/academic/me` | Loads this Academic Admin. |
| GET | `/academic/dashboard` | Loads registry tiles and queues. |
| GET | `/academic/students` | Lists students. |
| GET | `/academic/students/:id` | Opens one student file. |
| GET | `/academic/students/:id/engagement` | Loads that student’s engagement. |
| POST | `/academic/students/:id/status` | Changes student status. |
| GET | `/academic/courses` | Lists courses. |
| POST | `/academic/courses` | Adds a course. |
| POST | `/academic/courses/bulk` | Imports courses. |
| PATCH | `/academic/courses/:id` | Edits a course (including open or close registration). |
| DELETE | `/academic/courses/:id` | Removes a course when the rules allow. |
| GET | `/academic/departments` | Lists departments. |
| GET | `/academic/programmes` | Lists programmes. |
| GET | `/academic/programmes/:id` | Opens one programme. |
| POST | `/academic/programmes` | Adds a programme. |
| PATCH | `/academic/programmes/:id` | Edits a programme. |
| GET | `/academic/calendar` | Lists calendar events. |
| POST | `/academic/calendar` | Adds a calendar event. |
| PATCH | `/academic/calendar/:id` | Edits a calendar event. |
| DELETE | `/academic/calendar/:id` | Removes a calendar event. |
| GET | `/academic/timetable` | Reviews the timetable. |
| POST | `/academic/timetable/:slotId/ask-lecturer` | Messages the lecturer about a slot. |
| GET | `/academic/lecturers` | Lists lecturers. |
| GET | `/academic/semesters` | Lists semesters. |
| GET | `/academic/results` | Lists result batches (pending and published). |
| POST | `/academic/results/:id/approve` | Approves and publishes a batch. |
| POST | `/academic/results/:id/reject` | Sends a batch back. |
| GET | `/academic/at-risk` | Lists flagged students. |
| GET | `/academic/notifications` | Lists Academic Admin notifications. |
| POST | `/academic/notifications/:id/read` | Marks one notification read. |
| GET | `/academic/reports` | Generates registry reports. |

### Student

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/student/me` | Loads this student. |
| GET | `/student/dashboard` | Loads GPA, fees, attendance, and today’s schedule. |
| POST | `/student/timetable/reminders` | Saves a class reminder. |
| DELETE | `/student/timetable/reminders/:slotId` | Removes a reminder. |
| GET | `/student/courses` | Lists registered courses. |
| GET | `/student/courses/:offeringId` | Opens one course. |
| GET | `/student/discussions/:id` | Opens a discussion. |
| POST | `/student/discussions/:id/posts` | Posts in a discussion. |
| GET | `/student/materials/:id/download` | Gives a signed download for a reading. |
| POST | `/student/materials/:id/view` | Records that the student opened a page. |
| GET | `/student/registration` | Loads courses they can add or drop. |
| POST | `/student/registration` | Adds or drops a course (credit cap is checked). |
| GET | `/student/results` | Lists published results. |
| GET | `/student/transcript` | Loads the unofficial transcript. |
| GET | `/student/fees` | Loads charged, paid, and balance. |
| POST | `/student/fees/pay` | Starts a fee payment. |
| GET | `/student/payments/:paymentId/receipt` | Loads receipt data. |
| GET | `/student/notifications` | Lists student notifications. |
| POST | `/student/notifications/:id/read` | Marks one notification read. |
| GET | `/student/onboarding` | Loads first-login steps. |
| PATCH | `/student/onboarding` | Saves onboarding progress. |
| GET | `/student/assessments` | Lists assignments and quizzes. |
| GET | `/student/assessments/:id` | Opens one assessment. |
| POST | `/student/assessments/:id/submit` | Submits an answer. |
| GET | `/student/classroom` | Lists live classes. |
| GET | `/student/classroom/:id` | Opens a class session. |
| POST | `/student/classroom/:id/join` | Joins the live room. |
| GET | `/student/classroom/:id/whiteboard` | Loads the whiteboard. |
| PUT | `/student/classroom/:id/whiteboard` | Saves whiteboard changes. |
| GET | `/student/recordings/:id/download` | Gives a recording download link. |
| POST | `/student/study-assistant` | Asks the course study assistant. |

### Lecturer

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/lecturer/me` | Loads this lecturer. |
| GET | `/lecturer/dashboard` | Loads assigned courses and pending results. |
| GET | `/lecturer/courses` | Lists assigned courses. |
| GET | `/lecturer/courses/:offeringId` | Opens one course. |
| POST | `/lecturer/materials` | Adds a course page or file record. |
| POST | `/lecturer/materials/describe` | Drafts a description from the file. |
| POST | `/lecturer/materials/upload-target` | Gives a signed upload link. |
| PATCH | `/lecturer/materials/:id` | Edits a material. |
| DELETE | `/lecturer/materials/:id` | Removes a material. |
| GET | `/lecturer/materials/:id/download` | Gives a download link. |
| POST | `/lecturer/modules` | Adds a module. |
| PATCH | `/lecturer/modules/:id` | Edits a module. |
| DELETE | `/lecturer/modules/:id` | Removes a module. |
| POST | `/lecturer/announcements` | Posts an announcement. |
| PATCH | `/lecturer/announcements/:id` | Edits an announcement. |
| DELETE | `/lecturer/announcements/:id` | Removes an announcement. |
| POST | `/lecturer/discussions` | Opens a discussion. |
| GET | `/lecturer/discussions/:id` | Loads a discussion. |
| PATCH | `/lecturer/discussions/:id` | Edits a discussion. |
| DELETE | `/lecturer/discussions/:id` | Removes a discussion. |
| POST | `/lecturer/discussions/:id/posts` | Posts in a discussion. |
| GET | `/lecturer/attendance` | Lists attendance sessions. |
| GET | `/lecturer/attendance/:sessionId` | Opens one session. |
| POST | `/lecturer/attendance` | Starts or submits a session. |
| DELETE | `/lecturer/attendance/:sessionId` | Removes a session when allowed. |
| GET | `/lecturer/results/:offeringId` | Loads the results draft. |
| PATCH | `/lecturer/results/:offeringId` | Saves draft marks. |
| POST | `/lecturer/results/:offeringId/submit` | Sends the batch for publishing. |
| GET | `/lecturer/assessments` | Lists assessments. |
| POST | `/lecturer/assessments` | Creates an assessment. |
| DELETE | `/lecturer/assessments/:id` | Removes an assessment. |
| GET | `/lecturer/assessments/:id` | Opens an assessment. |
| GET | `/lecturer/assessments/:id/items` | Lists questions on it. |
| PUT | `/lecturer/assessments/:id/items` | Saves the question list. |
| GET | `/lecturer/questions` | Lists the question bank. |
| POST | `/lecturer/questions` | Adds a question. |
| POST | `/lecturer/questions/generate` | Asks AI to draft questions. |
| POST | `/lecturer/questions/upload-target` | Gives a signed upload for a question file. |
| PATCH | `/lecturer/questions/:id` | Edits a question. |
| DELETE | `/lecturer/questions/:id` | Removes a question. |
| POST | `/lecturer/assessments/:id/grades` | Saves a student’s grade. |
| GET | `/lecturer/at-risk` | Lists at-risk students on their courses. |
| POST | `/lecturer/at-risk/:id/resolve` | Clears a flag. |
| GET | `/lecturer/notifications` | Lists lecturer notifications. |
| POST | `/lecturer/notifications/read-all` | Marks all read. |
| POST | `/lecturer/notifications/:id/read` | Marks one read. |
| GET | `/lecturer/timetable` | Loads their weekly slots. |
| GET | `/lecturer/rooms` | Lists rooms they can book. |
| POST | `/lecturer/timetable` | Adds a slot (blocked if the room or lecturer is taken). |
| PATCH | `/lecturer/timetable/:slotId` | Moves a slot. |
| DELETE | `/lecturer/timetable/:slotId` | Removes a slot. |
| GET | `/lecturer/analytics/:offeringId` | Loads course analytics. |
| GET | `/lecturer/classroom` | Lists scheduled classes. |
| POST | `/lecturer/classroom` | Schedules a class. |
| GET | `/lecturer/classroom/:id` | Opens a class. |
| POST | `/lecturer/classroom/:id/start` | Starts the live room. |
| POST | `/lecturer/classroom/:id/end` | Ends the live room. |
| POST | `/lecturer/classroom/:id/cancel` | Cancels a class. |
| POST | `/lecturer/classroom/:id/join` | Joins as the lecturer. |
| POST | `/lecturer/classroom/:id/record/start` | Starts recording. |
| POST | `/lecturer/classroom/:id/record/stop` | Stops recording. |
| POST | `/lecturer/classroom/:id/summary` | Drafts a class summary. |
| POST | `/lecturer/classroom/:id/summary/publish` | Publishes the summary. |
| GET | `/lecturer/classroom/:id/whiteboard` | Loads the whiteboard. |
| PUT | `/lecturer/classroom/:id/whiteboard` | Saves the whiteboard. |
| GET | `/lecturer/recordings/:id/download` | Gives a recording download link. |

### E-library (student, lecturer, Academic Admin)

These four calls exist three times, under `/student`, `/lecturer`, and `/academic`.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/{role}/library` | Lists published titles. |
| GET | `/{role}/library/requests` | Lists this person’s title requests. |
| POST | `/{role}/library/requests` | Asks the librarian for a title. |
| GET | `/{role}/library/:id/download` | Gives a signed download. |

### Librarian

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/librarian/me` | Loads this librarian. |
| GET | `/librarian/dashboard` | Loads catalogue and request tiles. |
| GET | `/librarian/notifications` | Lists library notifications. |
| POST | `/librarian/notifications/:id/read` | Marks one read. |
| GET | `/librarian/analytics` | Loads downloads and views. |
| GET | `/librarian/access-options` | Lists who a title can be limited to. |
| GET | `/librarian/resources` | Lists catalogue items. |
| POST | `/librarian/resources` | Adds a title. |
| POST | `/librarian/resources/describe` | Drafts a description from the file. |
| GET | `/librarian/resources/:id` | Opens one title. |
| PATCH | `/librarian/resources/:id` | Edits or publishes / unpublishes a title. |
| PUT | `/librarian/resources/:id/access` | Sets who may download it. |
| POST | `/librarian/resources/:id/upload-target` | Gives a signed upload link. |
| POST | `/librarian/resources/:id/files` | Attaches the uploaded file. |
| DELETE | `/librarian/resources/:id/files/:fileId` | Removes a file. |
| GET | `/librarian/resources/:id/download` | Gives a download link. |
| GET | `/librarian/collections` | Lists collections. |
| POST | `/librarian/collections` | Creates a collection. |
| GET | `/librarian/collections/:id` | Opens a collection. |
| PATCH | `/librarian/collections/:id` | Edits a collection. |
| DELETE | `/librarian/collections/:id` | Deletes a collection (not the books). |
| POST | `/librarian/collections/:id/items` | Adds a title to a collection. |
| DELETE | `/librarian/collections/:id/items/:resourceId` | Removes a title from a collection. |
| GET | `/librarian/requests` | Lists title requests. |
| POST | `/librarian/requests/:id/fulfil` | Fulfils a request. |
| POST | `/librarian/requests/:id/decline` | Declines a request. |

### Bursar

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/bursar/me` | Loads this bursar. |
| GET | `/bursar/dashboard` | Loads collections, balances, and holds. |
| GET | `/bursar/payments` | Lists the payment ledger. |
| GET | `/bursar/programmes` | Lists programmes for fee filters. |
| GET | `/bursar/academic-years` | Lists academic years. |
| GET | `/bursar/semesters` | Lists semesters. |
| GET | `/bursar/fee-items` | Lists fee structure items. |
| POST | `/bursar/fee-items` | Adds a fee item. |
| PATCH | `/bursar/fee-items/:itemId` | Edits a fee item. |
| DELETE | `/bursar/fee-items/:itemId` | Removes a fee item. |
| POST | `/bursar/fee-structure/issue-invoices` | Applies fees to the semester (students then see invoices). |
| GET | `/bursar/student-accounts` | Lists student fee accounts. |
| GET | `/bursar/student-accounts/:studentId` | Opens one account. |
| POST | `/bursar/student-accounts/:studentId/payments` | Records a manual payment. |
| POST | `/bursar/student-accounts/:studentId/hold` | Places a fee hold (blocks registration). |
| DELETE | `/bursar/student-accounts/:studentId/hold` | Releases a hold. |
| GET | `/bursar/receipts` | Lists receipts. |
| POST | `/bursar/receipts/:receiptId/void` | Voids a receipt. |
| GET | `/bursar/reconciliation` | Lists gateway items to match. |
| POST | `/bursar/reconciliation/:recordId/resolve` | Marks a gateway item resolved. |
| GET | `/bursar/reports` | Generates a finance report. |
| GET | `/bursar/notifications` | Lists bursar notifications. |
| POST | `/bursar/notifications/read-all` | Marks all read. |
| POST | `/bursar/notifications/:id/read` | Marks one read. |
| GET | `/bursar/audience-options` | Lists who can receive a fee message. |
| GET | `/bursar/announcements` | Lists fee messages already sent. |
| POST | `/bursar/announcements` | Sends a fee message. |

### ICT Manager

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/ict/me` | Loads this ICT Manager. |
| GET | `/ict/dashboard` | Loads users, sessions, and recent audit. |
| GET | `/ict/analytics` | Loads usage counts. |
| GET | `/ict/users` | Lists logins. |
| GET | `/ict/users/:id` | Opens one user. |
| POST | `/ict/users` | Creates a login (a student login also creates the student record). |
| PATCH | `/ict/users/:id` | Edits a user. |
| POST | `/ict/users/:id/reset-password` | Resets a password. |
| POST | `/ict/users/:id/revoke` | Revokes access. |
| GET | `/ict/programmes` | Lists programmes for user forms. |
| GET | `/ict/revocations` | Lists revocations. |
| GET | `/ict/revocations/:id` | Opens one revocation. |
| POST | `/ict/revocations/:id/restore` | Restores access. |
| GET | `/ict/roles` | Lists roles and permission switches. |
| PATCH | `/ict/roles/:key/permissions` | Saves what that role can do. |
| GET | `/ict/audit` | Lists the audit log. |
| GET | `/ict/audit/:id` | Opens one audit row (cannot edit or delete). |
| GET | `/ict/settings` | Loads institution settings. |
| PATCH | `/ict/settings` | Saves name, timezone, colour, language, attendance window, and payment rules. |
| POST | `/ict/settings/logo` | Uploads the school logo. |
| GET | `/ict/integrations` | Lists email, classroom, AI, and payment services. |
| PATCH | `/ict/integrations/:id` | Saves keys and on/off. |
| POST | `/ict/integrations/:id/check` | Tests the connection. |
| GET | `/ict/announcements` | Lists ICT announcements. |
| GET | `/ict/audience-options` | Lists who can receive an announcement. |
| POST | `/ict/announcements/preview` | Shows how many people would receive it. |
| POST | `/ict/announcements` | Sends an in-app announcement. |
| GET | `/ict/notifications` | Lists ICT notifications. |
| POST | `/ict/notifications/:id/read` | Marks one read. |

---

## 6. Where the code lives

| Path | What it is |
| --- | --- |
| `ems/apps/web` | Web app |
| `ems/apps/api` | API |
| `ems/apps/api/src/routes` | API paths listed above |
| `ems/packages/shared` | Shared request and response shapes |
| repo root `src/` | Marketing site |
