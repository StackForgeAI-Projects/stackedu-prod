# Course and course-registration lifecycle

Plain-English path for how a course is put on the books and how a student registers for it. Dates on these screens are shown as DD-MM-YYYY.

This file is the registration path. Teaching after enrolment (materials, live class, marks) is in `LMS-Classroom-Lifecycle.md`.

## Who does what

- **ICT Manager** creates the student and lecturer logins under **User Management**. They do not open registration and they do not pick courses for a student.
- **Academic Admin** creates programmes, the course catalogue, the semester offering, and the lead lecturer. They open the **semester** on **Calendar** (category **Semester**). They open or close a **single course** on **Edit Course**. The academic dashboard shortcut **Open registration** goes to the calendar.
- **Bursar** places or releases a **fee hold** on **Student account**. A hold blocks new course registration. It does not drop courses already registered.
- **Student** registers for themselves on **Register for courses**. They can also start from **Onboarding**, the dashboard (**Register now**), or **My Courses**.
- **Lecturer** does not register students. After a student confirms, the offering’s enrolled count goes up and the student appears on that lecturer’s roster.
- **Librarian** is not in this path.
- **Applicant** cannot register for courses. They must be admitted and signed in as a student first.

A student cannot drop a course from this screen. There is no bursar, ICT, academic, or lecturer “register this student” button. The student confirms their own list.

---

## 1. Create the people (ICT Manager)

1. Open **User Management**.
2. Create the lecturer and the student (email, name, role, password). Confirm, then save.
3. Academic Admin cannot invent a login. Without these accounts there is no lecturer to assign and no student to register.

---

## 2. Put the course on the books (Academic Admin)

Nothing appears on **Register for courses** until the course is in the catalogue **and** offered in the **current** semester.

1. Open **Programmes** if the student’s programme is not there yet. Confirm, then save.
2. Open **Faculty** as needed for departments and teaching staff records.
3. Open **Courses**.
4. Add a course: code, name, department, credits, compulsory or elective, description, optional prerequisite courses. Confirm, then save. Or import a spreadsheet and confirm the import.
5. Choose the **semester** and the **lead lecturer**. A lecturer cannot be assigned without a semester. Confirm.
6. The system creates (or reuses) the **offering** for that course in that semester and stores the lead lecturer on it. That offering is what the student ticks later.
7. Archive a course (confirm) if it must not appear as active for new work. Delete (confirm) is refused if students are already enrolled.

**Timetable** is the room and clock time. It is not course registration. A student can register without a timetable slot.

---

## 3. Open or close registration (Academic Admin)

There are two locks. Both must be open for a student to tick a course.

### Semester lock (Calendar)

Student registration for the form as a whole is open only when there is a **current** semester whose status is **Open** or **In progress**. Planned, closed, or “no current semester” means the student sees **Registration is closed**.

#### Open the semester

1. From the academic dashboard, **Open registration**, or go to **Calendar**.
2. Add or **edit** a calendar event with category **Semester** (not “Registration”). Title, start date, end date. Confirm, then save.
3. If today’s date sits inside that start–end range, that semester becomes **current** and **Open**. Students can then confirm new courses (for offerings that are also open — see below).
4. If the dates are in the future, the semester is stored as **Planned**. Students still see **Registration is closed** until the dates include today (edit the semester event so the range covers today, confirm, save).

#### What a “Registration” calendar event is

A calendar item with category **Registration** is a notice on the calendar (exams, holidays, and deadlines work the same way). It does **not** by itself open the student form. Only a **Semester** event changes semester status.

Students and lecturers get an in-app notification when a calendar event is created or edited. Students also see published events on the dashboard **Deadlines** list.

#### Close date on the student page

A semester can also store a registration-close date. When that date is present it is shown on **Register for courses** in the **Registration is open** info box (DD-MM-YYYY) and on the student dashboard as “Course registration closes”. The lock on the **Confirm registration** button still follows semester status (open / in progress versus closed).

### Course lock (Edit Course)

Each offering has its own **Open for registration** switch. The database default is open. Academic Admin turns it off or on on **Courses** → **Edit Course**.

1. Open **Courses**, edit the course.
2. Choose the **semester** (the current semester when that offering is this term).
3. Turn **Open for registration** on or off. Confirm, then save.
4. The catalogue **Registration** column shows **Open** or **Closed** for the current-semester offering.
5. A closed course stays on the student **Available** list with a **Closed** badge. The tick box stays off. Confirm still rejects it.
6. Students and lecturers are notified when a course is created, updated, opened, or closed.

Semester open + course closed = that course cannot be ticked. Semester closed = no new ticks, even if a course is open.

---

## 4. Fees and holds (Bursar and Student)

1. The student reviews fees on **Fees** or in **Onboarding** (Fees step). Paying down the balance is on **Fees**.
2. If the bursar applies a **fee hold** on **Student account**, they confirm **Apply fee hold**.
3. On **Register for courses** the student then sees a red **Fee hold** box: they must pay, then the bursar confirms **Remove fee hold**.
4. Tick boxes and **Confirm registration** stay off while the hold is on.
5. Courses already confirmed stay registered. The hold only blocks **new** registration.

---

## 5. Student onboarding step

After admission, **Onboarding** includes a **Register** step.

1. The step shows credits already registered (out of 21) and mentions a fee hold if one is on.
2. **Register courses** opens **Register for courses**.
3. **Continue** marks the onboarding step done. It does not register courses by itself. The student must still confirm on the registration page while it is open.

---

## 6. Register for courses (Student)

Open **Register for courses** from onboarding, the dashboard, or **My Courses**.

### Status boxes (always visible)

These sit under the credit line. They use a filled background so closed, open, hold, and over-limit are not a single line of faint text.

| Box | Background | When |
| --- | --- | --- |
| **Registration is closed** | Info (`--info-bg`) | Semester is not Open or In progress, or there is no current semester. Tick boxes and Confirm are off. Already-registered courses still list. |
| **Registration is open** | Info (`--info-bg`) | Semester is Open or In progress. Close date is included when the semester has one. |
| **Fee hold** | Error (`--error-bg`) | Bursar hold is on. Same lock as closed for new ticks. |
| **Credit limit** | Warning (`--warning-bg`) | Ticked extras would go over **21** credits, or the student is already over the cap. Confirm stays off. |

### What is on the page

1. **Credits used** — already registered credits out of **21**.
2. **Already registered** — courses with status Approved or Pending. “None yet” if empty. This list is visible even when registration is closed.
3. **Available** — other offerings in the **current** semester. Each row is code, name, credits, and Compulsory or Elective.
   - Compulsory means the course’s year matches the student’s year of study.
   - Elective means it does not.
   - A course closed on **Edit Course** still lists here with a **Closed** badge. Its tick box stays off.
4. Tick offerings (only while registration is open, there is no fee hold, and that course is open for registration).
5. **Confirm registration**. The button stays off when nothing is ticked, registration is closed, a fee hold is on, the 21-credit cap would be broken, or the save is already running.

### What happens on confirm

1. The server checks fee hold, open semester status, that every id is an offering this semester, that each new offering is **open for registration**, and the 21-credit cap. If any check fails, the student sees the error and nothing is saved.
2. New rows are stored as **Approved** with the time of registration. Courses already on the list are skipped (no double row).
3. The offering **enrolled** count goes up by one.
4. The student is sent to **My Courses**.

There is no drop, wait-list, or academic “approve this registration” step after confirm. Status **Pending** is treated as already registered if it exists; new confirms write **Approved**.

---

## 7. After registration

- **My Courses** lists Approved registrations for the current semester. Empty state links back to **Register**.
- Opening a course is the LMS path (materials, live class, assignments). See `LMS-Classroom-Lifecycle.md`.
- The lecturer sees the student on the course roster and in attendance.
- Academic Admin cannot delete a course that already has enrolments.
- Timetable slots for those offerings appear on the student dashboard when Academic Admin has built the timetable.

---

## 8. If registration looks closed and it should not

Work top to bottom. Semester closed hides ticks for every course. A single course can still be closed while the semester is open.

1. Academic Admin: **Calendar** — is there a **Semester** event whose dates include today? Click the event (or the edit control) and confirm the dates if not. Saving an edited Semester event that covers today opens that semester.
2. Bursar: is a fee hold on that student? Release it if fees are clear.
3. ICT: is the person actually a **Student** account?
4. Academic Admin: is the course offered in **that** current semester (semester chosen on **Edit Course**, ideally with a lecturer assigned)?
5. Academic Admin: is **Open for registration** on for that course? The catalogue **Registration** column must read **Open**. If it is **Closed**, edit the course, turn the switch on, confirm, save.

The student should then see the **Registration is open** info box, be able to tick **open** courses, and use **Confirm registration**. Closed courses stay listed with a **Closed** badge until Academic Admin opens them.
