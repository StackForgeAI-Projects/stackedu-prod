**STACKFORGEAI**

**EMS Master Context**

**StackEDU - Educational Management System**

Product StackEDU - Educational Management System

Company StackForgeAI · stackforgeai.africa

Location Kiyovu, Kigali, Rwanda

Target Rwandan tertiary institutions (universities, polytechnics, colleges)

Source Design System Foundation (Doc 1) + PRD v1.1 (Doc 2)

Version 1.0 - Combined Master Context

Date May 2026

Purpose Opening context document for all future Claude sessions on this project

**This document contains four parts:**

**Part A** Company & Product Context

**Part B** Design System Foundation

**Part C** Product Requirements - Roles, Features & Screens

**Part D** Technical Architecture

# **Part A - Company & Product Context**

# **A1 About StackForgeAI**

StackForgeAI is a Kigali-based technology company that builds AI-powered software and digital infrastructure for governments, universities, and businesses across Africa. Registered under Rwanda's RDB (TIN: 156306392), the company operates from Kiyovu, Kigali. Its stated goal is to become the number-one AI infrastructure and software engineering company in Kigali and Africa.

## **A1.1 Products**

| **Product**          | **Status**         | **Description**                                                                                                                    |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **StackFix**         | **Live**           | Repair management system. Tracks service requests, manages technicians, and improves operational efficiency for repair businesses. |
| **StackEDU**         | **In Development** | Centralised Educational Management System for Rwandan tertiary institutions. This document is its complete project context.        |
| **Rwanda Directory** | **Coming Soon**    | Digital directory of registered businesses across Rwanda, categorised by industry to improve visibility and discovery.             |

## **A1.2 Services**

- Custom Web & Mobile Development
- AI Products & Custom Software
- Continuous Maintenance & Ongoing Support
- StackForgeNext - free digital skills workshops, hackathons, and AI education sessions for Rwandan youth (bundled with StackEDU partnerships)

# **A2 StackEDU - Product Overview**

StackEDU is a centralized, cloud-based Educational Management System built by StackForgeAI specifically for tertiary institutions in Rwanda. It unifies every aspect of academic administration - from student admissions through to graduation - into a single, secure, mobile-first platform engineered for the Rwandan context: MTN MoMo and Airtel Money integration, card and online payment support, SMS notifications, offline-tolerant design, and compliance with Rwanda's data protection framework.

The core problem it solves is institutional fragmentation. Across Rwandan universities, student data lives in disconnected spreadsheets, fee payments are tracked manually, results are computed by hand and released weeks late, and academic records are difficult to audit. StackEDU replaces this with one connected system - one login, one data store, one source of truth for every stakeholder.

## **A2.1 Partnership Engagement Model**

The proposal defines a seven-phase engagement model for each institutional partner:

| **Phase** | **Name**        | **Description**                                                                          |
| --------- | --------------- | ---------------------------------------------------------------------------------------- |
| **1**     | **Discovery**   | Understand the institution's current systems, workflows, and pain points                 |
| **2**     | **Planning**    | Define scope, data migration plan, and project timeline with institutional leadership    |
| **3**     | **Design**      | UI/UX design of institution-specific portal with branding and workflow configuration     |
| **4**     | **Development** | Build and configure the platform for the institution's specific requirements             |
| **5**     | **Deployment**  | Go-live with data migration, system integration, and infrastructure setup                |
| **6**     | **Training**    | Staff and student onboarding: admin training, lecturer training, and student orientation |
| **7**     | **Support**     | Ongoing maintenance, bug fixes, feature updates, and dedicated support channel           |

# **Part B - Design System Foundation**

_ℹ All colour values extracted from StackFix src/styles.css (OKLCH → hex). Tokens marked \* are suggested complements not in the StackFix codebase. Typography and spacing match StackFix patterns._

# **B1 Colour Palette**

All hex values sourced from the StackFix codebase and confirmed against `colors_and_type.css`. Role assignments and usage notes apply to StackEDU directly.

| **Token**          | **Hex**     | **Role**                  | **Swatch** | **Usage**                                                      |
| ------------------ | ----------- | ------------------------- | ---------- | -------------------------------------------------------------- |
| brand              | **#20F44E** | Primary / Brand           |            | CTAs, active nav, focus rings, progress bars, brand highlights |
| brand-ink          | **#05131D** | Text on Brand             |            | Text rendered on top of the #20F44E green background           |
| ink                | **#05131D** | Secondary / Ink           |            | Sidebar bg, primary text, dark cards, icon backgrounds         |
| background         | **#F8FAFC** | Background                |            | Page background, outermost canvas                              |
| card               | **#FFFFFF** | Surface / Card            |            | Card backgrounds, modal surfaces, form panels                  |
| muted              | **#F1F5F9** | Neutral / Muted           |            | Input backgrounds, tag fills, skeleton loaders                 |
| muted-foreground   | **#64748B** | Neutral / Subdued         |            | Placeholder text, secondary labels, timestamps                 |
| border             | **#E2E8F0** | Neutral / Border          |            | Dividers, card borders, table rules, input outlines            |
| foreground         | **#05131D** | Text / Foreground         |            | Primary body copy, headings on light backgrounds               |
| ink-foreground     | **#F8FAFC** | Inverse Text              |            | Text on Ink-coloured surfaces e.g. sidebar                     |
| ink-muted          | **#94A3B8** | Inverse Subdued           |            | Secondary text on Ink surfaces                                 |
| ink-border         | **#1F2A35** | Inverse Border            |            | Dividers within Ink surfaces                                   |
| ink-surface        | **#0F1E2B** | Inverse Raised Surface    |            | Slightly elevated surface within Ink                           |
| success            | **#16A34A** | Success                   |            | Paid badges, passed results, completion states                 |
| success-bg         | **#DCFCE7** | Success / Background      |            | Success badge fills, passed status chips                       |
| warning            | **#CA8A04** | Warning                   |            | Pending states, fee overdue alerts, at-risk flags              |
| warning-bg         | **#FEF9C3** | Warning / Background      |            | Warning badge fills, caution alerts                            |
| error              | **#DC2626** | Error / Destructive       |            | Unpaid badges, failed validations, destructive confirmations   |
| error-bg           | **#FEE2E2** | Error / Background        |            | Error badge fills, failed toast backgrounds                    |
| info \*            | **#2563EB** | Info                      |            | Informational alerts, system notices, sync status              |
| info-bg \*         | **#DBEAFE** | Info / Background         |            | Info badge fills, announcement banners                         |

_\* Suggested complements; not in StackFix codebase but fit the palette._

# **B2 Typography**

## **B2.1 Typefaces**

| **Role**                | **Family**         | **Fallback Stack**                                            |
| ----------------------- | ------------------ | ------------------------------------------------------------- |
| Display / Headings      | **Clash Grotesk**  | ui-sans-serif, system-ui, sans-serif                          |
| Body / UI text          | **Inter**          | ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif |
| Monospace (IDs, code)   | **JetBrains Mono** | ui-monospace, monospace                                       |

_Clash Grotesk is a custom font loaded from local `.otf` files (Regular 400, Medium 500, Semibold 600, Bold 700) in the `design-system/fonts/` folder. Inter and JetBrains Mono are loaded from Google Fonts._

## **B2.2 Type Scale**

| **Level**      | **Font**         | **Size** | **Weight** | **Line Height** | **Usage**                                             |
| -------------- | ---------------- | -------- | ---------- | --------------- | ----------------------------------------------------- |
| **Display**    | Clash Grotesk    | 48px     | 600        | 1.1             | Hero banners, onboarding splash screens               |
| **H1**         | Clash Grotesk    | 32px     | 600        | 1.2             | Page titles (e.g. Student Records, Academic Calendar) |
| **H2**         | Clash Grotesk    | 24px     | 600        | 1.3             | Section headings within a page                        |
| **H3**         | Clash Grotesk    | 18px     | 500        | 1.4             | Card headings, panel titles, grouped field labels     |
| **Body Large** | Inter            | 16px     | 400        | 1.6             | Lead paragraphs, modal body, form intro text          |
| **Body**       | Inter            | 14px     | 400        | 1.5             | Default UI text, table rows, most form content        |
| **Body Small** | Inter            | 13px     | 400        | 1.5             | Secondary descriptions, sidebar metadata              |
| **Caption**    | Inter            | 12px     | 400        | 1.4             | Timestamps, file info, supporting microcopy           |
| **Label**      | Inter            | 11px     | 600        | 1.3             | Form labels, badge text, status chips, nav items      |
| **Mono**       | JetBrains Mono   | 13px     | 400        | 1.5             | Student IDs, registration numbers, code references    |

_Heading letter-spacing: Display `-0.02em` · H1 `-0.015em` · H2 `-0.01em`. Label tracking: `0.04em` with `text-transform: uppercase`._

# **B3 Spacing Scale**

4px base grid. Token names map to Tailwind utility classes in the format spacing-{n}.

| **Token**  | **Name** | **px** | **rem** | **Tailwind**  | **Typical Usage**                                      |
| ---------- | -------- | ------ | ------- | ------------- | ------------------------------------------------------ |
| spacing-1  | **xs**   | 4px    | 0.25rem | p-1 / gap-1   | Icon padding, tight badge internal spacing             |
| spacing-2  | **sm**   | 8px    | 0.5rem  | p-2 / gap-2   | Button icon gap, compact row gap                       |
| spacing-3  | **md**   | 12px   | 0.75rem | p-3 / gap-3   | Input internal padding (vertical), small card gap      |
| spacing-4  | **lg**   | 16px   | 1rem    | p-4 / gap-4   | Standard card padding, field row gap                   |
| spacing-6  | **xl**   | 24px   | 1.5rem  | p-6 / gap-6   | Card internal padding, section gap, form group spacing |
| spacing-8  | **2xl**  | 32px   | 2rem    | p-8 / gap-8   | Page horizontal padding, large section breaks          |
| spacing-12 | **3xl**  | 48px   | 3rem    | p-12 / gap-12 | Vertical rhythm between major page sections            |
| spacing-16 | **4xl**  | 64px   | 4rem    | p-16 / gap-16 | Top-of-page padding, full-page empty states            |

_Border radius scale: radius-sm (10px) · radius-md (12px) · radius-lg (14px) · radius-xl (18px) · radius-2xl (22px) · radius-3xl (26px). Use radius-xl/2xl for cards, radius-lg for inputs and buttons, radius-sm for badges._

# **B4 Component Inventory**

_ℹ Components marked † exist in the StackFix repo (src/components/ui/) and will be reused or adapted. All others must be built new. StackFix uses shadcn/ui on Radix UI primitives - StackEDU follows the same pattern._

**Foundations**

| **Component**          | **Description**                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Colour Tokens †**    | CSS custom property definitions for the full palette; imported globally via styles.css |
| **Typography Scale †** | Font-size, weight, and line-height utility classes from the type scale in B2           |
| **Icon Set †**         | Lucide React; same library used throughout StackFix                                    |
| **Spacing Scale †**    | Tailwind spacing utilities on a 4px grid as defined in B3                              |

**Layout**

| **Component**       | **Description**                                                                       |
| ------------------- | ------------------------------------------------------------------------------------- |
| **AppShell †**      | Outer layout wrapper: sidebar + header + main content area with mobile drawer         |
| **Sidebar †**       | Left-side nav panel with logo, nav links, and user info; dark (Ink) background        |
| **Header †**        | Top bar: global search, notifications bell, quick-action button, user avatar dropdown |
| **PageContainer**   | Centres content at max-width 1400px with consistent horizontal/vertical padding       |
| **SectionHeader**   | Page title block: H1, subtitle, and optional right-side action button                 |
| **TwoColumnLayout** | Responsive grid: 2/3 main content + 1/3 sidebar panel                                 |
| **DashboardGrid**   | Responsive 4-column KPI grid; stacks to 2-col on tablet, 1-col on mobile              |

**Forms**

| **Component**    | **Description**                                                                      |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Input †**      | Single-line text input with label, hint, and error state                             |
| **Textarea †**   | Multi-line input for notes, descriptions, and feedback fields                        |
| **Select †**     | Dropdown with search; used for department, programme, and status filters             |
| **Checkbox †**   | Binary toggle for multi-select lists and permission settings                         |
| **RadioGroup †** | Single-select group; used for payment model, gender, enrolment type                  |
| **DatePicker †** | Calendar-based date selector for registration periods, deadlines, dob fields         |
| **FileUpload**   | Drag-and-drop area with file type and size validation; used for document submissions |
| **FormField †**  | Wrapper composing label + input + hint + error into a single form row                |
| **SearchInput**  | Input with search icon and clear button; used in table toolbars                      |
| **Switch †**     | Toggle for boolean settings (notifications on/off, portal access)                    |
| **OTPInput †**   | Six-digit one-time-password field for two-step verification at login                 |

**Data Display**

| **Component**     | **Description**                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| **Table †**       | Full data table with sortable columns, row hover, and pagination                 |
| **Card †**        | Bordered surface for student profiles, course cards, and stat groups             |
| **Badge †**       | Small coloured chip for statuses: Enrolled, Graduated, Pending, Suspended        |
| **StatTile**      | KPI card with large numeric value, delta indicator, and icon; used on dashboards |
| **Avatar †**      | Circular user image with initials fallback                                       |
| **DataRow**       | Horizontal key-value row for profile details and record summaries                |
| **ProgressBar †** | Linear fill bar for GPA progress, module completion, fee payment status          |
| **Chart †**       | Recharts line, bar, or area chart for enrolment trends and grade distributions   |
| **ResultGrid**    | Grade-per-module grid for result sheets with colour-coded pass/fail states       |
| **TimelineList**  | Vertical event list for academic history and audit logs                          |
| **EmptyTable**    | Zero-state placeholder when a filtered or unloaded table has no rows             |

**Feedback**

| **Component**     | **Description**                                                               |
| ----------------- | ----------------------------------------------------------------------------- |
| **Toast †**       | Sonner non-blocking notification for success, error, warning, and info events |
| **Dialog †**      | Blocking modal for confirmations, detail views, and short forms               |
| **AlertDialog †** | Destructive-action confirmation modal (delete record, suspend student)        |
| **Sheet †**       | Slide-in side panel for record editing without leaving the current page       |
| **Alert †**       | Inline banner for page-level info, warnings, and error summaries              |
| **Skeleton †**    | Animated placeholder shown while data is loading                              |
| **Spinner**       | Circular loading indicator for button-level and inline loading states         |
| **EmptyState**    | Full-panel zero-state with illustration, heading, and call-to-action          |
| **ErrorBoundary** | Full-page error fallback with retry action for runtime failures               |

**Navigation**

| **Component**        | **Description**                                                               |
| -------------------- | ----------------------------------------------------------------------------- |
| **Tabs †**           | Horizontal tab strip for sub-sections (Grades / Attendance / Fees)            |
| **Breadcrumb †**     | Path trail: Dashboard > Students > Jean-Paul Mugisha                          |
| **Pagination †**     | Page-number controls with page-size selector; already in StackFix             |
| **Sidebar Nav †**    | Vertical link list with active-state highlighting; reused from AppShell       |
| **DropdownMenu †**   | Contextual action menu on table rows and card headers                         |
| **CommandPalette †** | Keyboard-driven global search and action launcher (⌘K); built on cmdk         |
| **StepIndicator**    | Horizontal step progress for multi-step forms (admissions wizard, onboarding) |

# **Part C - Product Requirements**

# **C1 User Roles**

StackEDU has four user roles. Three - Student, Lecturer, and Admin - operate within the day-to-day life of the institution. The fourth - ICT Manager - governs the entire platform. The Admin role is subdivided into three access levels (Bursar, Academic Admin, Librarian), each scoped to a specific institutional function. No admin level has access to the modules of another.

| **ICT Manager**    |
| ------------------ | -------------------------- | --------------------- |
| **Admin - Bursar** | **Admin - Academic Admin** | **Admin - Librarian** |
| **Lecturer**       | **Student**                |

## **C1.1 Student**

Full-time or part-time enrolled student. Majority access from a smartphone via MTN or Airtel mobile data. Primary concern: transparent access to own academic record and timely notifications for results, fees, and registration windows.

Goals: view grades immediately on publication; register for courses without queuing; pay fees through any available channel; download official documents without a physical visit.

### **Permissions**

- Read own academic record (grades, GPA, CGPA, attendance)
- View and download own transcripts and official letters
- Register for courses and view timetable
- Submit assignments and view feedback
- Pay fees via MTN MoMo, Airtel Money, debit/credit card, or bank transfer
- View own payment history and download receipts
- Access e-library and course materials uploaded by lecturers
- Communicate with lecturers via platform messaging
- Complete digital orientation and onboarding steps
- Cannot view or modify any other student's data
- Cannot access admin, financial reporting, or lecturer dashboards

### **Key Tasks**

- Complete digital onboarding at the start of enrolment
- Register for courses at the start of each semester
- Pay fees via preferred payment method and confirm receipt
- Check results after each assessment or at end of semester
- Download transcript for job or further-study applications
- Submit assignments and track submission status
- Access e-library resources for research and coursework

## **C1.2 Lecturer**

Teaching staff member responsible for one or more courses. Needs a fast, no-friction interface for weekly tasks: entering grades, taking attendance, uploading materials, communicating with class.

Goals: enter and publish results efficiently; upload materials and assignments; track attendance; view performance analytics for own cohort.

### **Permissions**

- View roster of students enrolled in assigned courses only
- Enter, edit (before publish), and submit results for assigned courses
- Record and view attendance for assigned courses
- Upload lecture materials, slides, and assignment prompts
- Create, manage, and grade online assessments for assigned courses
- View analytics for own courses (grade distributions, at-risk flags)
- Communicate with students enrolled in their courses
- Cannot enter or modify results for courses not assigned to them
- Cannot access fee, payment, or bursary data
- Cannot modify student registration or enrolment status
- Cannot add or remove platform users

### **Key Tasks**

- Enter marks after each assessment and trigger GPA recalculation
- Take attendance at the start of each class session
- Upload course materials for enrolled students
- Create assignments and review student submissions
- Review AI-generated at-risk alerts and follow up with flagged students
- View course-level performance dashboard at end of semester

## **C1.3 Admin - Bursar / Accountant**

Financial officer of the institution. Entire scope within StackEDU is monetary: fee structures, payment collection, financial records, and reporting. No access to academic data, course management, or library resources.

### **Permissions**

- Configure fee structures: tuition, levies, deadlines per programme and year group
- View full institution-wide fee payment status and outstanding balances
- Issue, void, and reprint payment receipts
- Reconcile payments from all channels (MoMo, Airtel, card, bank transfer)
- Generate and export financial reports (daily, monthly, semester, annual)
- Apply and remove fee holds (blocks student registration or result access)
- Cannot view or modify academic results, course data, or attendance records
- Cannot create or manage user accounts
- Cannot access library management or e-library administration

### **Key Tasks**

- Set or update fee structures at the start of each academic year
- Monitor daily payment inflows across all channels
- Generate end-of-semester financial summary for institutional leadership
- Reconcile failed or disputed transactions with the payment gateway
- Apply or remove fee holds on student accounts
- Export payment data for external audit or regulatory reporting

## **C1.4 Admin - Academic Admin**

Registrar and academic operations manager. Oversees the full student academic lifecycle: admissions, enrolment, course registration, results management, timetabling, and academic reporting. No access to financial data or library management.

### **Permissions**

- Review, approve, and reject student applications
- Manage enrolment: add, suspend, transfer, and graduate students
- Open and close course registration windows per semester
- Create, update, and archive courses, modules, and programmes
- Assign courses to lecturers and manage faculty course load
- Configure academic calendar: semesters, registration dates, exam periods
- Input or auto-generate the institution timetable
- Approve and batch-publish results submitted by lecturers
- Override or correct erroneous results (with audit trail)
- Generate and export academic reports (enrolment, results, attendance)
- Manage AI-generated at-risk student alerts
- Cannot access fee payment data, financial reports, or bursary functions
- Cannot add or remove platform users
- Cannot manage e-library content

### **Key Tasks**

- Process new student applications through the admissions workflow
- Open and close course registration windows each semester
- Set up the academic calendar and timetable at the start of each year
- Batch-approve and publish results after lecturer submission deadline
- Generate end-of-semester academic reports for accreditation bodies
- Onboard new students at the start of each intake
- Review and assign follow-ups for at-risk student alerts

## **C1.5 Admin - Librarian**

In full charge of the StackEDU digital library. Manages every resource in the e-library: adding, editing, deleting, organising collections, managing access, and curating reading lists. No access to academic records, financial data, or user account management.

### **Permissions**

- Add, edit, and delete e-library resources (e-books, journals, research papers, course packs)
- Organise resources into collections, subjects, and departments
- Manage resource metadata: title, author, ISBN, year, subject tags
- Upload resource files (PDF, ePub, video links) and update existing files
- Set access controls on resources (restricted by programme, year, or department)
- View library usage analytics: most accessed resources, active users, search trends
- Manage and respond to resource requests from students and lecturers
- Cannot access academic results, student records, or enrolment data
- Cannot access fee payment data or financial reports
- Cannot create or manage user accounts

### **Key Tasks**

- Add new e-books, journals, and research papers to the catalogue
- Edit metadata and file attachments for existing resources
- Organise and tag resources by subject, department, and course
- Review and fulfil resource requests from students and lecturers
- Archive or remove outdated materials from the active catalogue
- Review usage reports to identify gaps in the collection

## **C1.6 ICT Manager**

Highest-authority user in StackEDU. Full read and write access to every module. The only user who can create and remove admin accounts, assign admin access levels, and revoke access for any user on the platform.

### **Permissions**

- Full read and write access to all modules across the entire platform
- Create, edit, suspend, and permanently delete accounts for all user types
- Assign and revoke admin access levels (Bursar, Academic Admin, Librarian)
- Revoke platform access for any user at any time
- Reset passwords and manage 2FA settings for any account
- Configure institution-level branding, system settings, and notification templates
- Manage API integrations and external service connections
- Access and export the full system audit log
- View institution-wide analytics across all modules
- Configure data retention, backup schedules, and security policies

### **Key Tasks**

- Onboard new admin users at the start of each academic year or when staff join
- Deactivate accounts for staff who leave the institution
- Assign the correct admin access level to each admin user
- Investigate flagged audit log entries and revoke access where necessary
- Configure system settings and integration credentials for the institution
- Perform periodic access reviews to ensure user roles remain accurate

# **C2 Feature List**

_ℹ All features derived from the StackForgeAI Education Partnership Proposal. Priority reflects Day 1 operational needs versus future enhancements._

**Admissions & Onboarding**

| **Feature**                       | **Description**                                                                                                              | **Applies To**          | **Priority**  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------- |
| **Digital Application Portal**    | Fully digital application form with document uploads, automated review workflow, and admission tracking                      | Academic Admin          | **Must-Have** |
| **Admission Notifications**       | Instant SMS and email notifications to applicants at each stage of the review process                                        | Academic Admin, Student | **Must-Have** |
| **Digital Student Onboarding**    | Step-by-step orientation guide for newly admitted students covering document submission, portal setup, and orientation tasks | Student                 | **Must-Have** |
| **Admission Decision Management** | Academic Admin interface for reviewing applications, requesting documents, and issuing acceptance or rejection decisions     | Academic Admin          | **Must-Have** |

**Student Records & Academic Data**

| **Feature**                          | **Description**                                                                                                        | **Applies To**           | **Priority**     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------- |
| **Student Profile & Records**        | Central profile holding all personal, enrolment, and academic data for each student across their full lifecycle        | Academic Admin, Student  | **Must-Have**    |
| **Academic Results Entry**           | Lecturer-facing interface for entering marks per course; linked to GPA and CGPA calculation engine                     | Lecturer, Academic Admin | **Must-Have**    |
| **AI-Powered GPA & CGPA Calculator** | Automated computation of semester GPA and cumulative GPA based on entered results with academic standing determination | Academic Admin, Lecturer | **Must-Have**    |
| **Result Publishing & Access**       | Controlled result release: Academic Admin publishes results, students receive notification and view via portal         | Academic Admin, Student  | **Must-Have**    |
| **Transcript Generation**            | System-generated official transcripts downloadable by students; exportable by Academic Admin in PDF format             | Academic Admin, Student  | **Must-Have**    |
| **Academic History Timeline**        | Chronological view of a student's full academic record from first enrolment to current standing                        | Academic Admin, Student  | **Nice-to-Have** |

**Course & Semester Management**

| **Feature**                          | **Description**                                                                                                         | **Applies To**          | **Priority**     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------- |
| **Course Registration**              | Structured semester-based course selection with credit management, prerequisites enforcement, and departmental approval | Student, Academic Admin | **Must-Have**    |
| **Academic Calendar Configuration**  | Tool to define academic year, semester dates, registration windows, examination periods, and holidays                   | Academic Admin          | **Must-Have**    |
| **Automated Timetable Generation**   | AI-assisted timetable builder that avoids room, lecturer, and course conflicts based on declared constraints            | Academic Admin          | **Nice-to-Have** |
| **Course & Module Management**       | Interface to create, update, archive, and assign courses and modules to departments and lecturers                       | Academic Admin          | **Must-Have**    |
| **Credit & Prerequisite Management** | Enforces credit load limits and prerequisite requirements at the point of course registration                           | Academic Admin, Student | **Must-Have**    |

**Fee Payment & Financial Management**

| **Feature**                              | **Description**                                                                                                           | **Applies To**         | **Priority**  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------- |
| **Online Card Payment**                  | Students pay fees using a debit or credit card via a secure payment gateway (DPO Pay); real-time confirmation and receipt | Student, Bursar        | **Must-Have** |
| **Mobile Money Payment (MoMo & Airtel)** | Students pay fees via MTN MoMo and Airtel Money directly within the portal using USSD push; real-time confirmation        | Student, Bursar        | **Must-Have** |
| **Bank Transfer Payment**                | Bank transfer option for fee payment with manual or auto-reconciliation by the Bursar                                     | Student, Bursar        | **Must-Have** |
| **Automated Receipt Generation**         | System-generated receipt issued immediately upon payment confirmation regardless of channel                               | Student, Bursar        | **Must-Have** |
| **Payment Tracking**                     | Per-student payment history showing all transactions, amounts, outstanding balances, and deadlines                        | Student, Bursar        | **Must-Have** |
| **Financial Reporting Dashboard**        | Bursar-facing real-time dashboard: total collections, outstanding fees, payment method breakdown                          | Bursar                 | **Must-Have** |
| **Fee Structure Configuration**          | Bursar tool to define tuition fees, levies, and payment deadlines by programme, year group, or student category           | Bursar                 | **Must-Have** |
| **Fee Hold Management**                  | Bursar can apply or remove account holds that block a student from registering or accessing results                       | Bursar, Academic Admin | **Must-Have** |

**E-Learning & Virtual Classrooms**

| **Feature**                         | **Description**                                                                                               | **Applies To**           | **Priority**     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------- |
| **Virtual Classroom**               | Integrated live or asynchronous class sessions with video support, attendance tracking, and session recording | Lecturer, Student        | **Nice-to-Have** |
| **Assignment Submission & Grading** | Students submit assignments digitally; lecturers review, annotate, and return grades within the platform      | Lecturer, Student        | **Must-Have**    |
| **Online Assessments**              | Timed online quizzes and examinations with auto-grading for objective questions                               | Lecturer, Student        | **Nice-to-Have** |
| **Lecturer Content Dashboard**      | Lecturer-facing panel for uploading materials, managing course content, and tracking student engagement       | Lecturer                 | **Must-Have**    |
| **Attendance Tracking**             | Digital attendance marking per session; feeds into at-risk detection and official records                     | Lecturer, Academic Admin | **Must-Have**    |

**E-Library & Digital Resources**

| **Feature**                       | **Description**                                                                                                                    | **Applies To**               | **Priority**     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------- |
| **Library Resource Management**   | Librarian interface to add, edit, delete, and organise all digital resources: e-books, journals, research papers, and course packs | Librarian                    | **Must-Have**    |
| **Resource Access Control**       | Librarian can restrict specific resources to designated programmes, departments, or year groups                                    | Librarian                    | **Must-Have**    |
| **Resource Request Handling**     | Students and lecturers submit resource requests; Librarian reviews and fulfils or declines within the platform                     | Librarian, Student, Lecturer | **Nice-to-Have** |
| **Library Usage Analytics**       | Librarian dashboard: most-accessed resources, active users, and search trend data                                                  | Librarian                    | **Nice-to-Have** |
| **Course Material Access**        | Students access all materials uploaded by their lecturers from within their course pages                                           | Student                      | **Must-Have**    |
| **24-Hour Resource Availability** | Library and course materials accessible at any time from any device, including mobile                                              | Student                      | **Must-Have**    |

**AI & Automation Features**

| **Feature**                     | **Description**                                                                                                                     | **Applies To**           | **Priority**     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------- |
| **AI Academic Risk Detection**  | Machine learning model flags students showing early signs of academic distress based on grades, attendance, and engagement patterns | Lecturer, Academic Admin | **Nice-to-Have** |
| **Performance Trend Analytics** | Visual analytics: grade distributions, attendance trends, and cohort performance over time                                          | Lecturer, Academic Admin | **Nice-to-Have** |
| **Automated Notifications**     | System-triggered SMS and email alerts for results, fee deadlines, registration windows, and at-risk flags                           | All roles                | **Must-Have**    |

**Platform Administration (ICT Manager)**

| **Feature**                          | **Description**                                                                                             | **Applies To** | **Priority**     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------- | ---------------- |
| **User Account Management**          | Create, edit, suspend, and permanently delete accounts for all user types across the platform               | ICT Manager    | **Must-Have**    |
| **Admin Access Level Assignment**    | Assign and change admin access levels (Bursar, Academic Admin, Librarian) for admin users                   | ICT Manager    | **Must-Have**    |
| **Access Revocation**                | Immediately revoke platform access for any user - student, lecturer, or admin - at any time                 | ICT Manager    | **Must-Have**    |
| **Role-Based Access Control Engine** | Underlying permission system that enforces module-level access rules for all user types                     | ICT Manager    | **Must-Have**    |
| **System Audit Log**                 | Timestamped, tamper-proof log of all significant actions taken by any user across the platform              | ICT Manager    | **Must-Have**    |
| **Institution Configuration**        | Configure institution name, branding, notification templates, and system-level preferences                  | ICT Manager    | **Nice-to-Have** |
| **Integration Management**           | Manage API keys and configuration for external services (payment gateways, SMS provider, third-party tools) | ICT Manager    | **Nice-to-Have** |
| **Institution-Wide Analytics**       | Cross-module dashboard: enrolment, financials, academic health, library usage, and system activity          | ICT Manager    | **Nice-to-Have** |

# **C3 Screen Inventory**

Every screen grouped by role. Total count is an estimate; some screens may be split or merged during detailed design.

## **C3.0 Authentication (All Roles)**

| **Screen**            | **Purpose**                                             | **Primary Action**   |
| --------------------- | ------------------------------------------------------- | -------------------- |
| Login                 | Email/password entry with institution-specific branding | Submit credentials   |
| Two-Step Verification | OTP entry for users with 2FA enabled                    | Enter and verify OTP |
| Forgot Password       | Email or phone-based password reset flow                | Request reset link   |
| Reset Password        | New password entry after following reset link           | Set new password     |

## **C3.1 Student (15 screens)**

| **Screen**            | **Purpose**                                                                                   | **Primary Action**                     |
| --------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| Student Dashboard     | Personal home: GPA summary, pending fees, upcoming deadlines, recent notifications            | Navigate to active task                |
| Onboarding Checklist  | Step-by-step first-login orientation guide for new students                                   | Complete onboarding steps              |
| My Profile            | Personal and academic profile: name, ID, programme, year, contact details                     | View and request profile edits         |
| Course Registration   | Semester course selection: browse available courses, check prerequisites, add to registration | Submit course registration             |
| My Courses            | All enrolled courses for the current semester with status and lecturer info                   | Navigate into a course                 |
| Course Detail         | Materials, assignments, announcements, and attendance for a single enrolled course            | Download material or submit assignment |
| Assignment Submission | Upload or compose a submission for a specific assignment                                      | Submit assignment                      |
| Academic Results      | Grade sheet per semester and cumulative GPA/CGPA view                                         | View result details                    |
| Transcript            | Official academic transcript in preview and downloadable PDF format                           | Download transcript                    |
| Timetable             | Weekly schedule of enrolled courses with room and lecturer info                               | View schedule                          |
| Fee Statement         | Outstanding balance, full payment history, and upcoming deadlines                             | Initiate payment                       |
| Make Payment          | Payment method selector: MTN MoMo, Airtel Money, card, or bank transfer                       | Complete payment                       |
| Payment Receipt       | Confirmation screen and downloadable receipt after successful payment                         | Download receipt                       |
| E-Library             | Browse and search the institution's digital resources and journal database                    | Open or download resource              |
| Notifications         | Full notification history: results released, fees due, registration windows                   | Mark as read or act                    |

## **C3.2 Lecturer (13 screens)**

| **Screen**                | **Purpose**                                                                            | **Primary Action**                   |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| Lecturer Dashboard        | Overview: assigned courses, upcoming deadlines, pending result entries, at-risk alerts | Navigate to active task              |
| My Courses                | All courses assigned for the current semester                                          | Navigate into a course               |
| Course Management         | Upload materials, post announcements, manage course content library                    | Upload material or post announcement |
| Student Roster            | Full list of students enrolled in a specific course                                    | View student profile                 |
| Attendance Entry          | Mark present/absent/late for each student per class session                            | Submit attendance record             |
| Attendance History        | Session-by-session attendance log for a course; downloadable report                    | Export attendance report             |
| Result Entry              | Enter, review, and submit marks per student per assessment component                   | Submit result for publishing         |
| Result Review             | Read-only view of published results for own courses; grade distribution chart          | View grade distribution              |
| Assignment Management     | Create assignments, set deadlines, view submission status                              | Create or grade assignment           |
| Submission Review         | View, annotate, and grade an individual student's assignment submission                | Submit grade and feedback            |
| Online Assessment Builder | Create timed quizzes or examinations with question bank management                     | Publish assessment                   |
| Performance Analytics     | Course-level charts: grade distributions, attendance trends, at-risk overview          | View or export report                |
| At-Risk Alerts            | AI-generated list of students flagged for academic distress with supporting data       | Initiate follow-up or dismiss        |

## **C3.3 Bursar (7 screens)**

| **Screen**                  | **Purpose**                                                                                | **Primary Action**                |
| --------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| Bursar Dashboard            | Financial KPIs: total collected, outstanding balances, payment channel breakdown           | Navigate to priority task         |
| Fee Structure Configuration | Define and update tuition fees, levies, and payment deadlines per programme and year group | Save fee structure                |
| Payment Ledger              | Full searchable record of all transactions across all students and payment channels        | Search or export transactions     |
| Student Fee Account         | Per-student view: total owed, amount paid, outstanding balance, full transaction history   | Apply hold or issue receipt       |
| Receipt Management          | Issue, reprint, or void payment receipts for any transaction                               | Issue or void receipt             |
| Financial Reports           | Generate and export reports by date range, programme, payment channel, or student cohort   | Generate and download report      |
| Payment Reconciliation      | Review and reconcile payments flagged as pending or failed by the payment gateway          | Reconcile or escalate transaction |

## **C3.4 Academic Admin (13 screens)**

| **Screen**                   | **Purpose**                                                                                             | **Primary Action**                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Academic Admin Dashboard     | Overview: enrolment numbers, pending applications, registration status, result progress, at-risk alerts | Navigate to priority task             |
| Application Inbox            | All pending, approved, and rejected applications for the current intake                                 | Review and action application         |
| Application Detail           | Full application profile with uploaded documents and review workflow                                    | Approve, reject, or request documents |
| Student Registry             | Full searchable student list filtered by programme, year, and status                                    | View or manage student record         |
| Student Profile (Admin View) | Complete student record: personal data, enrolment history, results, and attendance                      | Edit, suspend, or graduate student    |
| Course Catalogue             | Master list of all courses and modules; create, edit, and archive                                       | Create or edit course                 |
| Programme Management         | Define and manage academic programmes, credit requirements, and module structures                       | Create or update programme            |
| Academic Calendar            | Set and publish the academic year calendar: semester dates, registration windows, exam periods          | Publish calendar                      |
| Timetable Manager            | Input or auto-generate the semester timetable and resolve conflicts                                     | Publish timetable                     |
| Faculty Management           | View lecturer accounts, assign courses, and manage course load                                          | Assign course to lecturer             |
| Result Management            | Monitor result entry progress across all courses; approve and batch-publish results                     | Publish results batch                 |
| Academic Report Builder      | Configure and export reports by programme, department, semester, or cohort                              | Generate and download report          |
| At-Risk Management           | Institution-wide view of AI-flagged at-risk students; assign advisor follow-ups                         | Assign follow-up action               |

## **C3.5 Librarian (7 screens)**

| **Screen**          | **Purpose**                                                                                                      | **Primary Action**        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Library Dashboard   | Overview: total resources, recently added, most accessed, pending resource requests                              | Navigate to task          |
| Resource Catalogue  | Full searchable list of all e-library resources with filter by type, subject, and department                     | Edit or manage resource   |
| Add Resource        | Form to upload a new resource with metadata: title, author, ISBN, subject tags, access restrictions, file upload | Save and publish resource |
| Edit Resource       | Update metadata, replace file, or change access settings for an existing resource                                | Save changes              |
| Collections Manager | Create and organise thematic collections and reading lists for courses or departments                            | Publish collection        |
| Resource Requests   | List of resource requests submitted by students and lecturers                                                    | Fulfil or decline request |
| Library Analytics   | Usage dashboard: most-accessed resources, active users, search keywords, download counts                         | View or export analytics  |

## **C3.6 ICT Manager (10 screens)**

| **Screen**                 | **Purpose**                                                                                                    | **Primary Action**            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| ICT Dashboard              | Platform-wide health: active users by role, system status, recent audit events, key metrics across all modules | Navigate to module or alert   |
| User Management            | Full list of all platform users; create, edit, suspend, and delete accounts                                    | Create or update user         |
| Create / Edit User         | Form to create or edit an account: role, access level (for admins), contact details, status                    | Save account                  |
| Role & Access Levels       | Configure which modules and actions each admin access level can perform                                        | Save permission configuration |
| Access Revocation          | Immediate suspension or permanent deletion of any user's access with a mandatory reason field                  | Revoke access                 |
| Audit Log                  | Tamper-proof timestamped log of all significant system actions; searchable by user, action, date, and module   | Search and review log entry   |
| System Settings            | Institution branding, notification templates, system preferences, and integration credentials                  | Save configuration            |
| Integration Management     | Manage API connections to payment gateways, SMS providers, and third-party services                            | Configure or test integration |
| Institution-Wide Analytics | Cross-module analytics: enrolment, financials, academic performance, library usage, system activity            | View or export report         |
| Notification Centre        | Create and send platform-wide announcements via SMS, email, or in-app to any user segment                      | Send announcement             |

# **Part D - Technical Architecture**

# **D1 Frontend Stack**

| **Layer**         | **Technology**                     | **Rationale**                                                                                                            |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Language          | **TypeScript 5.8**                 | Strict mode enforced. Identical to StackFix - types shared across the monorepo.                                          |
| UI Library        | **React 19**                       | Same as StackFix. Functional components and hooks only. No class components.                                             |
| Routing           | **TanStack Router v1**             | File-based routing matching StackFix's src/routes/ pattern. Each route exports createFileRoute() with a head() for meta. |
| Server State      | **TanStack Query v5**              | All server data via useQuery and useMutation. No manual fetch + useState for remote data.                                |
| Build Tool        | **Vite 7 + TanStack Start**        | SSR-capable. Configured via @lovable.dev/vite-tanstack-config.                                                           |
| Package Manager   | **Bun**                            | Use bun install and bun dev. Do not use npm or yarn.                                                                     |
| Deployment        | **Cloudflare (Wrangler)**          | Edge deployment matching StackFix. wrangler.jsonc in project root.                                                       |
| Component Library | **shadcn/ui + Radix UI**           | Components copied into src/components/ui/ and owned by the project. Customise freely without upstream conflicts.         |
| Styling           | **Tailwind CSS v4**                | Utility-first. All design tokens in :root via @theme inline block. Copy from StackFix src/styles.css.                    |
| Forms             | **React Hook Form + Zod**          | Zod used as resolver. Same pattern as StackFix.                                                                          |
| Icons             | **Lucide React ^0.575**            | Import icons by name - do not import the full set.                                                                       |
| Toasts            | **Sonner ^2.0**                    | Already wired in StackFix; reuse the same setup.                                                                         |
| Charts            | **Recharts ^2.15**                 | All data visualisation components.                                                                                       |
| Utilities         | **clsx + tailwind-merge**          | Compose Tailwind classes via cn() helper. Import from src/lib/utils.ts, not from components.                             |
| Variants          | **class-variance-authority (cva)** | Variant-based className composition for Button, Badge, and other multi-variant components.                               |

# **D2 Backend Stack**

| **Layer**        | **Technology**                       | **Rationale**                                                                                                                                                                                         |
| ---------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language         | **TypeScript (Node.js 22)**          | Shared language with the frontend. Types shared across the monorepo, reducing duplication.                                                                                                            |
| API Framework    | **Hono.js**                          | Lightweight, edge-compatible, TypeScript-first. Works natively on Cloudflare Workers. Faster than Express for API-heavy workloads.                                                                    |
| ORM              | **Drizzle ORM**                      | TypeScript-native with zero-overhead SQL and full type inference. Supports PostgreSQL. Migration-first workflow.                                                                                      |
| Primary Database | **PostgreSQL (Neon or Supabase)**    | Relational DB required for the complex academic data model. Both offer serverless Postgres with connection pooling compatible with Cloudflare Workers.                                                |
| File Storage     | **Cloudflare R2**                    | S3-compatible object storage for student documents, assignment submissions, and e-library files. Zero egress fees. Native Cloudflare integration.                                                     |
| Authentication   | **Better Auth or Clerk**             | JWT-based auth with session management, 2FA support, and RBAC. Both support multi-tenancy. Clerk is faster to set up; Better Auth is fully self-hosted if data residency requires it.                 |
| Email            | **Resend**                           | Transactional email for admission notifications, result alerts, and fee reminders. Simple REST API; works from Cloudflare Workers.                                                                    |
| SMS              | **Africa's Talking**                 | Rwanda-specific SMS gateway with direct MTN and Airtel routes. Preferred over Twilio for local delivery reliability and cost.                                                                         |
| Card Payments    | **DPO Pay**                          | Card payment gateway covering Africa including Rwanda. Handles debit and credit card transactions.                                                                                                    |
| Mobile Money     | **MTN MoMo API + Airtel Money API**  | Direct mobile money integration. USSD push payment flow for students paying via mobile.                                                                                                               |
| Background Jobs  | **Cloudflare Queues or BullMQ**      | Async task processing: PDF generation (transcripts, receipts), bulk SMS/email dispatch, AI risk detection jobs. Cloudflare Queues for fully serverless; BullMQ + Redis if persistent queue preferred. |
| API Docs         | **OpenAPI 3.1 (Hono + Zod OpenAPI)** | Auto-generate the spec from Zod schemas and Hono route definitions. Spec is the frontend-backend contract - agree before building the data-fetching layer.                                            |
| Monorepo         | **Turborepo**                        | Manages apps/web and apps/api as packages with shared types, shared Zod schemas, and coordinated build pipelines.                                                                                     |

# **D3 Folder Structure**

_ℹ Monorepo with two apps (web and api) and a shared package. The frontend structure mirrors StackFix with additions for StackEDU's wider role surface._

| **Path**                         | **Contents**                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **apps/web/**                    | React frontend. Internal structure mirrors StackFix.                                                             |
| **apps/web/src/routes/**         | One file per route. Public routes (login, apply) at root. Authenticated routes nested under \_auth/.             |
| **apps/web/src/routes/\_auth/**  | Layout route enforcing authentication. Sub-folders: student/, lecturer/, bursar/, academic/, librarian/, ict/.   |
| **apps/web/src/components/ui/**  | shadcn/ui components. Do not edit generated files - extend via wrappers.                                         |
| **apps/web/src/components/**     | Shared composite components: AppShell.tsx, Sidebar.tsx, Header.tsx, StatTile.tsx, DataTable.tsx, EmptyState.tsx. |
| **apps/web/src/lib/api/**        | API client functions by domain: students.ts, courses.ts, fees.ts, results.ts, library.ts.                        |
| **apps/web/src/hooks/**          | Custom React hooks: useCurrentUser(), useStudentRecord(), useNotifications().                                    |
| **apps/web/src/styles.css**      | Global CSS: Tailwind import, @theme token block, :root variables. Single source of truth for design tokens.      |
| **apps/api/**                    | Hono.js backend. All route handlers, middleware, and business logic.                                             |
| **apps/api/src/routes/**         | API route files by domain: auth.ts, students.ts, courses.ts, results.ts, payments.ts, library.ts, users.ts.      |
| **apps/api/src/db/**             | Drizzle schema (schema.ts), migration files (migrations/), and DB client (client.ts).                            |
| **apps/api/src/services/**       | Business logic layer - one file per domain. Routes call services; services call the DB.                          |
| **apps/api/src/jobs/**           | Background job definitions: generateTranscript.ts, sendBulkSMS.ts, runRiskDetection.ts.                          |
| **apps/api/src/middleware/**     | Shared Hono middleware: auth.ts (JWT), rbac.ts (role enforcement), logger.ts, rateLimiter.ts.                    |
| **packages/shared/**             | Shared TypeScript types and Zod schemas imported by both apps. Single source of truth for data models.           |
| **packages/shared/src/types/**   | Entity type definitions: Student.ts, Course.ts, Result.ts, Payment.ts, User.ts, LibraryResource.ts.              |
| **packages/shared/src/schemas/** | Zod validation schemas for API request/response bodies. Source for the OpenAPI spec.                             |
| **turbo.json**                   | Turborepo pipeline: build, dev, lint, type-check.                                                                |

# **D4 Data Models (Day 1)**

Define all types in packages/shared/src/types/ before writing any components or API functions.

- Student - id, personalDetails, enrolmentStatus, programme, yearOfStudy, feeHold (boolean), academicRecord
- Course - id, code, name, credits, department, lecturerId, prerequisiteIds\[\], semesterId
- Result - studentId, courseId, semesterId, marks\[\], grade, gpa, publishedAt, publishedBy
- Payment - id, studentId, amount (integer RWF), method (MoMo | Airtel | Card | BankTransfer), status, receiptUrl, createdAt
- LibraryResource - id, title, author, type, subjectTags\[\], accessScope, fileUrl, uploadedBy, createdAt
- Application - id, applicantDetails, programmeApplied, documents\[\], status, reviewedBy, reviewedAt
- User - id, role (Student | Lecturer | Bursar | AcademicAdmin | Librarian | ICTManager), institutionId, email, phone, isActive, createdAt

# **D5 Key API Design Rules**

- RESTful API served from Hono.js on Cloudflare Workers
- All endpoints authenticated via JWT; role and access level enforced by the rbac.ts middleware
- Multi-tenant: every request scoped to an institutionId derived from the authenticated user's token
- All monetary values stored and returned as integers in Rwandan Francs (RWF) - no floats
- OpenAPI 3.1 spec generated from Zod schemas; frontend and backend agree on the spec before building the data-fetching layer
- File uploads (documents, library resources, assignment submissions) go directly to Cloudflare R2 via pre-signed URLs - they do not pass through the API server
- Background jobs (PDF generation, bulk SMS, risk detection) are queued asynchronously - never block an API response