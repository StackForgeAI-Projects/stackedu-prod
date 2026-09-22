# General fixes

Fixes that apply to **every user role**. Implement these in a shared pass, not only on one role’s screens.

Dates stay **DD-MM-YYYY**. Confirm every create, update, and delete in `ConfirmAlertDialog`. Icon-only controls use `IconActionButton` with a tooltip. Keep one shared component per concern (DRY).

---

## 1. Info box on every form (especially side modals)

**Problem:** Side modal forms jump straight into fields. A first-time user cannot tell what the form is for or what happens when they submit.

**What must happen:**

1. Every form for every role — mostly the right-hand side modals — has an **info box after the title**.
2. The box says, in simple English, using this pattern:
   - what this thing is (general — do not name a sample course, module, person, or live record)
   - what confirming and submitting does
   - how that changes the rest of the system
3. Example — **Add module** (Course Management):
   - A module is a named part of this course. It could be Week 1, Week 2, and so on. It is a simple way to break learning into smaller bits for your students.
   - You add pages, files, and other course content inside a module. Students open that content by module. If you set a prerequisite, they cannot open this module until they finish the earlier one.
   - Confirming creates the module on this course. You must have at least one module before you can add material.
4. Write the copy in clear, short sentences. No jargon. Keep all form copy in `apps/web/src/lib/form-info-copy.ts`.
5. Put the box in a **shared** form-info component. Do not copy a one-off alert into every sheet.
6. Reuse design-system colours (`--info` / `--info-bg`) so the box looks the same on every role.

**Status:** DONE. Shared `FormInfoBox` sits after form titles on side modals and other submit forms. Copy lives in `form-info-copy.ts` and follows the pattern above.

---

## 2. File uploads — 14 MB ceiling, shown before compress

**Problem:** Upload limits differ by feature (course material 10 MB, library 500 MB, application documents 10 MB). Large files fail without a clear next step.

**What must happen:**

1. **Every** file upload in the app has a hard maximum of **14 MB**. Be strict. The API and the browser must use the same ceiling.
2. When the user picks a file that is over 14 MB, a **pop-up modal opens at once**.
3. The modal must show the **actual size of the file they picked**, before any compression, so the system can flag a file that is extremely too large even before it tries to reduce it.
4. The modal tells the user the file is too large, and that the app will **auto compress / reduce** it.
5. After compress, the result must still be **14 MB or less**. If it is still over, refuse the upload. Do not send it.
6. Compression and the size check live in **one shared helper**. Routes, services, and forms must not invent their own limits.
7. Shared constants, Zod max values, and route `bodyLimit` values must all be 14 MB.

**Status:** DONE. Shared `MAX_UPLOAD_BYTES` (14 MB), `FileTooLargeDialog`, and `reduceUploadFile` are used by every upload. The API refuses anything over 14 MB.

---

## 3. Header notification dropdown — mark read and drop the bell count

**Problem:** The header bell dropdown lists notices, but a click does not sync the unread state at once. The item can stay unread in the list, and the red count on the bell does not drop. Lecturer and bursar are worse: their profile caches are never refreshed from the dropdown, so the count can sit there until a later page load.

**What must happen:**

1. This is a **shared header** fix for every signed-in role (student, lecturer, academic admin, bursar, librarian, ICT). Do not patch one role’s notifications page only.
2. When the user opens the bell dropdown and clicks an **unread** notice:
   - that notice is marked **read** at once (the unread dot goes away)
   - the red number on the bell **drops by one** at once
   - the same change is saved on the server
3. A notice that is already read does nothing extra. The count must not go below zero.
4. The dropdown can stay open so the user can click the next unread item and see the count drop again.
5. **View all notifications** still goes to that role’s notifications page. Marking a row read on that page must also drop the header bell count.
6. Keep **one shared helper** for this cache sync. Do not copy mark-read / unread-count logic into each role shell.
7. Confirm in the browser as every role, with dummy seed accounts. Dates stay **DD-MM-YYYY**.

**Status:** DONE. Shared `applyNotificationReadLocally` in `notification-read-sync.ts` marks the row read and decrements every role profile unread count in the same tick. The header dropdown and the role notifications pages both use it.

---

## 4. Marketing site must not 404 on EMS portal URLs

**Problem:** Opening `/lecturer/dashboard`, `/login`, or another EMS path on the marketing site (`localhost:3000` or `www.stackedu.rw`) shows a black Next.js 404. The lecturer dashboard lives on the EMS app. A leftover tab can also request Vite files (`/src/routes/...`) from the marketing origin.

**What must happen:**

1. Sign-in and every role portal path on the marketing site go to the EMS app, with the same path and query string.
2. Locally that is `http://localhost:3001`. In production, Rwanda hosts go to `https://app.stackedu.rw` and Africa hosts go to `https://app.stackedu.africa`.
3. `EMS_APP_URL` can override the origin.
4. Leftover Vite module URLs (`/src/routes`, `/@vite`, and similar) go to the same EMS origin.
5. The marketing `<html>` tag uses `suppressHydrationWarning` so a browser extension cannot trip a hydration warning on that layout.

**Status:** DONE. `src/middleware.ts` redirects those paths through `src/lib/ems-app.ts`. Root layout sets `suppressHydrationWarning` on `<html>`.
