# LMS and classroom lifecycle

Plain-English path for how a course is set up, taught, joined live, marked, and closed in StackEDU. Dates on these screens are shown as DD-MM-YYYY.

A live class is not the same thing as the attendance register. Opening a video room does not mark a student Present. The lecturer still takes attendance on **Attendance**.

## Who does what

- **Academic Admin** creates programmes, courses, and the semester offering. They assign a lead lecturer to a course for a semester, open the calendar and timetable, and later approve result batches. They do not run the live room, upload course files, or mark assignments.
- **ICT Manager** creates user accounts (including lecturers and students). They turn LiveKit on under **Integrations** so video can start. They set the attendance edit window and the classroom recording keep-window under **System Settings**. They do not teach, join a class as a student, or see course materials.
- **Bursar** can place or release a fee hold on a student account. A hold blocks **course registration**. It does not by itself lock an already enrolled student out of materials or the live room.
- **Lecturer** owns the course they are assigned to: modules, materials, announcements, discussions, assignments, quizzes, live classes, the attendance register, grades, and the draft results they submit for review.
- **Student** must be enrolled (**Approved** registration) on that offering. Then they can open published content, join a class that is **Live**, submit work, post in discussions, ask the study assistant, view attendance, and download a recording or a published class summary.
- **Librarian** owns the e-library only. Course files do not go through the librarian. The study assistant may cite a published library title when a student asks a course question.
- **Applicant** has no LMS and no classroom until they are admitted and become a student.

A lecturer only sees offerings they are assigned to. A student only sees offerings they are enrolled on. Academic Admin, ICT, Bursar, and Librarian cannot open lecturer or student classroom screens.

---

## 1. Put the course on the books (Academic Admin)

Nothing in the LMS exists until the course is in the catalogue and offered this semester.

1. Open **Courses**.
2. Add a course (code, name, department, credits, compulsory or elective, description, optional prerequisite courses). Confirm, then save. Or import a spreadsheet and confirm the import.
3. Choose the **semester** and the **lead lecturer**. A lecturer cannot be assigned without a semester. Confirm.
4. The system creates (or reuses) the offering for that course in that semester and stores the lead lecturer on it.
5. Optionally archive or delete a course (confirm). Archive hides it from active teaching; delete removes the catalogue row when the rules allow it.

Also needed around this:

- **Programmes** — the student’s programme is what they belong to.
- **Faculty** — people and departments that sit behind the course list.
- **Calendar** — academic year, semester, and whether registration is open.
- **Timetable** — room and time for in-person slots. Lecturers set times; Academic Admin reviews; a room or lecturer cannot be double-booked. Students see their approved week. See `Timetable-Lifecycle.md`. This is not the live classroom. A live class is scheduled separately by the lecturer (section 8).

ICT must already have created the lecturer and student accounts (email, role, password) under **User Management**. Academic Admin cannot invent a login.

---

## 2. Turn live video on (ICT Manager)

Lecturers can still **schedule** a class without LiveKit. Students cannot see video until LiveKit is on and the three keys are saved.

1. Open **Integrations**.
2. Open **LiveKit**.
3. Paste the WebSocket URL (for example `wss://your-project.livekit.cloud`), API key, and API secret.
4. Turn the service **on**.
5. Confirm **Save**.
6. **Check connection**. A pass means LiveKit accepted the URL and key pair. A fail means the saved key does not match that project — fix the key and check again. A server crash is not the expected result.

Recording a live class also needs object storage (R2) on the server. Local disk cannot receive a live recording. The Record button will say so.

While the class is live, marks on the whiteboard go out on the video room and are also saved. A short refresh keeps a reload in sync. If a separate collaboration URL is set, that is used as well. After the class ends, the board is a snapshot only.

---

## 3. Enrol the student

The full path (catalogue, calendar, fee hold, credit cap, and the coloured status boxes) is in `Course-Registration-Lifecycle.md`.

1. Academic Admin opens the semester on **Calendar** (category **Semester**, dates that include today). Dashboard shortcut: **Open registration**. They can also **edit** that event.
2. Academic Admin opens a course for registration on **Courses** → **Edit Course** (**Open for registration**). The semester can be open while a single course is closed.
3. The student opens **Register for courses** (onboarding, dashboard **Register now**, or **My Courses**).
4. A filled **info** box shows **Registration is open** or **Registration is closed**. Closed uses the info background so it is not a faint line of text. A **fee hold** uses an error box. Going over 21 credits uses a warning box. A course closed on Edit Course shows a **Closed** badge on the available list.
5. Tick boxes and **Confirm registration** stay off when the semester is closed or a hold is on. A closed course cannot be ticked even when the semester is open.
6. They tick open offerings within 21 credits and confirm. New rows are **Approved**. They land on **My Courses**.

A student who is not enrolled cannot join that live class, open that course, or download that recording.

---

## 4. Lecturer prepares the course (Course Management)

Open **Course Management**, pick the course.

### Modules

A module is a named part of the course. It could be Week 1, Week 2, and so on. It is a simple way to break learning into smaller bits for students. You add pages, files, and other course content inside it. Students open that content by module.

1. **Add module**. Title, optional summary, optional **prerequisite** (another module on the same course). A module cannot require itself, and two modules cannot point at each other in a loop.
2. Turn **Publish** on when students may see it. Leave it off for a draft.
3. Confirm, then save.
4. Edit later the same way. **Delete this module?** confirms removal. Materials in it are not deleted; they become ungrouped.

A published module with a prerequisite stays locked for the student until they have **opened every published material** in the earlier module.

### Materials (pages, files, links)

1. **Add material**. Title, optional body text, optional link (`https://…`), optional file.
2. Files: PDF, Word, or image. Maximum 14 MB. A file over 14 MB opens a size dialog; images are reduced automatically when possible. A course must have at least one module before material can be added.
3. Attach it to a module. Material always belongs to one module.
4. Optionally use **Describe** to draft a description. Read it before you save.
5. Publish when students may see it. Confirm, then save.
6. Enrolled students are notified when a material is **published**.
7. Edit or delete (confirm). Unpublished items leave the student course.

Storage keys never go to the browser. A download is a short-lived signed link.

### Announcements (one-way)

1. Open **Announcements** on Course Management.
2. Write title and body. Optionally pin. Draft or publish.
3. Confirm, then save. Published announcements notify enrolled students.
4. They appear at the top of the student’s **Course** page. Students cannot reply here.

### Discussions (two-way)

1. **Start discussion**. Title, prompt, optional **Graded**, publish switch.
2. Confirm **Start this discussion?**
3. If graded, a coursework assessment is created for the same title (no file/text submission on that paper — the mark is given later on **Submissions**).
4. Published discussions notify enrolled students.
5. Lecturer and enrolled students can reply until the lecturer **Close this discussion?**
6. **Remove discussion?** deletes the thread.

Announcements stay one-way. Discussions are the place to reply.

### Live classes from this screen

The same **Course Management** page lists live classes for that offering. Scheduling is described in section 8. You can also schedule from **Classroom**.

---

## 5. Student uses the course

1. Open **My Courses**, then the course.
2. Read **Announcements**.
3. See **Live classes** (scheduled, live, or ended — not cancelled).
4. Use **Study assistant** if they want help with published materials (section 11).
5. Open **Discussions**, read, reply if the thread is open.
6. See **Attendance** (read-only: date, topic, Present / Late / Absent, and a rate). This list comes from the lecturer’s register, not from LiveKit joins.
7. Open **Course content**. Locked modules show a lock and the reason (finish the earlier module first). Open a page, follow a link, or download a file. Opening records progress.
8. Open **Assignments**. **Submit** goes to **Submit assignment** when that item accepts submissions.

Unpublished modules, materials, announcements, discussions, and assignments never appear.

---

## 6. Assignments, quizzes, and marks

### Create coursework (Lecturer — Assignments)

1. Open **Assignments**.
2. Add title, course, type (for example coursework), weight, total marks, optional due date, publish.
3. Confirm, then save. Published items notify enrolled students.
4. Status on the list: Draft, Active, Closed (due date passed), or Graded (every enrolled student has a mark).
5. Open a row to go to **Submissions**.

An assignment with student work already handed in cannot be deleted.

### Create a quiz (Lecturer — Assessment Builder)

1. Open **Assessment Builder**.
2. Questions live in the **institution** question bank (not only in one course). Types: multiple choice, true/false, short answer.
3. Add a question by hand, generate drafts with AI, or import from a document. Confirm creates.
4. Editing a question that students have already answered keeps the old version for those answers and stores a new version. History is not rewritten.
5. Pin chosen questions onto a quiz assessment for a course. Set weight and publish like any other assessment.
6. Published quizzes notify enrolled students.

### Student hands work in

1. Open **Submit assignment** (or **Submit** from the course).
2. Text assignment: write the answer.
3. Quiz: answer every question.
4. Confirm **Submit this assignment?** (or the quiz wording).
5. They cannot submit twice.
6. Late is frozen at the moment of submit. Changing the due date later does not rewrite who was late.
7. A quiz is auto-marked. A text assignment waits for the lecturer.

### Lecturer marks (Submissions)

1. Open **Submissions** for that assessment.
2. Move one student at a time. See the submission, enter the mark (and component scores when the paper has parts). Component scores always add up to the mark.
3. Write feedback.
4. Confirm save. That writes the grade and updates the **draft** result for the course. It does not publish the transcript.

Graded discussions are marked the same way on the linked assessment.

---

## 7. Attendance register (separate from live class)

1. Lecturer opens **Attendance**, picks the course.
2. Start a session (date, topic). Mark each enrolled student Present, Late, or Absent.
3. Confirm and submit.
4. ICT **System Settings** control whether a submitted register can still be edited, and for how many minutes.
5. View, edit (if the window allows), or delete a session (confirm).
6. The student sees those rows on the course. Analytics uses this register, not who clicked Join class.

---

## 8. Live classroom

Statuses: **Scheduled** → **Live** → **Ended**. Or **Cancelled** before it starts. A class that has started cannot be cancelled; it must be **ended**.

### Schedule (Lecturer)

1. Open **Classroom**, or **Course Management** for that course.
2. Title, course, optional date and time.
3. Confirm **Schedule this live class?**
4. Status becomes **Scheduled**. Students see it on **Classroom** and on the course. They cannot join yet.
5. No student notification is sent at schedule time.

### Cancel (Lecturer, before it goes live)

1. **Cancel** on a Scheduled row.
2. Confirm **Cancel this class?**
3. Students no longer see it. It cannot be started afterwards.

### Start and join (Lecturer)

1. Open the class (**Live class**).
2. If it is still Scheduled: confirm **Start this class?** It becomes **Live**. Enrolled students can now join. If LiveKit is configured, the video room is created.
3. **Join as host** (or Start already joins). The lecturer is recorded as host. Video appears when LiveKit is configured; if it is not, the class is still Live but there is no camera tile.
4. Whiteboard is editable while the class is Live.

### Join (Student)

1. Open **Classroom** or the course **Live classes**.
2. Open the class. If it is still Scheduled they see that it has not started. There is no join button.
3. When status is **Live**, tap **Join class**. They must be enrolled. They join as a participant. Video appears if LiveKit is on.
4. They can draw on the whiteboard while it is Live.
5. Fee hold is not checked again at join. Enrolment is.

### Record (Lecturer, only while Live)

1. On **Classroom**, the lecturer can turn **Automatically record live classes** on or off (confirm). When it is on, starting the class also starts a recording if LiveKit and object storage allow it.
2. Confirm **Start recording?** Needs LiveKit and R2 storage. A red **Recording** notice stays on the video until it is stopped.
3. Confirm **Stop recording?** when done. That saves the file for download. Ending the class also stops a recording that is still going and saves it.
4. Status goes Pending, then **Ready**. Lecturer and enrolled students can **Download** a Ready recording (signed, short-lived link) until ICT’s keep-window ends.
5. When a recording becomes **Ready**, every enrolled student on that course (in class or not) is notified to download it, with the date and time it will be removed. A reminder is sent as that time gets close. After the window, the file is deleted.
6. A class may stay Live for an hour or more. The recording keeps going while people are in the room.
7. If the live room is empty and a recording is still Pending, the leftover is stopped and deleted. Students are not told to download it.

ICT sets the keep-window under **System Settings** (hours or days). The default is 72 hours.

### During a live class

- The lecturer can confirm **Mute all students?** to silence every student microphone. The lecturer stays unmuted. Students may unmute themselves.
- On the live video and in picture-in-picture, **Mute all**, **Full screen**, **Back to class**, **Leave**, and **End class** are icons. Hover shows the name. The icon background is a calm ink surface.
- The **Leave** icon drops that person from the room. Picture-in-picture does not open.
- Opening another portal page while still in the class keeps the call in picture-in-picture. Opening the class page again puts the video back.
- The live class page does not scroll sideways.
- The whiteboard stays in sync for everyone in the live class. A reload shows the latest saved board.

### End (Lecturer)

1. Confirm **End this class?**
2. Students drop from the room. The whiteboard becomes read-only for **everyone**. Status **Ended**.
3. Nobody can add marks after end. The board stays as a snapshot.

### Summary (Lecturer, after end)

1. Confirm **Draft a class summary?** A short recap is written (with a fallback if AI is off). Students cannot see it yet.
2. Review the text. Confirm **Publish this summary?**
3. Students then see **Class summary** on that class. Until publish, they do not.

Who joined is counted when someone presses Join (host or student). Leaving is not tracked as a separate step. That count is for the summary and the class list (“N joined”). It is not attendance.

---

## 9. After class — what the student can still open

On an **Ended** class:

- No live video.
- Whiteboard (view).
- **Recordings** that are Ready and still inside the ICT keep-window (download). After that window the file is gone.
- **Class summary** only if the lecturer published it.

Cancelled classes do not appear for the student.

---

## 10. Results the academic office can stand behind

Marks in the LMS and the official result are the same records. There is no second gradebook to export.

1. Quiz auto-marks and lecturer **Submissions** both feed a **Draft** result for the offering (weighted from the assessments that already have grades).
2. Lecturer can also type semester totals on **Results** and save a draft. Every enrolled student needs a mark before submit.
3. Confirm **Submit for publishing**. Status **Pending review**. Academic admins are notified.
4. Academic Admin opens **Results** (Result Management), **Pending Approval**, reviews, then:
   - **Approve and publish** (confirm), or
   - return the batch with a reason (confirm).
5. The lecturer is notified of approve or return. A returned batch can be edited and submitted again.
6. The student **Results** page shows batches that are **Published**. Until then they work from assignments and feedback on the course, not from the official results list.

**Published Results** on the lecturer side is a review screen for already published papers, not the place to change marks.

---

## 11. Study assistant (Student only)

1. On the course, open **Study assistant**.
2. Ask a question. Confirm **Ask the study assistant?**
3. Answers come from **published course materials** and **published library titles**. The reply should name those sources.
4. It will refuse graded quizzes, exams, and “write my assignment” requests.

Lecturers, academic admins, ICT, bursar, and librarian do not get this panel.

---

## 12. Analytics and at-risk

**Lecturer — Analytics**

- Who is enrolled.
- Attendance rate from the **register**.
- How many published materials each student opened.
- Average score from **grades**.
- Fee balance.
- At-risk level when the AI risk score exists.

This is one picture: a student who stopped opening files and also stopped attending is one row, not two products.

**Academic Admin — student record**

The same engagement rows can appear on the student profile (per offering). Academic Admin still does not enter the live room or Course Management.

**Lecturer — At-Risk** and **Academic Admin — At-Risk** use the institution risk list. They are not a substitute for taking attendance or publishing materials.

---

## 13. Notifications (who is told)

| What happened | Who is told |
| --- | --- |
| Material published | Enrolled students |
| Announcement published | Enrolled students |
| Assignment or quiz published | Enrolled students |
| Discussion published | Enrolled students |
| Recording ready to download | Enrolled students (present or absent) |
| Recording about to be removed | Enrolled students (present or absent) |
| Results submitted for review | Academic admins |
| Results approved or returned | The lecturer who submitted |

Scheduling, starting, ending, or cancelling a live class is written to the audit log. Enrolled students are not emailed for those classroom actions. They see the new status when they open **Classroom**. Recording notices are in-app only.

Each role reads their own **Notifications** page.

---

## 14. Confirm before it is saved

Creates, updates, and deletes use a confirm dialog. The form collects the values; the dialog is what commits them. Deletes use the destructive tone.

Examples: schedule class, cancel class, start class, record / stop recording, mute all students, auto-record setting, end class, draft summary, publish summary, save module/material/announcement, start/close/delete discussion, submit assignment, ask the study assistant, save a grade, submit results, approve or return results, submit attendance, delete an attendance session.

**Join class** (student) and **Join as host** (lecturer, already Live) are immediate joins, not a second confirm.

---

## 15. What each role never does here

- **Applicant** — no courses, no live class.
- **Librarian** — no course files, no live class (e-library only).
- **Bursar** — no teaching screens. Fee hold only blocks **registration**.
- **ICT Manager** — LiveKit keys, attendance policy, and recording keep-window only. No host controls, no marking.
- **Academic Admin** — no host controls, no uploading week-1 PDFs, no joining as a student. They set the course, the lecturer, the calendar, and they approve results.
- **Lecturer** — cannot open another lecturer’s offering they are not assigned to. Cannot join as a student.
- **Student** — cannot schedule, start, record, end, or publish a summary. Cannot see drafts. Cannot open a locked module. Cannot join until the class is Live.

File storage keys and LiveKit secrets never appear in the browser after save.
