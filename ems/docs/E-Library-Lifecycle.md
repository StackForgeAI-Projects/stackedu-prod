# E-Library lifecycle

Plain-English path for how a title moves through StackEDU. Dates on these screens are shown as DD-MM-YYYY.

## Who does what

- **Librarian** owns the catalogue. They add, edit, publish, unpublish, attach files, set who may open a title, group titles into collections, and fulfil or decline requests.
- **Student**, **Lecturer**, and **Academic Admin** can search published titles, download a signed copy, and ask the librarian to add a title they cannot find.
- **ICT Manager** and **Bursar** cannot use the e-library. Fee hold is decided on the student record, not in the bursar portal.

A title is never hard-deleted. The librarian unpublishes it so it leaves student, lecturer, and academic catalogues. Collections can be removed because they are only groupings; the titles inside stay in the catalogue.

## Add a title (Librarian)

1. Open **Resource Catalogue** (or **Add resource**).
2. Fill in title, type, author, and the rest of the record.
3. Optionally attach a file: PDF, Word, EPUB, other office formats, text, or video. Maximum 500 MB.
4. Optionally draft a description with AI. Review it before saving.
5. Leave **Publish** off if it is still a draft. Turn it on when readers may see it.
6. Confirm in the dialog, then save.

The record is created first. The file is uploaded to object storage after that, then attached to the record. Saving a file also drafts a description (if empty) and indexes the text so search can find it.

## Set who may open it (Librarian)

On the same form:

- Leave programmes, years, and roles empty to allow everyone who may use the library.
- Tick **Withhold while the student is on fee hold** if a student with a fee hold must not see it. Lecturers and academic admins are not blocked by fee hold.
- Limit to programmes, year groups, or roles when the licence or reading list is restricted.

Confirm, then save. Access rules apply only after the title is published.

## Publish and unpublish (Librarian)

- **Publish** puts the title in the student, lecturer, and academic e-library.
- **Unpublish** (archive icon) takes it back out. Files stay. Readers can no longer download it.

## Collections (Librarian)

Collections are reading lists for the librarian, not a second catalogue for students.

1. Create a collection and confirm.
2. Open it, add a catalogue title, confirm.
3. Remove a title from the list if needed. The title stays in the catalogue.
4. Edit or delete the collection. Deleting the collection does not delete the titles.

## Requests and approvals

1. A student, lecturer, or academic admin opens **E-Library**, chooses **Request a title**, fills title (and optional author and reason), then confirms.
2. The librarian is notified and sees the row on **Resource Requests**.
3. **Fulfil**: optionally link an existing catalogue title, confirm. The requester is notified and sent to their own e-library page.
4. **Decline**: write a reason, confirm. The requester is notified with that reason.

The requester can see Pending, Fulfilled, and Declined on their e-library page.

## Browse and download (Student, Lecturer, Academic Admin)

1. Open **E-Library**.
2. Search by title, author, subject, or words inside the file.
3. Download a file. That opens a short-lived signed link. The app records the download for licensing reports.
4. Unpublished titles never appear. Restricted titles never appear for that person.

ICT and bursar accounts are refused if they call these routes.

## Analytics (Librarian)

**Analytics** and the librarian dashboard count published titles, pending requests, and signed downloads and opens. Use this for licence reporting, not for guessing who opened a file without a signed link.

## What readers never see

File storage keys never go to the browser. Only an expiring download link is returned. Drafts stay on the librarian catalogue until published.
