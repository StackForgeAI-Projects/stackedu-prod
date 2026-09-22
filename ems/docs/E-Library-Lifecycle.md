# E-Library lifecycle

A simple process flow for how a title moves through StackEDU. Dates on these screens show as **DD-MM-YYYY**.

---

## What the e-library is

The e-library is the shared catalogue of titles for the institution. A **title** is one catalogue record (a book, journal, video, or other file). Readers search published titles and download a signed copy. The librarian owns the catalogue.

A title is never hard-deleted. The librarian unpublishes it so it leaves the reader catalogues. Files stay.

---

## Who does what

| Who | What they do |
| --- | --- |
| **Librarian** | Adds, edits, publishes, and unpublishes titles. Attaches files. Sets who may open a title. Groups titles into collections. Fulfils or declines requests. |
| **Student, Lecturer, Academic Admin** | Search published titles, download a signed copy, and ask the librarian to add a title they cannot find. |
| **ICT Manager and Bursar** | Cannot use the e-library. Fee hold is decided on the student record, not in the bursar portal. |

---

## Process flow

```
Reader cannot find a title ──► Request a title ──► Librarian reviews
                                                      │
                              ┌───────────────────────┴───────────────────────┐
                              ▼                                               ▼
                           Fulfil                                          Decline
                     (optionally link a                               (write a reason)
                      catalogue title)                                        │
                              │                                               │
                              └──────────────► Requester is told in the app ──┘

Librarian adds a title ──► Set who may open it ──► Publish ──► Readers search and download
                                      │
                                      └── Unpublish later if it must leave the catalogues
```

### 1. Librarian adds a title

1. Open **Resource Catalogue** or **Add resource**.
2. Fill in the title, type, author, and the rest of the record.
3. Attach a file if you have one (PDF, Word, EPUB, office, text, or video). Maximum **14 MB**. A file over 14 MB opens a size dialog; images are reduced automatically when possible.
4. You can draft a description with AI. Read it before you save.
5. Leave **Publish** off while it is a draft. Turn it on when readers may see it.
6. Confirm, then save.

The record is created first. The file is uploaded after that, then attached. Saving a file can also draft a description (if empty) and index the text so search can find it.

### 2. Librarian sets who may open it

On the same form:

- Leave programmes, years, and roles empty to allow everyone who may use the library.
- Tick **Withhold while the student is on fee hold** if a student with a fee hold must not see it. Lecturers and academic admins are not blocked by fee hold.
- Limit to programmes, year groups, or roles when the licence or reading list is restricted.

Confirm, then save. Access rules apply only after the title is published.

### 3. Librarian publishes or unpublishes

- **Publish** puts the title in the student, lecturer, and academic e-library.
- **Unpublish** (archive icon) takes it back out. Files stay. Readers can no longer download it.

### 4. Librarian groups titles (optional)

A **collection** is a named group of catalogue titles for the librarian. It is not a second catalogue for students.

1. Create a collection and confirm.
2. Open it, add a catalogue title, confirm.
3. Remove a title from the list if needed. The title stays in the catalogue.
4. Edit or delete the collection. Deleting the collection does not delete the titles.

### 5. A reader asks for a missing title

1. A student, lecturer, or academic admin opens **E-Library**.
2. They choose **Request a title**, fill title (and optional author and reason), then confirm.
3. Sending the request does **not** add the title. The librarian is notified and sees the row on **Resource Requests**.
4. **Fulfil:** optionally link an existing catalogue title, confirm. The requester is notified and sent to their own e-library page.
5. **Decline:** write a reason, confirm. The requester is notified with that reason.

The requester can see Pending, Fulfilled, and Declined on their e-library page.

### 6. Readers browse and download

1. Open **E-Library** (student, lecturer, or academic sidebar).
2. Search by title, author, subject, or words inside the file. Typing waits a moment, then runs the search.
3. The catalogue is a **table**: type, title, author (and year), subjects, and a download control. Sort a column by clicking its header. Filter by **Type**. Empty types stay off the filter list.
4. The table is paginated. Change page or how many rows to show (5, 10, 25, 50, 100) at the foot of the table. Default is 10 rows.
5. Download a file with the row download control (tooltip on hover). That opens a short-lived signed link. The app records the download for licensing reports. A title with no file shows **No file**.
6. **Request a title** if the search does not find it.
7. Unpublished titles never appear. Restricted titles never appear for that person.

ICT and bursar accounts are refused if they call these routes. The same browse table is used for student, lecturer, and academic readers.

---

## Analytics (Librarian)

**Analytics** and the librarian dashboard count published titles, pending requests, and signed downloads and opens. Use this for licence reporting, not for guessing who opened a file without a signed link.

---

## What readers never see

File storage keys never go to the browser. Only an expiring download link is returned. Drafts stay on the librarian catalogue until published.
