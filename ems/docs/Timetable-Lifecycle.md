# Timetable lifecycle

Plain-English path for class times and rooms. Dates on these screens are **DD-MM-YYYY**. Times follow the institution clock (**Africa/Kigali**, set under ICT **System Settings**).

The timetable is the **weekly room and clock time**. It is not course registration, and it is not the live video classroom.

## Who does what

- **Academic Admin** builds the week. They choose the course, lecturer, day, time from–to, and location, then confirm and save. They can edit or remove a class. A change request from the lecturer shows on the class, with the reason.
- **Lecturer** does not add the class. They get a notice and either **Confirm availability** or **Request a change** with a reason. Students do not see the class until the lecturer confirms.
- **Student** sees only **Approved** classes this semester that the lecturer has confirmed. They can set a StackEDU reminder (email + in-app). They cannot edit the grid.
- **ICT Manager** sets the institution **timezone**, turns **Resend** on if reminder emails should send, and can grant `timetable.write` on **Access levels**. ICT does not build the week grid.
- **Bursar**, **Librarian**, and **Applicant** are not on this path.

There is no extra Publish button. The lecturer’s confirmation is what makes the class live for students. Editing a class sends it back to the lecturer to confirm again.

A room or lecturer cannot be booked twice in the same time. Back-to-back classes (one ends at 10:00, the next starts at 10:00) are allowed.

---

## 1. Put people and courses in place (ICT, then Academic Admin)

1. ICT creates the lecturer login.
2. Academic Admin creates the course, chooses the semester, and assigns the lecturer. Confirm, then save.
3. ICT sets **Timezone** (keep `Africa/Kigali` in Rwanda) under **System Settings**.
4. ICT turns **Resend** on under **Integrations** if students should get reminder emails. If Resend is off, reminders still save in the app.

---

## 2. Academic Admin sets the class

1. Sign in as Academic Admin. Open **Timetable**.
2. **Add class**. Choose course, lecturer, day, time from and to, session type, and location.
3. Confirm. If that room or lecturer is already booked in that time, the save is refused.
4. The lecturer is notified at once. The class stays off the student timetable until they confirm.
5. Open a class to edit or remove it. Confirm first. An edit asks the lecturer to confirm again.

Desktop shows a Monday–Friday grid. A phone shows a list for each day.

---

## 3. Lecturer confirms or asks for a change

1. Sign in as the lecturer. Open **Timetable**, or the notice.
2. Open the class. **Confirm availability** if the time works. Registered students are notified and the class appears on their timetable.
3. Or **Request a change**, write a short reason, and confirm. Academic Admin sees the reason. Students still do not see the class.
4. Confirming the same class again does not send a second student notice.

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
| Empty Academic Admin grid | No classes have been added yet. Use **Add class**. |
| Empty student grid | The student is not **Approved** for the course, or the lecturer has not confirmed the time. |
| Class says “Waiting for lecturer” | The lecturer has not confirmed. Students cannot see it yet. |
| Class says “Change requested” | Open it and read the lecturer’s reason, then edit the time or location. |
| Red clash | Two classes share a room or a lecturer. Edit one of them. New saves cannot add another overlap. |
| “Room is not available” on save | That hall is already booked in that time. Pick another room or time. |
| Lecturer did not see the new class | Check Notifications. The open app also refreshes notices without a reload. |
| Reminder saved but no email | ICT: turn Resend on and save the API key. |

ICT, Bursar, and Librarian have no Timetable menu. Live video stays on **Classroom**.
