# Student fixes

This window implements **student** product fixes only. Other roles have their own files in this folder.

Dates on student screens stay **DD-MM-YYYY**. Creates, updates, and deletes still go through `ConfirmAlertDialog`. Icon-only controls use `IconActionButton` with a tooltip.

---

## 1. Course registration — programme / department only

**Problem:** On **Register for courses** (`/student/course-registration`), the student sees every offering in the current semester, including courses that belong to other departments and other programmes.

**What must happen:**

1. The student only sees courses that belong to **their programme of study / department**.
2. Courses from other departments must not appear on the **Available** list.
3. The API must enforce the same rule. A student must not be able to register for a course outside their programme department by posting an offering id.
4. A course the student already registered (Approved or Pending) still appears under **Already registered**, even if it was later moved or was from another department, so they can still see it and drop it.
5. After they drop that other-department course, it must not come back on **Available**.
6. The page should make the scope clear (programme and department names).
7. Confirm still checks fee hold, open semester, course lock, and the credit cap. Those rules do not change.

**Where it lives:**

- API: `getRegistrationState` and `registerForCourses` in `ems/apps/api/src/services/student.ts`
- Screen: `ems/apps/web/src/routes/_auth/student/course-registration.tsx`
- Lifecycle copy: `ems/docs/Course-Registration-Lifecycle.md`
- Tester guide: `ems/docs/user-guides/student-guide.md`

**How the catalogue is scoped today:** a course belongs to a department. A programme belongs to a department. The student belongs to a programme. There is no separate programme-to-course table. So “programme of study / department” means: offerings whose course is in the **same department as the student’s programme**. That matches how Academic Admin already builds a programme’s “Courses by Year” list.

**Status:** Implemented in this session.

---

## Not in this window

Lecturer “module before material”, form info boxes on every side modal, and the 14 MB upload / auto-compress rule are listed in `lecturer-fixes.md` and `general-fixes.md`. Do not implement them here.
