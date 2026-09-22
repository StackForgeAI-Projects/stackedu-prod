# ICT Manager fixes

Fixes for the ICT Manager portal. Other roles do not implement these.

---

## 1. Dashboard and User Management crash on load

**Problem:** After a full reload, **Dashboard** and **User Management** showed a generic “Something went wrong / We could not load this page” screen. **Notifications** still opened. The header bell still worked.

**Crash reason:**

1. Both screens always mount the shared `IctDialog` (even while it is closed).
2. `IctDialog` read a variable named `info` that does not exist. The real prop is `infoLines`.
3. That throw is a `ReferenceError: info is not defined`. React’s root error panel swallowed it, so the page looked like a generic load failure.
4. **Notifications** does not use `IctDialog`, which is why that screen survived.
5. The same dialog is used on Audit Log, Access Revocation, and Announcements, so those screens could crash the same way.
6. A second, quieter risk on Dashboard: `data?.recentAudit.find(...)` throws if the audit list is missing. That is now `data?.recentAudit?.find(...)`.

**What must happen:**

1. Dashboard and User Management open after sign-in and after a full reload.
2. The shared dialog uses `infoLines`. When there is no info box, the description still shows.
3. Confirm in the browser as ICT with the local dummy account.

**Status:** Implemented. `IctDialog` reads `infoLines`. Dashboard guards a missing audit list. Tested as ICT Manager after a full reload.

If the browser says **The server is down** instead of this crash, the local web or API process is not running. That is logged in `ems/docs/stackedu-issues.md`.

---

## 2. Classroom recording expiry

**Problem:** Live class recordings stay on storage with no end date. ICT cannot choose how long a file is kept. Students are not told when a download will disappear.

**What must happen:**

1. On **System Settings**, ICT sets how long a ready classroom recording is kept. The value is a number of **hours** or **days**.
2. Default is **72 hours**. Shortest keep is 1 hour. Longest is 30 days.
3. Confirm **Save settings** writes the window. New ready recordings use that window.
4. Enrolled students (present or absent) are notified when a recording is ready, and again when the window is nearly over. The notice uses the ICT window, not a fixed 72 hours.
5. When the window ends, the file is deleted and the download leaves the class page.

**Status:** Implemented. **System Settings** has **Classroom recording keep-window**. Confirm **Save settings**. Students are notified using that window. Expired files are deleted.
