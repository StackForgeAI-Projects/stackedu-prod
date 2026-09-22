# Academic Admin fixes

This window implements **Academic Admin** product fixes only. Dates stay **DD-MM-YYYY**. Creates, updates, and deletes still go through `ConfirmAlertDialog`. Icon-only controls use `IconActionButton` with a tooltip.

---

## 1. Draft application review message

**Problem:** A new applicant can sit on Recent Applications while the application is still **Draft**. **Review** opens the application page and says "Application could not be found."

**What must happen:** If the application exists and is still a draft, the page says: "Application could not be found because the applicant hasn't yet submitted it". A missing id keeps the original not-found message. Drafts stay private; the reviewer does not see the form.

**Status:** Done

---

## 2. Application documents update without a refresh

**Problem:** An applicant upload did not show on the Academic Admin application page after several refreshes. It appeared only after admissions requested another document.

**Cause:** The application detail is cached for five minutes. A refresh inside the app reused that cache. Requesting another document saved a decision and replaced the cache with a fresh copy, which is why the upload suddenly appeared.

**What must happen:** While Academic Admin has the application open, a new applicant upload shows on Documents and Activity without a manual refresh. A new document request updates the applicant's Track page the same way. The reviewer also gets an in-app notice when a file is uploaded.

**Status:** Done

---

## 3. Remove Max credits from calendar events

**Problem:** The calendar event form shows **Max credits**. That cap is not part of creating an event such as Career Day.

**What must happen:** The field is removed from create and edit. New semester events keep the default cap already stored on the semester. The event form does not send a credit cap.

**Where the cap still exists (not removed):**

- Semester row `semesters.max_credits` (default 21), set when a Semester calendar event is created if no other value is stored
- Student **Register for courses** and onboarding, which block registration above that number
- Course registration PDF totals ("N of M credits")
- API `createAcademicCalendarEvent` / `updateAcademicCalendarEvent` still accept `maxCredits` if a caller sends it; the screen does not

**Status:** Done

---

## 4. Assigned lecturer saved when a course is added

**Problem:** Choosing **Assigned Lecturer** on Add Course saved the course, but the catalogue row stayed empty until the course was edited and the lecturer was chosen again.

**Cause:** The lecturer is stored on the semester offering that was selected. The catalogue only read the offering for the semester marked current. A lecturer assigned to another semester on the dropdown did not appear on the row.

**What must happen:** After confirm and save, the catalogue row shows that lecturer. Edit still loads the same lecturer and semester.

**Status:** Done

---

## 5. Timetable: Academic Admin sets the week, lecturer confirms, then students see it

**Problem:** Lecturers created slots, and those slots went live for students immediately. The local week also held double-booked classes.

**What must happen:**

1. Local timetable rows that were already saved are cleared.
2. Academic Admin adds a class: course, lecturer, day, time from–to, and location. Confirm, then save.
3. The lecturer is notified at once and can **Confirm availability**, or **Request a change** with a reason.
4. Students do not see the class on the timetable or dashboard calendar until the lecturer confirms.
5. When the lecturer confirms, registered students are notified at once and the class appears on their timetable without a manual refresh.
6. A change request is visible to Academic Admin. Editing the class sends it back to the lecturer to confirm again.
7. A room or lecturer still cannot be booked twice.

**Status:** Done
