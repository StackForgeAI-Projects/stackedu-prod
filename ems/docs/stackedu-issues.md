# StackEDU issues

Work log for local and product issues. Instructions are listed first, then what was done.

---

## Instruction list (this request)

Do these in order. Do not add extra product work.

1. Find why `http://localhost:3000/ict/users` shows **The server is down**.
2. Fix that cause and test as a signed-in user.
3. Log the reason in this file.
4. Keep the ICT Dashboard / User Management crash fix (`IctDialog` `info` → `infoLines`).
5. Sign in locally as each dummy role and check the portal still opens.
6. Follow `ems/context/code-standards.md` on files touched for this fix.
7. Keep the codebase DRY. Do not add unused files or tests.
8. Run only the tests that belong to this change. They must pass and stay fast.
9. Keep the e-library lifecycle guide in `ems/docs/E-Library-Lifecycle.md` (plain English process flow). Do not rewrite it unless it is wrong.
10. Do not implement work that was not asked for.

---

## 1. `localhost:3000/ict/users` — The server is down

**Why:** This is not an ICT User Management code failure. Nothing was listening on port **3000** (EMS web / Vite) or port **8080** (EMS API). The browser never reached the app, so it reported the server as down.

**How that happened:**

1. The earlier local API and Vite processes had stopped. The terminals were idle. `lsof` showed no listeners on 3000 or 8080.
2. `curl` to `http://localhost:3000/ict/users` and `http://localhost:8080` returned connection refused.
3. The Cursor browser shows **The server is down** when the web process is gone. That text is not in the StackEDU UI.
4. If only the API is down and the web is up, ICT pages show a connection error instead (`NETWORK_ERROR`: “We could not connect to StackEDU”).

**What is not the cause:** The ICT `IctDialog` crash (see issue 2). That only appears after the web app actually loads.

**Fix:** Start the EMS API on 8080 and the EMS web app on 3000. Postgres on 5433 was already healthy. Then open `/ict/users` as ICT Manager (`ict@sfu.ac.rw` / `ICT#2026`).

**Status:** Fixed by starting the local API and web processes. `/ict/users` and `/ict/dashboard` load after a full reload. Add user and Manage dialogs open. The same screens work at 390px width.

---

## 2. ICT Dashboard and User Management crash after reload

**Why:** Shared `IctDialog` read a variable named `info` that does not exist. The prop is `infoLines`. That throw is `ReferenceError: info is not defined`. React’s root panel then shows “Something went wrong / We could not load this page”.

**Why Notifications still worked:** That screen does not mount `IctDialog`.

**Also:** Dashboard now uses `data?.recentAudit?.find(...)` so a missing audit list cannot throw.

**Status:** Fixed in `ems/apps/web/src/components/ict/IctPanels.tsx` and `ems/apps/web/src/routes/_auth/ict/dashboard.tsx`. Details in `ems/context/ict-fixes.md`. Re-tested after the servers were started.

---

## Local dummy accounts (seed)

| Role | Email | Password |
| --- | --- | --- |
| Student | student@sfu.ac.rw | Student#2026 |
| Lecturer | lecturer@sfu.ac.rw | Lecturer#2026 |
| Bursar | bursar@sfu.ac.rw | Bursar#2026 |
| Academic Admin | academic@sfu.ac.rw | Academic#2026 |
| Librarian | librarian@sfu.ac.rw | Librarian#2026 |
| ICT Manager | ict@sfu.ac.rw | ICT#2026 |

---

## Test log (this request)

1. ICT User Management — table, Add user dialog, Manage dialog. Pass.
2. ICT Dashboard — tiles, users-by-role, recent audit, View dialog. Date is **22-09-2026**. Pass.
3. ICT Notifications — list loads on phone width (390px). Pass.
4. Sign-in as Student (`student@sfu.ac.rw`) — dashboard. Pass.
5. Sign-in as Lecturer — dashboard. Pass.
6. Sign-in as Bursar — dashboard. Pass.
7. Sign-in as Academic Admin — dashboard. Pass.
8. Sign-in as Librarian — dashboard and Resource Catalogue. Pass.
9. API login + dashboard GET for all six dummy roles — 200. Pass.
10. No new test files. The crash is a frontend `ReferenceError`; there is no existing API test for `IctDialog`.

## Related docs

- E-library process flow: `ems/docs/E-Library-Lifecycle.md` (already in place; not rewritten)
- ICT crash notes: `ems/context/ict-fixes.md`
- Code standards: `ems/context/code-standards.md`
