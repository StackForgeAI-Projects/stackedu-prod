# StackEDU LMS versus Canvas

Internal reference for Part A of the Real-Time LMS build. Canvas by Instructure
is the reference model because it is the most widely used higher education LMS,
so its structure is what lecturers already expect and its long running
complaints are a free list of things not to repeat.

Read this before starting any Part A batch. Every later batch in Part A should
be able to point at a row here and say which line it is implementing.

## 1. How StackEDU already differs in shape

Canvas is a standalone LMS. Institutions bolt a student information system onto
it and reconcile grades between the two. StackEDU is the student information
system, so the LMS is being added inside the same database as admissions,
registration, attendance, results, fees, and the library.

That single difference decides most of the design choices below. StackEDU does
not need a gradebook that exports to somewhere else, because the marks a
lecturer enters are already the marks the results engine grades and the
transcript prints.

## 2. Area by area

### Course structure

| | |
| --- | --- |
| Canvas | A course holds Modules. A module holds pages, files, assignments, quizzes, discussions, text headers, and external links in an ordered list. Modules take completion Requirements, a Lock Until date, and Prerequisites naming earlier modules. Requirements can be "complete all" or "complete one", and optionally in sequential order. A prerequisite only blocks anything if the earlier module itself has requirements, which is a common setup mistake. |
| StackEDU today | `course_materials` has a flat `module_name` text column grouping items into weeks, plus `is_published`. No ordering, no prerequisites, no completion tracking. The lecturer screen `course-management.tsx` is still on mock data from `@/data/lecturer`. |
| What we build | Real modules with an explicit sequence, holding pages, files, and links. An optional prerequisite on a module, and the simple case stays simple: a course with no prerequisites set behaves exactly as it does now. |
| What we improve | A module's prerequisite works on its own. StackEDU does not require the lecturer to also configure completion requirements on the earlier module before locking will take effect. If a prerequisite cannot take effect, the screen says so at the moment it is set, not silently. |

### Assignments and submissions

| | |
| --- | --- |
| Canvas | Four online entry options: text entry, website URL, media recording, and file upload, selectable together on one assignment. File types can be restricted by extension. Separately there are On Paper and No Submission types that exist only to create a gradebook column. |
| StackEDU today | `assessments` already carries `type`, `weight`, `total_marks`, `due_at`, `accepts_submissions`, and `allow_late_submission`. `submissions` carries `text_response`, `status`, `attempt_number`, and `is_late` recorded at submission time. `submission_files` holds uploaded files by object key. Weighting is per assessment rather than per category. |
| What we build | Wire the existing tables to the placeholder screens. Text entry and file upload are the two submission types for this phase. |
| What we improve | `is_late` is already frozen at submission time, so moving a deadline later cannot rewrite who was late. Canvas recalculates lateness from the current due date. We keep our behaviour and make it visible in the grading view. |

### Grading

| | |
| --- | --- |
| Canvas | SpeedGrader shows one submission at a time with the document on the left and grade, rubric, and comments on the right. Rubrics score per criterion with per criterion comments, and populate the grade automatically only if the rubric was flagged for grading before marking started. DocViewer gives inline point, highlight, strikeout, and free draw annotations on uploaded files. |
| StackEDU today | `grades` holds `score`, a `component_scores` jsonb breakdown mirroring `assessment_components`, `feedback`, `graded_by`, and `graded_at`. `result_batches` is the review and publish gate. `submission-review.tsx` is already on real API queries, unlike the other two placeholder screens. |
| What we build | A one submission at a time grading view over the existing tables: submission on one side, per component scores and feedback on the other, moving to the next student without leaving the page. |
| What we improve | Marks flow straight into the existing `result_batches` review and publish pipeline. There is no second gradebook to reconcile and no export step. Rubric style scoring is the existing `assessment_components` breakdown, so it always counts toward the grade and can never be configured into the Canvas failure mode where a rubric is scored but does not affect the mark. |

### Question banks

| | |
| --- | --- |
| Canvas | Two incompatible systems. Classic question banks are course scoped and copy questions into a quiz, so later bank edits do not reach the quiz. New Quizzes item banks are user scoped and live, so an edit rewrites every quiz using that item, and editing an item students have already answered forces a broken copy. Random selection works on a whole bank, not a tagged subset. |
| StackEDU today | Nothing. `assessment-builder.tsx` is a mock screen with a `MOCK_ASSESSMENTS` array. |
| What we build | One question bank owned by the institution, not by a course and not by a lecturer, with questions tagged by course and topic. Objective question types are auto graded. |
| What we improve | Questions are versioned. Editing a question that has already been answered creates a new version and leaves the answered version intact, so reuse across terms never silently rewrites history and never forces the lecturer to duplicate a bank first. Random selection can draw from a tag, not only from a whole bank. |

### Communication

| | |
| --- | --- |
| Canvas | Three separate tools. Announcements are one way from teaching staff to the whole course. Inbox, also called Conversations, is private messaging anyone can start. Discussions are forums, optionally threaded and optionally graded, and a graded discussion also appears as an assignment. |
| StackEDU today | `announcements` exists with an optional `course_offering_id`, `audience_roles`, pinning, and expiry. Per-course threaded discussions live on `discussion_threads` and `discussion_posts`. Notifications already exist per role. |
| What we build | Per course threaded discussion boards, optionally graded, reusing the existing assessment and grade tables rather than a parallel grading path. The per course announcement feed uses the `announcements` table that is already there. |
| What we improve | We keep Canvas's separation of announcements from discussions, which is the part it gets right, and we do not add a fourth inbox that competes with the notification centre already in the product. |

### Analytics

| | |
| --- | --- |
| Canvas | New Analytics has a Course Grade tab with per assignment averages and a grade distribution per assignment, and a Weekly Online Activity tab with average page views and participations per student per week. Data refreshes roughly every 24 hours. Instructors report the various analytics surfaces feel fragmented. |
| StackEDU today | A lecturer analytics screen exists. The AI layer already has `risk_scores` and `risk_factors`, where every score stores the factors that produced it. |
| What we build | Per course engagement and grade distribution for the lecturer, and per student views for the lecturer and the academic admin. |
| What we improve | Engagement counts join to attendance, fee status, and the existing at risk scoring, which Canvas cannot see at all because they live in a different system. A student who stopped opening materials and also stopped attending is one signal here, not two reports. |

## 3. Canvas complaints StackEDU must not reproduce

These are recurring, well documented instructor complaints. Each one becomes a
rule for the batches that follow.

1. **Gradebook column order is arbitrary.** Canvas orders gradebook columns by
   the assignment index rather than by anything meaningful, so a week 8 quiz can
   sit before a week 4 assignment, and fixing it means dragging columns one at a
   time. Rule: StackEDU orders marks by due date within assessment type by
   default, and the default is useful without configuration.
2. **Filters are heavy and do not persist.** Switching section or assignment
   group takes several clicks per switch, multiple sections cannot be selected
   at once, and preferences reset. Rule: a lecturer's course, section, and sort
   choices persist for that lecturer, and switching is one control.
3. **Gradebook and the grading view disagree.** Filtering several sections in
   the gradebook and then opening SpeedGrader can land on a different student
   than the one clicked. Rule: the grading view is always opened with the exact
   filtered, ordered list it was launched from.
4. **Question bank reuse breaks.** Covered in the question bank row above.
   Rule: versioned questions, no destructive edits, no duplicate to stay safe.
5. **Rubric scoring that does not count.** A Canvas rubric only drives the grade
   if a checkbox was ticked before grading began. Rule: StackEDU has no such
   mode. Component scores always sum to the mark.

## 4. Not copying

Deliberately out of scope, recorded so it is not revisited each batch: LTI and
external tool embedding, a separate Canvas style Inbox, peer review workflows,
anonymous grading, and Canvas Catalog style e-commerce. None are in the
implementation plan and none are needed for the first release.

## 5. Sources

Canvas behaviour above was taken from Instructure's own documentation and
community threads, and from university help centres documenting Canvas as
deployed: Instructure Community guides on modules, requirements and
prerequisites, SpeedGrader rubrics and DocViewer annotations, item bank sharing,
and course analytics; instructor threads on gradebook filters, gradebook column
ordering, and section filtering against SpeedGrader; and the Instructure Canvas
comparison brief held with this document.

## 7. Batch notes (A4 follow-up, A5, and A6)

Question bank generation uses a light in-built generator by default. ICT can
pick OpenAI, Claude, Gemini or Grok and paste a key; the key is stored per
institution and never returned. Vendor calls time out at 8 seconds and fall
back to the in-built generator so other requests are not held up. Lecturers can
generate bank items from the selected course, or from a PDF, Word, Excel, CSV
or Google Form link, and can pin a generated set onto an existing assessment.
Switching question type from true/false back to multiple choice restores four
empty option fields. A quiz paper that pins questions and also draws from the
same topic is rejected in plain English if the unused pool is too small. Create
Assessment/Quiz lets the lecturer pick any assessment type. Empty assessments
can be deleted; papers students have already sat or that already have marks
cannot. Share of the final mark is labelled in plain English.

A5 grading is one student at a time on submission-review: submission on one
side, marks and feedback on the other, previous/next without leaving the page.
Late is the frozen `is_late` flag. Component scores always sum to the grade.
Saving a grade writes `grades` and updates a Draft `result_batches` row.

A6 discussions are per-course threaded boards on `discussion_threads` and
`discussion_posts`, kept separate from announcements and from private messages.
A graded discussion creates a Coursework assessment so marks reuse `grades`.
Students only see published threads. Closing a thread stops new replies without
erasing the record. Lecturer analytics and ICT analytics now show interactive
charts after the card tiles. Card lists that can grow (timetable, courses,
assessments, question bank, notifications, assignments, at-risk) paginate.

## 8. Batch notes (A7–A13)

A7 live video and audio uses LiveKit through `LIVEKIT_URL`, `LIVEKIT_API_KEY`
and `LIVEKIT_API_SECRET`. The adapter in `media-room.ts` is injectable, so
tests never call Cloud, and swapping Cloud for a self-hosted URL is an env
change. Lecturers schedule, start, join and end; enrolled students join only
while the class is live.

A8 whiteboard is Excalidraw. The scene JSON is an object in storage. Live
sync is Yjs over a Hocuspocus service (`stackedu-collab`) with HMAC tokens.
The JSON scene and the Yjs bytes use different object keys so they cannot
overwrite each other.

A9 recording uses LiveKit Egress to R2. Local disk cannot receive a live
recording. The row stores `file_key`, name, MIME type and size. Students and
lecturers download through the existing expiring-link path.

A10 question generation can draft from published course materials when no
file or link is supplied.

A11 study assistant answers from published materials and library titles, and
refuses graded-quiz or assignment-writing prompts when a published assessment
exists on that offering.

A12 session summaries are drafted after the class ends and stay hidden from
students until published.

A13 regression is `apps/api/tests/live-classroom.test.ts`: lecturer run and
join, unassigned and unenrolled forbidden, record, summary, whiteboard save,
analytics join, and study-assistant refuse versus help.

Lecturer analytics now loads engagement, attendance, fee balance, at-risk
level and grade distribution from one course view. Academic student profiles
show the same engagement rows per offering.

