# Timetable reminder email — implementation note

StackEDU does **not** call Google Calendar. Reminders are stored in the institution database and mailed by StackEDU.

## What is already in the product

**Resend** (ICT → Integrations) sends mail. The same branded HTML used for admissions is reused, with the header/footer office line set to **Timetable** and a button to `/student/timetable`.

If Resend is off or has no API key, save still works. Only the email is skipped. That is the existing mail rule.

## Calendar file (`.ics`)

The invite and the due reminder attach a small `.ics` file (iCalendar, RFC 5545). Gmail, Outlook, and Apple Mail can offer “Add to calendar” from that attachment. It is a file format, not a third-party account.

The file includes:

- Title
- Weekly repeat on that weekday
- Start and end (Africa/Kigali, stored as UTC)
- Location
- A VALARM for the minutes-before choice

Students do not sign in to Google. They stay in StackEDU.

## Job

`processTimetableReminders` runs every minute in the API process (same pattern as fee due reminders, which stay hourly). Tests call it with a fixed clock so they do not wait.
