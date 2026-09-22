# Code Standards

## General

- [Principle — e.g. Keep modules small and single-purpose]
- [Principle — e.g. Fix root causes, do not layer workarounds]
- [Principle — e.g. Do not mix unrelated concerns in one
  component or route]
- Confirm every create, update, and delete in a `ConfirmAlertDialog` before
  the request is sent. The form collects the values; the dialog is what
  commits them. Deletes use the destructive tone. Creates and updates use
  success or info.
- Always set the date format app-wide to DD-MM-YYYY format and all date should be more recent to the past or present month!

## TypeScript

- [Rule — e.g. Strict mode is required throughout the project]
- [Rule — e.g. Avoid any — use explicit interfaces or narrowly
  scoped types]
- [Rule — e.g. Validate unknown external input at system
  boundaries before trusting it]

## [Framework — e.g. Next.js]

- [Convention — e.g. Default to server components]
- [Convention — e.g. Add use client only when browser
  interactivity requires it]
- [Convention — e.g. Keep route handlers focused on a
  single responsibility]

## Styling

- [Rule — e.g. Use CSS custom property tokens — no
  hardcoded hex values]
- [Rule — e.g. Follow the border radius scale defined
  in ui-context.md]
- Every icon-only control (CRUD, pagination, download, and similar actions)
  shows a tooltip on hover. Use `IconActionButton` for table and row actions
  so the label, `aria-label`, and tooltip stay in one place. Do not ship an
  icon button with only a native `title` or a silent icon. This applies for
  every role.

## API Routes

- [Rule — e.g. Validate and parse request input before
  any logic runs]
- [Rule — e.g. Enforce auth and ownership before any mutation]
- [Rule — e.g. Return consistent, predictable response shapes]

## Data and Storage

### Where a thing lives

- Metadata belongs in Postgres. File bytes belong in object storage. A table
  stores the object key in a `file_key` column plus the display name, byte
  size, and MIME type. It never stores the content.
- Large or unbounded content never goes in a column. Documents, e-books,
  course materials, recordings, and generated PDFs are objects.
- `jsonb` is for small, bounded, structured values: a per component score
  breakdown, a job's input and output, risk evidence, a gateway payload. It is
  not a replacement for a table and it is not a replacement for a file. If a
  value needs to be queried, joined, or reported on, it is a column.
- `applications.details` is the one accepted exception, holding the open ended
  part of an application form as a single document. Do not copy that shape for
  new features without an equally specific reason.
- Money is a whole number of Rwandan Francs written with the shared `money()`
  column helper in `apps/api/src/db/columns.ts`. It is `bigint`, never a float
  and never `integer`, because yearly fee income in RWF overflows int4.
- Timestamps are stored with a time zone, using the shared `timestamps()`
  helper so every table carries `created_at` and `updated_at`.

### Two database scopes

- Platform data lives in the platform database: the institution registry and
  its branding, the connection registry, the cross institution user directory,
  login attempts, platform admins, billing, migration history, and the platform
  audit log. Everything about people, teaching, money, the library, and the
  institution audit trail lives in that institution's own database.
- Per institution databases are created by `apps/api/src/db/provision.ts` and
  reached only through the connection manager in `apps/api/src/db/connection.ts`.
  Nothing opens its own pool.
- Every query is already scoped to one institution by virtue of the database it
  runs against. Do not add an `institution_id` column inside an institution
  database to compensate for that.

### Schema change rules

- Schema changes are additive: new nullable columns, new columns with a safe
  default, new tables, new indexes. A destructive change needs an explicit
  decision, not a silent migration.
- Every change ships as a numbered SQL file under
  `apps/api/drizzle/platform/` or `apps/api/drizzle/institution/`, with a
  matching entry in that folder's `meta/_journal.json`. The Drizzle schema in
  `apps/api/src/db/` and the SQL file are changed in the same commit.
- Records that other rows point to are retired with a status or timestamp
  column, for example `is_active`, `dropped_at`, `closed_at`. Hard deletes are
  reserved for deprovisioning a whole institution.

### Object storage rules

- Object storage is reached only through `apps/api/src/lib/storage.ts`. No
  route, service, or job talks to S3, R2, or the filesystem directly.
- The driver is chosen by `STORAGE_DRIVER`. `local` writes under
  `STORAGE_LOCAL_ROOT` for development and tests, `r2` uses Cloudflare R2 over
  the S3 API. Any new file feature must work under both drivers.
- Every object key begins `institutions/<institutionId>/`. That is what stops
  one institution reading another's files, and it is what lets a deprovision
  delete an institution's objects by prefix.
- A user supplied file name is sanitised and prefixed with a random UUID before
  it becomes part of a key. A file name is never a key on its own.
- Uploads and downloads go through expiring links built by `storage.ts`: 15
  minutes to upload, 10 minutes to download. Under the `r2` driver those are
  presigned R2 URLs and the bytes bypass the API. Under the `local` driver the
  same call returns an HMAC signed API route, so the bytes do pass through the
  API. Never assume one or the other; always use the returned upload target.
- Two paths deliberately stream through the API under both drivers: the
  institution logo upload, which is small and needs server side format checks,
  and the public logo read, which must load without a session.
- Every upload declares its MIME type and byte size before it starts. Both are
  checked against the allow list and ceiling for that kind of file, and the
  route carries a `bodyLimit` set to the same ceiling. The two must agree.
- When a stored object is replaced or its owning record is removed, the old
  object is deleted through `deleteStoredObject`.
- A key reserved for an upload that is never attached to a row leaves an
  orphan object, because there is no sweeper. Prefer creating the owning row
  first, or attaching in the same request, so an abandoned upload is
  recoverable by key rather than lost.

## File Organization

- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]

## GitHub and production

- Product code ships on `main`. Hosts that auto-deploy from `main` (Vercel for
  `app.stackedu.rw`, Render for `api.stackedu.rw`) are the production release.
  Use the existing `stackedu-prod` repo. Do not create a second production
  repository.
- Never commit secrets, `.env` files, credentials, or private keys. Set them
  in the Vercel and Render dashboards.
- Dummy, demo, and seed data stay on local machines and local databases.
  `bun run db:seed` and other demo seed commands refuse to run when
  `NODE_ENV` is `production`. Do not commit generated dummy files, local
  object storage under `.data/`, or database dumps.
- Tests may use in-memory dummy bytes. That is not production data and may
  be committed.
- Push to GitHub only the product code that should go live. Local planning
  docs, design exports, and dummy datasets stay local.
- Role user guides are read on GitHub Pages, not in the GitHub file
  browser. Keep `ems/docs/user-guides/` the source of truth and keep that
  site responsive.

## Local role testing and tester guides

These rules apply every time a role-facing feature is built or changed.
Tester guides live in `ems/docs/user-guides/`. Write one file per role
(`applicant-guide.md`, `student-guide.md`, `lecturer-guide.md`,
`academic-admin-guide.md`, `bursar-guide.md`, `librarian-guide.md`,
`ict-guide.md`). Keep the wording in simple English so a first-time tester
can follow it.

Readers use the GitHub Pages site, not the GitHub file tree. The markdown
in `ems/docs/user-guides/` is the only source of guide content. The site
shell (`index.html`, `styles.css`, `app.js`) in that same folder must stay
fully responsive (phone, tablet, and computer) and use the design-system
colours below. Do not copy guide text into extra HTML pages. Pushing those
files to `main` publishes
https://stackforgeai-projects.github.io/stackedu-prod/ through
`.github/workflows/user-guides-pages.yml`. Update the matching `.md` file
whenever a role flow changes so the hosted guide stays current.

- Start the local servers first (marketing site, EMS API, EMS web). Sign in
  as that role with the local dummy accounts. Do not pause for confirmation
  on local test logins.
- Walk the screens and actions that role can use. Use dummy data. Confirm
  every create, update, and delete in `ConfirmAlertDialog` before the
  request is sent.
- Add a step to the matching role guide only after you have tested it and
  it worked. Do not document a screen you have not opened. Do not document
  a flow that failed.
- If something breaks, is unclear, or does not talk to the API correctly,
  fix the product code, re-test the same step, and only then update the
  guide.
- Keep the guides appealing and easy to scan. Use the design-system colours
  (`--brand` `#0FBD3B`, `--brand-ink` `#05131D`, `--success` `#16A34A`,
  `--error` `#DC2626`, `--info` `#2563EB`, and their background tokens) for
  callouts such as what works, what to watch, and who this role is.
- Do not invent extra test files or extra product work. API tests that a
  fix needs must stay relevant and finish quickly. All of those tests must
  pass.
- Dates stay DD-MM-YYYY. Icon-only controls use `IconActionButton` with a
  tooltip. Keep the codebase DRY. Do not implement work you were not asked
  to do.
