import { MAX_UPLOAD_LABEL } from '@stackedu/shared'

/**
 * Shared form-info copy. Every box follows the same pattern:
 * 1. What this thing is (general — no dummy titles or live records)
 * 2. What confirming and submitting does
 * 3. How that changes the rest of the system
 *
 * Keep sentences short. No jargon. Do not name a sample course, module, or person.
 */

export const formInfo = {
  addModule: [
    'A module is a named part of this course. It could be Week 1, Week 2, and so on. It is a simple way to break learning into smaller bits for your students.',
    'You add pages, files, and other course content inside a module. Students open that content by module. If you set a prerequisite, they cannot open this module until they finish the earlier one.',
    'Confirming creates the module on this course. You must have at least one module before you can add material.',
  ],
  editModule: [
    'A module is a named part of this course. It could be Week 1, Week 2, and so on. It is a simple way to break learning into smaller bits for your students.',
    'You add pages, files, and other course content inside a module. Saving updates the title, summary, publish setting, and prerequisite. Students still cannot open it until they finish any earlier module you set as a prerequisite.',
  ],
  addMaterial: [
    'Course material is a page, a file, a link, or a mix of the three. It always belongs to one module on this course.',
    `Confirming publishes it. Enrolled students can then open it inside that module. A file must be ${MAX_UPLOAD_LABEL} or less.`,
  ],
  editMaterial: [
    'Course material is a page, a file, or a link inside a module.',
    `Saving replaces what enrolled students see. They only see published items. A file must be ${MAX_UPLOAD_LABEL} or less.`,
  ],
  postAnnouncement: [
    'An announcement is a one-way notice for this course. Students cannot reply to it.',
    'Confirming posts it to enrolled students, or saves a draft if you turn Post now off. A draft stays hidden until you post it.',
  ],
  editAnnouncement: [
    'An announcement is a one-way notice for this course.',
    'Saving updates the text. If it is posted, enrolled students see the new version. A draft stays hidden until you post it.',
  ],
  startDiscussion: [
    'A discussion is a thread on this course. Students reply to your opening question.',
    'Confirming creates the thread. If you mark it as graded, a coursework column is created with the same title.',
  ],
  createAssignment: [
    'An assignment is coursework that students submit by a due date.',
    'Confirming creates it on the chosen course. If you publish it, enrolled students can open it and send their work.',
  ],
  createAssessment: [
    'An assessment is a quiz or paper for one course.',
    'Confirming creates it. You then pin questions from the bank, or draw a random set from a topic. Students sit it after you save the paper.',
  ],
  addQuestion: [
    'A question lives in the shared bank, not only on one quiz.',
    'Confirming adds it so you can pin it or draw it onto later papers.',
  ],
  editQuestion: [
    'This question lives in the shared bank.',
    'Saving changes it for new papers that use it.',
  ],
  editQuestionAnswered: [
    'Students have already answered this question.',
    'Saving creates a new version and leaves the old one on past papers, so earlier marks stay valid.',
  ],
  generateQuestions: [
    'This drafts questions from the course, an uploaded file, or a public form link.',
    `Confirming adds them to the bank. A file must be ${MAX_UPLOAD_LABEL} or less. If a cloud model is slow or missing a key, the in-built generator is used instead.`,
  ],
  addTimetableSlot: [
    'A class is a weekly time for one course, one lecturer, and one location.',
    'Confirming saves it and asks that lecturer to confirm they are free. Students see it only after the lecturer confirms. A taken room or lecturer cannot be booked twice.',
  ],
  editTimetableSlot: [
    'Saving changes the day, time, lecturer, or location.',
    'The class waits for the lecturer again. Students see the new time only after they confirm.',
  ],
  scheduleLiveClass: [
    'A live class is a scheduled session for this course.',
    'Confirming creates the session. Enrolled students can join at the time you set.',
  ],
  autoRecordClassroom: [
    'Automatic recording starts a recording as soon as you start a live class.',
    'Confirming saves this for your account. You can still start or stop a recording during the class.',
  ],
  addCourse: [
    'A course is a subject in the catalogue. It belongs to a department and can be opened for a semester.',
    'Confirming creates it so lecturers can be assigned and students can register when it is open.',
  ],
  editCourse: [
    'A course is a subject in the catalogue.',
    'Saving updates the department, credits, and whether students can register. The live catalogue changes at once.',
  ],
  addProgramme: [
    'A programme is the course of study a student belongs to. It sits in one department.',
    'Confirming creates it so students can be placed on it and so they only register for offerings in that department.',
  ],
  editProgramme: [
    'A programme is the course of study a student belongs to.',
    'Saving updates the name, department, and duration. That changes which students sit on it and which offerings they can register for.',
  ],
  addCalendarEvent: [
    'A calendar event is a shared date for the institution, such as a term start or an exam period.',
    'Confirming publishes it on the academic calendar for students and staff.',
  ],
  editCalendarEvent: [
    'A calendar event is a shared date for the institution.',
    'Saving updates the date and details on the calendar students and staff see.',
  ],
  addLibraryResource: [
    'A catalogue record is the title readers search for in the e-library.',
    `Confirming creates the record. Attach a file of ${MAX_UPLOAD_LABEL} or less if you have one, then publish when readers may open it.`,
  ],
  editLibraryResource: [
    'A catalogue record is the title readers search for in the e-library.',
    'Saving updates the record, the file, and who may open it. Published changes appear for students and staff at once.',
  ],
  addCollection: [
    'A collection is a named group of catalogue titles for the librarian. It is not a second catalogue for students.',
    'Confirming creates it so you can add titles into the group.',
  ],
  editCollection: [
    'A collection is a named group of catalogue titles for the librarian.',
    'Saving updates the name and description. The titles inside stay in the catalogue.',
  ],
  fulfilRequest: [
    'Fulfil marks a reader request as done.',
    'You can link an existing catalogue title, or fulfil without a link. Confirming notifies the requester in the app.',
  ],
  declineRequest: [
    'Decline turns a reader request down.',
    'Write a short reason. Confirming sends that reason to the requester in the app.',
  ],
  requestLibraryTitle: [
    'This asks the librarian to add a title that is not in the catalogue yet.',
    'Sending the request does not add the title. The librarian reviews it, then fulfils or declines it.',
  ],
  addFeeItem: [
    'A fee item is a charge on the fee list. It can apply to chosen programmes.',
    'Confirming puts it on student bills for those programmes.',
  ],
  editFeeItem: [
    'A fee item is a charge on the fee list.',
    'Saving updates the name, amount, and due date. Student bills use the new figures.',
  ],
  composeFeeMessage: [
    'A fee message is a notice to the people you picked.',
    'Sending delivers it to their app under Notifications and Fees.',
  ],
  chooseFeeRecipients: [
    'This picks who should get the fee message.',
    'Closing the panel keeps your selection. Sending the message is a separate step.',
  ],
  recordManualPayment: [
    'A manual payment is money the student already paid outside the portal.',
    'Confirming adds it to their account and reduces what they still owe.',
  ],
  timetableReminder: [
    'A reminder is a notice before this class starts.',
    'Saving tells the app to notify you at the time you choose.',
  ],
  editProfile: [
    'This is the name, email, and phone on your account.',
    'Saving changes what appears on your profile and in messages sent to you.',
  ],
  changePassword: [
    'This replaces the password you use to sign in.',
    'Confirming updates it at once. Use the new password the next time you log in.',
  ],
  createApplicantAccount: [
    'This starts your application and creates your login.',
    'Submitting sends a verification email. You use that account to finish the form and upload documents.',
  ],
  applyPersonal: [
    'This step records your identity and contact details as they appear on your official ID.',
    'Saving stores the step so you can leave and continue later.',
  ],
  applyAcademic: [
    'This step records your prior school results.',
    'Saving stores the step so you can leave and continue later.',
  ],
  applyProgramme: [
    'This step records the programme and intake you are applying for.',
    'Saving stores the step so you can leave and continue later.',
  ],
  applyGuardian: [
    'This step records a parent or legal guardian. Undergraduate applicants must complete it.',
    'Saving stores the step so you can leave and continue later.',
  ],
  applyAdditional: [
    'This step records why you are applying and an emergency contact.',
    'Saving stores the step. Documents come next.',
  ],
  applyDocuments: [
    'This step stores a clear copy of each required file.',
    `Each file must be ${MAX_UPLOAD_LABEL} or less. Saving keeps your application moving.`,
  ],
  applyDocumentsRequested: [
    'Admissions has asked for more files. Upload a clear copy for each item.',
    `Each file must be ${MAX_UPLOAD_LABEL} or less. Submitting sends them for review.`,
  ],
  submitAssignment: [
    'This sends your written work or quiz answers to the lecturer.',
    'Confirming submits them. You cannot change the answers after they are sent.',
  ],
  addIctUser: [
    'This creates a login for a staff member or student.',
    'Confirming makes the account. A student login also creates their student record.',
  ],
  ictSettings: [
    'These are the institution name, logo, colour, and contact details.',
    `Saving changes the sign-in screens, portals, and emails. A logo must be ${MAX_UPLOAD_LABEL} or less.`,
  ],
  ictIntegration: [
    'This turns the service on or off and stores any keys you paste.',
    'Saving updates this institution. Secrets are not shown again after you save.',
  ],
} as const
