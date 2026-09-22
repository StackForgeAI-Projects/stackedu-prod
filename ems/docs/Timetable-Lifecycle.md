# Timetable lifecycle

Plain-English path for class times and rooms. Dates on these screens are **DD-MM-YYYY**. Times follow the institution clock (**Africa/Kigali**, set under ICT **System Settings**).

The timetable is the **weekly room and clock time**. It is not course registration, and it is not the live video classroom.

## Who does what

- **Academic Admin** assigns a lecturer to a course, then **reviews** the live week. They do not add slots on this page. Click a class to see when, where, and who teaches it. If a hall is needed for something else, they send a message to the lecturer who booked it.
- **Lecturer** adds, changes, or removes class times for courses they are assigned to. Confirm before save. If that room is already booked in that time, the save is **refused** — the room is not available. The lecturer who holds a room gets a notification when Academic Admin asks them to free it.
- **Student** sees only **Approved** classes this semester. They can set a StackEDU reminder (email + in-app). They cannot edit the grid.
- **ICT Manager** sets the institution **timezone**, turns **Resend** on if reminder emails should send, and can grant `timetable.write` on **Access levels** (a room or lecturer still cannot be booked twice). ICT does not build the week grid.
- **Bursar**, **Librarian**, and **Applicant** are not on this path.

Classes appear on student and Academic Admin screens as soon as the lecturer saves. There is no extra Publish button.

A room with no name (TBA) is not treated as a hall clash. A lecturer teaching two overlapping classes is always a clash, even in different rooms. Back-to-back classes (one ends at 10:00, the next starts at 10:00) are allowed.

---

## 1. Put people and courses in place (ICT, then Academic Admin)

1. ICT creates the lecturer login.
2. Academic Admin creates the course, chooses the semester, and assigns the lecturer. Confirm, then save.
3. ICT sets **Timezone** (keep `Africa/Kigali` in Rwanda) under **System Settings**.
4. ICT turns **Resend** on under **Integrations** if students should get reminder emails. If Resend is off, reminders still save in the app.

---

## 2. Lecturer sets the week

1. Sign in as a lecturer. Open **Timetable**.
2. **Add slot**. Choose course, day, start, end, type, and optional room.
3. Confirm. If that room is already booked in that time, the save is refused: the room is not available, and the message names the day, time and course that holds it.
4. Edit or remove a slot the same way (confirm). Removing a slot does not drop the student from the course.

The slot then shows on the lecturer dashboard, Academic Admin **Timetable**, and (for registered students) the student **Timetable**.

---

## 3. Academic Admin reviews

1. Open **Timetable**.
2. Read the green **On this page** note: this is the live week. Lecturers pick day, time and room. You only review. You cannot edit a slot here.
3. Desktop: week grid. Phone: day lists.
4. Click a class to see code, time, room, type, and lecturer.
5. If you need that hall (urgent use, or another class), write a short message and confirm. The lecturer gets a notification (and a phone popup if their browser allowed it).
6. If a room or lecturer is already double-booked from older data, a red list names it. New saves cannot add another clash.

---

## 4. Student week and reminders

1. Open **Timetable** (after Classroom in the student navbar), or use dashboard **Schedule**.
2. Click a class. Set a reminder title, when to send, optional notes. Confirm **Save reminder**.
3. StackEDU emails an invitation (logo, when, where, course, type, notes) with a `.ics` file, and adds a **Calendar** notification. A bell marks the class.
4. At the remind-at time, StackEDU emails again and notifies in the app, then rolls the time forward one week.
5. Change or remove the reminder from the same panel. Confirm.

Email uses Resend. If Resend is off, the reminder and in-app notice still save.

See `Timetable-Reminders-Implementation.md` for the mail file format.

---

## 5. If something looks wrong

| What you see | What to do |
| --- | --- |
| Empty Academic Admin grid | Lecturer has not added slots yet. |
| Empty student grid | Student is not **Approved** for those courses, or no slots exist. |
| Red clash on Academic Admin | Lecturer must move a class. Open the class and message them if you need the hall now. New saves cannot add another overlap. |
| “Room is not available” on save | That hall is already booked in that time. Pick another room or time. |
| Lecturer did not see a room request | Check Notifications. On a phone, allow browser notifications, keep the tab open (even minimised). |
| Reminder saved but no email | ICT: turn Resend on and save the API key. |
| Lecturer cannot add a slot | They need a course assignment this semester (`timetable.write`). |

ICT, Bursar, and Librarian have no Timetable menu. Live video stays on **Classroom**.
