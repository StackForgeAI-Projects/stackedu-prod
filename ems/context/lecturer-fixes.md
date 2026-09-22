# Lecturer fixes

This file lists lecturer product fixes. The student window does not implement these.

---

## What a module is

A **module** is a named part of a course. It could be Week 1, Week 2, and so on. It is a simple way to break learning into smaller bits for your students.

How it works on StackEDU:

- You add pages, files, and other course content **inside** a module. Students open that content by module.
- You must create at least one module on a course before you can add material.
- A module can have a **prerequisite** (another module on the same course). Students cannot open the later module until they finish the earlier one.
- **Publish** on a module is what lets enrolled students see it. A draft module stays hidden.
- Confirming **Add module** creates the module on that course. Confirming **Save module** updates the title, summary, publish setting, and prerequisite.

You may use Week 1, Week 2 as a pattern. Do not name a live course, person, or dummy school record.

---

## Info box copy (shared model)

Every form info box uses the same pattern, from `apps/web/src/lib/form-info-copy.ts`:

1. What this thing is (general — no live or sample records)
2. What confirming and submitting does
3. How that changes the rest of the system

Sentences stay short. No jargon. The box sits after the form title in the shared `FormInfoBox`.

---

## 1. Create a module before adding course material

**Problem:** On **My Courses** → **Course content**, the lecturer can click **Add material** and upload a file with no module on the course. Course Management already treats modules as the place pages and files live.

**What must happen:**

1. A lecturer cannot add material to a course until that course has at least one module.
2. On **Add material**, show an info control (tooltip on hover, or the same kind of info box).
3. The copy must say, in simple English: you need to create a module for this course first before adding a course material. If you have not created any, click here to create a module for this course.
4. That link opens the **Add module** side modal from **Course Management** (same form, not a second copy).
5. After the lecturer creates a module, they can add material and attach it to that module.
6. Confirm still wraps create and update.

**Status:** Implemented. `AddMaterialControl` disables **Add material** until the course has a module, shows the required hover copy, and links to Course Management with `addModule=true`. The **Module** field on **Add material** is a dropdown of that course’s modules, not a text box. `createLecturerMaterial` refuses a missing module. Confirm still wraps create and update. The Add module info box uses the shared module copy above, including the Week 1, Week 2 pattern.

---

## 2. Mute all students in a live class

**Problem:** The lecturer has no control to silence every student microphone at once.

**What must happen:**

1. While the class is **Live** and the lecturer has joined, show **Mute all**.
2. Confirm **Mute all students?** before the request is sent.
3. The server mutes every student microphone in the room. The lecturer stays unmuted.
4. Students can unmute themselves afterwards. The lecturer can mute all again.

**Status:** Implemented. `Mute all` on the live video confirms, then the API mutes every student microphone in the room.

---

## 3. Show that the class is being recorded, and let the lecturer auto-record

**Problem:** Starting a recording does not show a clear sign that the call is being recorded.

**What must happen:**

1. While a recording is in progress, show a visible **Recording** notice on the live video (full view and picture-in-picture).
2. On **Classroom**, the lecturer can turn **Automatically record live classes** on or off. Confirm before save.
3. When that setting is on, starting a class also starts a recording (if LiveKit and object storage allow it). The lecturer can still stop or start a recording by hand.

**Status:** Implemented. A red **Recording** notice sits on the video while a recording is pending. **Classroom** has **Automatically record live classes** (confirm). Starting a class then starts a recording when that setting is on.

---

## 4. Real-time whiteboard for every participant

**Problem:** Drawing and text on the whiteboard do not appear on the student side, even after reload.

**What must happen:**

1. While the class is **Live**, every participant sees the same board as others draw or type.
2. Sync uses the live video room when people have joined, and the saved board (with a short refresh) so a reload still shows the latest marks.
3. After the class ends, the board is a snapshot only.

**Status:** Implemented. While the class is **Live**, marks go out on the live video room and are saved to the board file. A short refresh keeps a reload in sync. After end the board is a snapshot.

---

## 5. Picture-in-picture when leaving the class page

**Problem:** Clicking another item in the left nav takes the lecturer or student out of the live class.

**What must happen:**

1. Leaving the live class page while still in the room must **not** drop the call.
2. Video and audio continue in a small picture-in-picture window so people can open other screens.
3. The small window can return to the class page, leave the room, or (lecturer) end the class.
4. Opening the same class page again puts the video back in the main stage.

**Status:** Implemented. `ClassroomLiveProvider` keeps the LiveKit room when the class page unmounts and shows a picture-in-picture window. **Back to class** returns. **Leave** drops the call.

---

## 6. Lock the whiteboard when the class ends

**Problem:** The lecturer can still draw after **End class**. A stale “still live” join state kept the board editable.

**What must happen:**

1. When status is not **Live**, nobody can add or change marks — lecturer or student.
2. The API refuses a save after the class has ended or been cancelled.
3. The board stays visible as a read-only snapshot.

**Status:** Implemented. The API refuses a save when status is not **Live**. The board remounts in view mode. A stale join no longer keeps the board editable.

---

## 7. No sideways overflow on the live class page

**Problem:** The live class page can scroll sideways.

**What must happen:**

1. The live class page stays within the screen width on phone, tablet, and computer.
2. Video and whiteboard stay inside their frames.

**Status:** Implemented. The live class page and the video/whiteboard frames use `min-w-0` and `overflow-x-hidden`.

---

## 8. Full screen video

**Problem:** Participants cannot make the live video fill the screen.

**What must happen:**

1. A **Full screen** control (with a tooltip) expands the video area only — not the whiteboard or the rest of the portal.
2. The same control exits full screen.

**Status:** Implemented. **Full screen** (tooltip) expands the video container. The same control exits.

---

## 9. Recording download window, student notices, and ICT expiry

**Problem:** Recordings stay on storage with no end date. Students are not told to download them. ICT cannot set how long a file is kept.

**What must happen:**

1. ICT sets how long a ready recording is kept (**hours** or **days**) under **System Settings**. Default is **72 hours**.
2. When a recording becomes ready, every enrolled student on that course (present or absent) gets a notice to download it, including the date and time it will be removed.
3. A reminder notice is sent as that time gets close.
4. When the window ends, the file is deleted from storage and removed from the class page. Download then fails.
5. Dates on notices use **DD-MM-YYYY**.

**Status:** DONE. Ready recordings get an expiry from the ICT keep-window (default 72 hours). Enrolled students are notified to download, then reminded. A hourly job deletes the file when the window ends.

---

## 10. Live video and picture-in-picture controls show their labels

**Problem:** On the live video and in picture-in-picture, controls such as **Full screen** only show an icon. The name appears on hover. People cannot tell what the control is until they hover.

**What must happen:**

1. Every control on the live video and in the picture-in-picture window shows its name **before** hover (full view and picture-in-picture).
2. **Full screen** / **Exit full screen**, **Mute all**, **Back to class**, **Leave**, and **End class** keep that visible text on phone, tablet, and computer.
3. Hover still works. It must not be the only way to read the name.

**Status:** DONE. Overlay controls use a labelled button. The name stays visible on the video and in picture-in-picture.
