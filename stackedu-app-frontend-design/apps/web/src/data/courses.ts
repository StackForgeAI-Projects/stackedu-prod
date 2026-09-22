// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — Shared Course Mock Data
// Single source of truth consumed by courses.tsx, course-detail.tsx,
// and course-registration.tsx. Replace with TanStack Query calls when
// the API is ready.
// ─────────────────────────────────────────────────────────────────────────────

export type CourseType        = 'Compulsory' | 'Elective'
export type MaterialFileType  = 'PDF' | 'PPTX' | 'DOCX'
export type AssignmentStatus  = 'Pending' | 'Submitted' | 'Graded'
export type SessionStatus     = 'Present' | 'Absent' | 'Late'

export interface CourseMaterial {
  name: string
  type: MaterialFileType
  size: string
}

export interface CourseModule {
  number:      number
  title:       string
  description: string
  materials:   CourseMaterial[]
}

export interface CourseAssignment {
  id:     number
  title:  string
  due:    string
  status: AssignmentStatus
  marks:  string | null
}

export interface AttendanceSession {
  id:     number
  date:   string
  topic:  string
  status: SessionStatus
}

export interface CourseScheduleSlot {
  day:  string
  time: string
  room: string
}

export interface Course {
  id:          string
  code:        string
  name:        string
  type:        CourseType
  lecturer:    string
  credits:     number
  color:       string
  schedule:    CourseScheduleSlot[]
  description: string
  attendance:  { attended: number; total: number }
  modules:     CourseModule[]
  assignments: CourseAssignment[]
  sessions:    AttendanceSession[]
}

// ─────────────────────────────────────────────────────────────────────────────

export const ALL_COURSES: Course[] = [
  // ── CSC 101 ─────────────────────────────────────────────────────────────────
  {
    id:       'csc-101',
    code:     'CSC 101',
    name:     'Introduction to Computer Science',
    type:     'Compulsory',
    lecturer: 'Dr. Emmanuel Nkurunziza',
    credits:  3,
    color:    '#0D9488',
    schedule: [{ day: 'Mon', time: '08:00–10:00', room: 'Lab 3' }],
    description:
      'An introduction to the fundamental concepts of computer science covering algorithms, data representation, and problem-solving techniques. Students gain hands-on experience with programming constructs and explore the historical development of computing. The course provides a strong foundation for further studies in software engineering and related disciplines.',
    attendance: { attended: 14, total: 16 },
    modules: [
      {
        number: 1, title: 'Introduction to CS Concepts',
        description: 'Overview of computer science as a discipline, the history of computing, and fundamental problem-solving strategies. Explores what makes a good algorithm and why it matters.',
        materials: [
          { name: 'Week 1 — Introduction to CS Concepts.pdf',    type: 'PDF',  size: '2.1 MB' },
          { name: 'Lecture Slides — History of Computing.pptx',  type: 'PPTX', size: '3.4 MB' },
        ],
      },
      {
        number: 2, title: 'Number Systems & Binary',
        description: 'Binary, octal, and hexadecimal number systems and their arithmetic. Data representation in memory and encoding of different types.',
        materials: [
          { name: 'Number Systems Notes.pdf', type: 'PDF', size: '1.8 MB' },
        ],
      },
      {
        number: 3, title: 'Data Types & Variables',
        description: 'Primitive data types, variables, constants, and type conversion. Introduction to memory allocation and the storage requirements of common types.',
        materials: [
          { name: 'Data Types & Variables.pptx', type: 'PPTX', size: '3.4 MB' },
          { name: 'Exercise Sheet 3.pdf',         type: 'PDF',  size: '0.6 MB' },
        ],
      },
      {
        number: 4, title: 'Control Flow Basics',
        description: 'Conditional statements, loops, and flow control structures. Writing programs that make decisions and perform repetitive tasks efficiently.',
        materials: [
          { name: 'Control Flow Basics.pdf', type: 'PDF', size: '2.7 MB' },
        ],
      },
      {
        number: 5, title: 'Functions & Scope',
        description: 'Defining and calling functions, parameter passing, return values, and variable scope. Introduction to modular programming principles.',
        materials: [
          { name: 'Functions & Scope.pptx',  type: 'PPTX', size: '4.1 MB' },
          { name: 'Lab Exercise 5.docx',     type: 'DOCX', size: '0.3 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Assignment 1 — Number Conversion',    due: '20 Sep 2024', status: 'Graded',    marks: '18 / 20' },
      { id: 2, title: 'Assignment 2 — Programming Exercise', due: '10 Oct 2024', status: 'Submitted', marks: null },
      { id: 3, title: 'Assignment 3 — Algorithm Design',     due: '01 Nov 2024', status: 'Pending',   marks: null },
    ],
    sessions: [
      { id:  1, date: '04 Sep 2024', topic: 'Introduction to CS Concepts',  status: 'Present' },
      { id:  2, date: '11 Sep 2024', topic: 'Number Systems & Binary',       status: 'Present' },
      { id:  3, date: '18 Sep 2024', topic: 'Data Types & Variables',        status: 'Late'    },
      { id:  4, date: '25 Sep 2024', topic: 'Control Flow Basics',           status: 'Present' },
      { id:  5, date: '02 Oct 2024', topic: 'Functions & Scope',             status: 'Absent'  },
      { id:  6, date: '09 Oct 2024', topic: 'Arrays and Collections',        status: 'Present' },
      { id:  7, date: '16 Oct 2024', topic: 'Introduction to OOP',           status: 'Present' },
      { id:  8, date: '23 Oct 2024', topic: 'Classes and Objects',           status: 'Present' },
      { id:  9, date: '30 Oct 2024', topic: 'Inheritance & Polymorphism',    status: 'Present' },
      { id: 10, date: '06 Nov 2024', topic: 'File I/O',                      status: 'Present' },
      { id: 11, date: '13 Nov 2024', topic: 'Exception Handling',            status: 'Present' },
      { id: 12, date: '20 Nov 2024', topic: 'Introduction to Databases',     status: 'Present' },
      { id: 13, date: '27 Nov 2024', topic: 'SQL Fundamentals',              status: 'Present' },
      { id: 14, date: '04 Dec 2024', topic: 'Network Basics',                status: 'Present' },
      { id: 15, date: '11 Dec 2024', topic: 'Software Engineering Intro',    status: 'Absent'  },
      { id: 16, date: '18 Dec 2024', topic: 'Course Review & Summary',       status: 'Present' },
    ],
  },

  // ── CSC 102 ─────────────────────────────────────────────────────────────────
  {
    id:       'csc-102',
    code:     'CSC 102',
    name:     'Programming Fundamentals',
    type:     'Compulsory',
    lecturer: 'Prof. Aline Uwimana',
    credits:  3,
    color:    '#0D9488',
    schedule: [{ day: 'Tue', time: '10:00–12:00', room: 'Lab 2' }],
    description:
      'Covers the core principles of programming using a structured approach, focusing on algorithm design, program structure, and debugging techniques. Students write and test programs to solve practical problems across a range of domains. The course builds the programming confidence required for advanced computing modules.',
    attendance: { attended: 10, total: 16 },
    modules: [
      {
        number: 1, title: 'Introduction to Programming',
        description: 'What is programming? Problem decomposition and the programming development cycle. Writing and compiling your first program.',
        materials: [
          { name: 'Intro to Programming.pdf', type: 'PDF',  size: '1.9 MB' },
          { name: 'Dev Environment Setup.docx', type: 'DOCX', size: '0.4 MB' },
        ],
      },
      {
        number: 2, title: 'Variables & Data Types',
        description: 'Storing and manipulating data using variables. Integer, float, string, and boolean types with practical coding examples.',
        materials: [
          { name: 'Variables & Data Types.pptx', type: 'PPTX', size: '2.8 MB' },
        ],
      },
      {
        number: 3, title: 'Control Structures',
        description: 'Decision making with if-else and switch statements. Repetition using for, while, and do-while loops including nested structures.',
        materials: [
          { name: 'Control Structures Notes.pdf',     type: 'PDF',  size: '2.2 MB' },
          { name: 'Lab 3 — Loops Practice.docx',      type: 'DOCX', size: '0.5 MB' },
        ],
      },
      {
        number: 4, title: 'Functions & Modularity',
        description: 'Creating reusable code blocks with functions. Parameters, return types, the call stack, and an introduction to recursive functions.',
        materials: [
          { name: 'Functions & Modularity.pdf', type: 'PDF', size: '3.1 MB' },
        ],
      },
      {
        number: 5, title: 'Arrays & Collections',
        description: 'Working with arrays, lists, and basic collections. Sorting, searching, and traversal algorithms on linear data structures.',
        materials: [
          { name: 'Arrays & Collections.pptx',     type: 'PPTX', size: '3.7 MB' },
          { name: 'Lab 5 — Array Problems.pdf',    type: 'PDF',  size: '1.1 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Assignment 1 — Hello World & Variables', due: '25 Sep 2024', status: 'Graded',  marks: '20 / 20' },
      { id: 2, title: 'Assignment 2 — Loops & Conditions',       due: '15 Oct 2024', status: 'Graded',  marks: '16 / 20' },
      { id: 3, title: 'Assignment 3 — Functions Project',        due: '05 Nov 2024', status: 'Pending', marks: null },
    ],
    sessions: [
      { id:  1, date: '03 Sep 2024', topic: 'Introduction to Programming',  status: 'Present' },
      { id:  2, date: '10 Sep 2024', topic: 'Variables & Data Types',        status: 'Absent'  },
      { id:  3, date: '17 Sep 2024', topic: 'Operators & Expressions',       status: 'Present' },
      { id:  4, date: '24 Sep 2024', topic: 'If-Else Statements',            status: 'Absent'  },
      { id:  5, date: '01 Oct 2024', topic: 'Loops — for & while',           status: 'Present' },
      { id:  6, date: '08 Oct 2024', topic: 'Nested Loops',                  status: 'Absent'  },
      { id:  7, date: '15 Oct 2024', topic: 'Functions Basics',              status: 'Absent'  },
      { id:  8, date: '22 Oct 2024', topic: 'Parameters & Return',           status: 'Present' },
      { id:  9, date: '29 Oct 2024', topic: 'Recursion Introduction',        status: 'Absent'  },
      { id: 10, date: '05 Nov 2024', topic: 'Arrays Basics',                 status: 'Present' },
      { id: 11, date: '12 Nov 2024', topic: 'Array Algorithms',              status: 'Present' },
      { id: 12, date: '19 Nov 2024', topic: 'Strings & Characters',          status: 'Present' },
      { id: 13, date: '26 Nov 2024', topic: 'File Handling',                 status: 'Absent'  },
      { id: 14, date: '03 Dec 2024', topic: 'Mini-Project Workshop',         status: 'Present' },
      { id: 15, date: '10 Dec 2024', topic: 'Code Review Session',           status: 'Present' },
      { id: 16, date: '17 Dec 2024', topic: 'Final Review',                  status: 'Present' },
    ],
  },

  // ── MTH 101 ─────────────────────────────────────────────────────────────────
  {
    id:       'mth-101',
    code:     'MTH 101',
    name:     'Calculus I',
    type:     'Compulsory',
    lecturer: 'Dr. Patrick Habimana',
    credits:  3,
    color:    '#7C3AED',
    schedule: [
      { day: 'Wed', time: '08:00–10:00', room: 'Hall A' },
      { day: 'Fri', time: '14:00–15:00', room: 'Hall A' },
    ],
    description:
      'Introduces the foundational concepts of differential and integral calculus including limits, derivatives, and integrals. Students apply these concepts to solve problems in physics, economics, and engineering contexts. The course emphasises both theoretical understanding and computational proficiency through regular problem sets.',
    attendance: { attended: 8, total: 16 },
    modules: [
      {
        number: 1, title: 'Limits & Continuity',
        description: 'The concept of a limit, evaluating limits algebraically and graphically. Continuity and the classification of different types of discontinuities.',
        materials: [
          { name: 'Limits & Continuity Notes.pdf',  type: 'PDF',  size: '3.2 MB' },
          { name: 'Lecture 1 Slides.pptx',          type: 'PPTX', size: '2.6 MB' },
        ],
      },
      {
        number: 2, title: 'Differentiation',
        description: 'The derivative as a rate of change and as the slope of a tangent. Power, product, quotient, and chain rules with worked examples.',
        materials: [
          { name: 'Differentiation Rules.pdf', type: 'PDF', size: '2.9 MB' },
        ],
      },
      {
        number: 3, title: 'Applications of Derivatives',
        description: 'Optimisation problems, related rates, and curve sketching using first and second derivatives. Real-world applications in science and engineering.',
        materials: [
          { name: 'Applications of Derivatives.pptx', type: 'PPTX', size: '4.0 MB' },
          { name: 'Problem Set 3.pdf',                 type: 'PDF',  size: '0.9 MB' },
        ],
      },
      {
        number: 4, title: 'Integration',
        description: 'Definite and indefinite integrals. Integration techniques including substitution, integration by parts, and partial fractions.',
        materials: [
          { name: 'Integration Techniques.pdf', type: 'PDF', size: '3.5 MB' },
        ],
      },
      {
        number: 5, title: 'Applications of Integration',
        description: 'Computing area under curves, volumes of revolution, and arc length using integration. Applications to physics and economics problems.',
        materials: [
          { name: 'Applications of Integration.pptx', type: 'PPTX', size: '3.8 MB' },
          { name: 'Tutorial Sheet 5.docx',            type: 'DOCX', size: '0.7 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Problem Set 1 — Limits',        due: '22 Sep 2024', status: 'Graded',    marks: '14 / 20' },
      { id: 2, title: 'Problem Set 2 — Differentiation', due: '13 Oct 2024', status: 'Submitted', marks: null },
      { id: 3, title: 'Problem Set 3 — Integration',   due: '03 Nov 2024', status: 'Pending',   marks: null },
    ],
    sessions: [
      { id:  1, date: '04 Sep 2024', topic: 'Introduction to Calculus',        status: 'Present' },
      { id:  2, date: '11 Sep 2024', topic: 'Limits Concept',                  status: 'Absent'  },
      { id:  3, date: '18 Sep 2024', topic: 'Evaluating Limits',               status: 'Absent'  },
      { id:  4, date: '25 Sep 2024', topic: 'Continuity',                      status: 'Present' },
      { id:  5, date: '02 Oct 2024', topic: 'Introduction to Derivatives',     status: 'Absent'  },
      { id:  6, date: '09 Oct 2024', topic: 'Differentiation Rules',           status: 'Absent'  },
      { id:  7, date: '16 Oct 2024', topic: 'Chain Rule',                      status: 'Present' },
      { id:  8, date: '23 Oct 2024', topic: 'Implicit Differentiation',        status: 'Absent'  },
      { id:  9, date: '30 Oct 2024', topic: 'Optimisation Problems',           status: 'Present' },
      { id: 10, date: '06 Nov 2024', topic: 'Related Rates',                   status: 'Present' },
      { id: 11, date: '13 Nov 2024', topic: 'Curve Sketching',                 status: 'Absent'  },
      { id: 12, date: '20 Nov 2024', topic: 'Introduction to Integration',     status: 'Present' },
      { id: 13, date: '27 Nov 2024', topic: 'Definite Integrals',              status: 'Absent'  },
      { id: 14, date: '04 Dec 2024', topic: 'Integration by Substitution',     status: 'Present' },
      { id: 15, date: '11 Dec 2024', topic: 'Integration by Parts',            status: 'Absent'  },
      { id: 16, date: '18 Dec 2024', topic: 'Review & Exam Preparation',       status: 'Present' },
    ],
  },

  // ── ENG 101 ─────────────────────────────────────────────────────────────────
  {
    id:       'eng-101',
    code:     'ENG 101',
    name:     'English Communication Skills',
    type:     'Compulsory',
    lecturer: 'Ms. Grace Mukamana',
    credits:  3,
    color:    '#2563EB',
    schedule: [{ day: 'Tue', time: '14:00–16:00', room: 'Room 101' }],
    description:
      'Develops academic and professional English communication skills including reading comprehension, essay writing, and oral presentations. Students practise research-based writing and learn to communicate ideas clearly and persuasively in academic contexts. The course builds confidence for university-level study and professional environments in Rwanda and beyond.',
    attendance: { attended: 15, total: 16 },
    modules: [
      {
        number: 1, title: 'Academic Writing Fundamentals',
        description: 'Essay structure, paragraph development, thesis statements, and coherence. Writing clear and well-organised academic essays with proper argumentation.',
        materials: [
          { name: 'Academic Writing Guide.pdf',    type: 'PDF',  size: '2.3 MB' },
          { name: 'Essay Structure Slides.pptx',   type: 'PPTX', size: '1.8 MB' },
        ],
      },
      {
        number: 2, title: 'Reading Comprehension Strategies',
        description: 'Techniques for active reading, annotating texts, and identifying main ideas and supporting arguments. Practising with academic and professional texts.',
        materials: [
          { name: 'Reading Strategies Workbook.pdf', type: 'PDF', size: '1.5 MB' },
        ],
      },
      {
        number: 3, title: 'Oral Communication & Presentations',
        description: 'Planning and delivering academic presentations with confidence. Voice projection, body language, slide design, and handling audience questions.',
        materials: [
          { name: 'Presentation Skills.pptx',   type: 'PPTX', size: '2.9 MB' },
          { name: 'Presentation Rubric.pdf',     type: 'PDF',  size: '0.4 MB' },
        ],
      },
      {
        number: 4, title: 'Research & Citation',
        description: 'Finding credible sources, evaluating information quality, and using APA and MLA citation styles correctly in academic work.',
        materials: [
          { name: 'Research & Citation Guide.pdf', type: 'PDF', size: '1.6 MB' },
        ],
      },
      {
        number: 5, title: 'Professional Writing',
        description: 'Writing emails, reports, memos, and cover letters for professional contexts. Tone, clarity, and formatting for business communication.',
        materials: [
          { name: 'Professional Writing Templates.docx', type: 'DOCX', size: '0.8 MB' },
          { name: 'Business Communication Notes.pdf',    type: 'PDF',  size: '2.1 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Essay 1 — Descriptive Writing',        due: '18 Sep 2024', status: 'Graded',  marks: '17 / 20' },
      { id: 2, title: 'Oral Presentation — Research Topic',   due: '09 Oct 2024', status: 'Graded',  marks: '19 / 20' },
      { id: 3, title: 'Essay 2 — Argumentative Writing',      due: '30 Oct 2024', status: 'Pending', marks: null },
    ],
    sessions: [
      { id:  1, date: '03 Sep 2024', topic: 'Course Introduction',        status: 'Present' },
      { id:  2, date: '10 Sep 2024', topic: 'Essay Structure',            status: 'Present' },
      { id:  3, date: '17 Sep 2024', topic: 'Thesis Statements',          status: 'Present' },
      { id:  4, date: '24 Sep 2024', topic: 'Paragraph Development',      status: 'Present' },
      { id:  5, date: '01 Oct 2024', topic: 'Reading Strategies',         status: 'Present' },
      { id:  6, date: '08 Oct 2024', topic: 'Critical Reading',           status: 'Present' },
      { id:  7, date: '15 Oct 2024', topic: 'Oral Presentations',         status: 'Present' },
      { id:  8, date: '22 Oct 2024', topic: 'Delivery Techniques',        status: 'Absent'  },
      { id:  9, date: '29 Oct 2024', topic: 'Research Methods',           status: 'Present' },
      { id: 10, date: '05 Nov 2024', topic: 'Citation Styles',            status: 'Present' },
      { id: 11, date: '12 Nov 2024', topic: 'Email & Memo Writing',       status: 'Present' },
      { id: 12, date: '19 Nov 2024', topic: 'Report Writing',             status: 'Present' },
      { id: 13, date: '26 Nov 2024', topic: 'Cover Letter & CV',          status: 'Present' },
      { id: 14, date: '03 Dec 2024', topic: 'Peer Review Workshop',       status: 'Present' },
      { id: 15, date: '10 Dec 2024', topic: 'Student Presentations',      status: 'Present' },
      { id: 16, date: '17 Dec 2024', topic: 'Course Wrap-up',             status: 'Present' },
    ],
  },

  // ── CSC 103 ─────────────────────────────────────────────────────────────────
  {
    id:       'csc-103',
    code:     'CSC 103',
    name:     'Digital Logic Design',
    type:     'Elective',
    lecturer: 'Dr. James Uwera',
    credits:  3,
    color:    '#0D9488',
    schedule: [{ day: 'Mon', time: '14:00–16:00', room: 'Lab 1' }],
    description:
      'Explores the design and analysis of digital circuits using Boolean algebra, logic gates, and combinational and sequential logic. Students design basic digital systems and understand how hardware implements computing operations. The course provides the link between abstract logic and real hardware design fundamentals.',
    attendance: { attended: 12, total: 14 },
    modules: [
      {
        number: 1, title: 'Boolean Algebra',
        description: 'Fundamental Boolean operations, laws, and theorems. Simplification of Boolean expressions using algebraic methods and truth tables.',
        materials: [
          { name: 'Boolean Algebra.pdf',       type: 'PDF',  size: '2.4 MB' },
          { name: 'Lecture 1 Slides.pptx',     type: 'PPTX', size: '3.1 MB' },
        ],
      },
      {
        number: 2, title: 'Logic Gates & Circuits',
        description: 'AND, OR, NOT, NAND, NOR, and XOR gates and their truth tables. Building and analysing simple combinational logic circuits.',
        materials: [
          { name: 'Logic Gates Reference.pdf', type: 'PDF', size: '1.7 MB' },
        ],
      },
      {
        number: 3, title: 'Combinational Logic',
        description: 'Designing combinational circuits: multiplexers, decoders, encoders, and adders. Karnaugh maps for Boolean expression minimisation.',
        materials: [
          { name: 'Combinational Logic.pptx',  type: 'PPTX', size: '4.2 MB' },
          { name: 'K-Map Problems.pdf',         type: 'PDF',  size: '0.8 MB' },
        ],
      },
      {
        number: 4, title: 'Sequential Logic',
        description: 'Flip-flops, latches, and registers. Designing sequential circuits including counters and finite state machines.',
        materials: [
          { name: 'Sequential Logic Notes.pdf', type: 'PDF', size: '3.0 MB' },
        ],
      },
      {
        number: 5, title: 'Digital System Design',
        description: 'Integrating combinational and sequential logic into functional digital systems. Introduction to hardware description languages.',
        materials: [
          { name: 'Digital System Design.pptx', type: 'PPTX', size: '4.5 MB' },
          { name: 'Lab Project Brief.docx',      type: 'DOCX', size: '0.6 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Lab Report 1 — Logic Gates',           due: '25 Sep 2024', status: 'Graded',    marks: '16 / 20' },
      { id: 2, title: 'Lab Report 2 — Combinational Circuits', due: '16 Oct 2024', status: 'Submitted', marks: null },
      { id: 3, title: 'Design Project — Sequential Circuit',  due: '06 Nov 2024', status: 'Pending',   marks: null },
    ],
    sessions: [
      { id:  1, date: '02 Sep 2024', topic: 'Introduction to Digital Logic',  status: 'Present' },
      { id:  2, date: '09 Sep 2024', topic: 'Boolean Algebra Basics',         status: 'Present' },
      { id:  3, date: '16 Sep 2024', topic: 'Boolean Simplification',         status: 'Present' },
      { id:  4, date: '23 Sep 2024', topic: 'Logic Gates',                    status: 'Present' },
      { id:  5, date: '30 Sep 2024', topic: 'Circuit Diagrams',               status: 'Absent'  },
      { id:  6, date: '07 Oct 2024', topic: 'Combinational Circuits',         status: 'Present' },
      { id:  7, date: '14 Oct 2024', topic: 'Multiplexers & Decoders',        status: 'Present' },
      { id:  8, date: '21 Oct 2024', topic: 'Karnaugh Maps',                  status: 'Present' },
      { id:  9, date: '28 Oct 2024', topic: 'Flip-Flops',                     status: 'Absent'  },
      { id: 10, date: '04 Nov 2024', topic: 'Registers & Counters',           status: 'Present' },
      { id: 11, date: '11 Nov 2024', topic: 'State Machines',                 status: 'Present' },
      { id: 12, date: '18 Nov 2024', topic: 'System Integration',             status: 'Present' },
      { id: 13, date: '25 Nov 2024', topic: 'HDL Introduction',               status: 'Present' },
      { id: 14, date: '02 Dec 2024', topic: 'Project Presentations',          status: 'Present' },
    ],
  },

  // ── PHY 101 ─────────────────────────────────────────────────────────────────
  {
    id:       'phy-101',
    code:     'PHY 101',
    name:     'Physics I',
    type:     'Elective',
    lecturer: 'Prof. Sarah Ingabire',
    credits:  3,
    color:    '#D97706',
    schedule: [{ day: 'Thu', time: '14:00–16:00', room: 'Lab 4' }],
    description:
      'Covers the principles of classical mechanics including kinematics, dynamics, work-energy theorem, momentum, and rotational motion. Students conduct practical experiments to verify theoretical concepts and develop quantitative reasoning. The course provides physics foundations essential for engineering and applied science programmes.',
    attendance: { attended: 5, total: 14 },
    modules: [
      {
        number: 1, title: 'Mechanics & Motion',
        description: 'Kinematics in one and two dimensions. Displacement, velocity, acceleration, and the equations of uniformly accelerated motion.',
        materials: [
          { name: 'Mechanics & Motion.pdf',              type: 'PDF',  size: '2.8 MB' },
          { name: 'Lecture Slides — Kinematics.pptx',   type: 'PPTX', size: '3.6 MB' },
        ],
      },
      {
        number: 2, title: "Newton's Laws",
        description: "Newton's three laws of motion and their real-world applications. Free body diagrams, friction, normal force, and net force analysis.",
        materials: [
          { name: "Newton's Laws Notes.pdf", type: 'PDF', size: '2.1 MB' },
        ],
      },
      {
        number: 3, title: 'Work, Energy & Power',
        description: 'The work-energy theorem, kinetic and potential energy, conservation of energy, and power calculations in mechanical systems.',
        materials: [
          { name: 'Work Energy Power.pptx',  type: 'PPTX', size: '2.9 MB' },
          { name: 'Problem Sheet 3.pdf',     type: 'PDF',  size: '0.7 MB' },
        ],
      },
      {
        number: 4, title: 'Momentum & Collisions',
        description: 'Linear momentum, impulse, and conservation of momentum in elastic and inelastic collisions with practical examples.',
        materials: [
          { name: 'Momentum & Collisions.pdf', type: 'PDF', size: '2.4 MB' },
        ],
      },
      {
        number: 5, title: 'Rotational Motion',
        description: 'Angular displacement, velocity, and acceleration. Torque, moment of inertia, and the dynamics of rotating bodies.',
        materials: [
          { name: 'Rotational Motion.pptx',     type: 'PPTX', size: '4.0 MB' },
          { name: 'Lab Report Template.docx',   type: 'DOCX', size: '0.4 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Lab Report 1 — Free Fall Experiment',   due: '28 Sep 2024', status: 'Graded',  marks: '12 / 20' },
      { id: 2, title: "Problem Set 2 — Newton's Laws",         due: '19 Oct 2024', status: 'Pending', marks: null },
      { id: 3, title: 'Lab Report 3 — Energy Conservation',    due: '09 Nov 2024', status: 'Pending', marks: null },
    ],
    sessions: [
      { id:  1, date: '05 Sep 2024', topic: 'Introduction to Physics',    status: 'Present' },
      { id:  2, date: '12 Sep 2024', topic: 'Kinematics',                 status: 'Absent'  },
      { id:  3, date: '19 Sep 2024', topic: 'Motion Equations',           status: 'Absent'  },
      { id:  4, date: '26 Sep 2024', topic: "Newton's Laws",              status: 'Present' },
      { id:  5, date: '03 Oct 2024', topic: 'Free Body Diagrams',         status: 'Absent'  },
      { id:  6, date: '10 Oct 2024', topic: 'Friction Forces',            status: 'Absent'  },
      { id:  7, date: '17 Oct 2024', topic: 'Work & Energy',              status: 'Absent'  },
      { id:  8, date: '24 Oct 2024', topic: 'Conservation of Energy',     status: 'Present' },
      { id:  9, date: '31 Oct 2024', topic: 'Power',                      status: 'Absent'  },
      { id: 10, date: '07 Nov 2024', topic: 'Momentum',                   status: 'Present' },
      { id: 11, date: '14 Nov 2024', topic: 'Collisions',                 status: 'Absent'  },
      { id: 12, date: '21 Nov 2024', topic: 'Rotational Motion',          status: 'Present' },
      { id: 13, date: '28 Nov 2024', topic: 'Torque & Inertia',           status: 'Absent'  },
      { id: 14, date: '05 Dec 2024', topic: 'Course Review',              status: 'Absent'  },
    ],
  },

  // ── CSC 104 ─────────────────────────────────────────────────────────────────
  {
    id:       'csc-104',
    code:     'CSC 104',
    name:     'Computer Organisation',
    type:     'Elective',
    lecturer: 'Dr. Peter Nzeyimana',
    credits:  3,
    color:    '#0D9488',
    schedule: [{ day: 'Wed', time: '14:00–16:00', room: 'Lab 1' }],
    description:
      'Examines how computers are internally organised — from logic gates and circuits through to the processor, memory hierarchy, and I/O systems. Students learn how high-level code maps to machine instructions and hardware execution. The course bridges the conceptual gap between software and physical computer hardware.',
    attendance: { attended: 11, total: 14 },
    modules: [
      {
        number: 1, title: 'Digital Logic Review',
        description: 'A concise review of Boolean algebra, gates, and combinational circuits as the foundational building blocks of computer hardware.',
        materials: [
          { name: 'Digital Logic Review.pdf',  type: 'PDF',  size: '1.9 MB' },
          { name: 'Review Slides.pptx',        type: 'PPTX', size: '2.5 MB' },
        ],
      },
      {
        number: 2, title: 'Computer Architecture Overview',
        description: 'Von Neumann and Harvard architectures. CPU components: ALU, control unit, registers, and the system bus.',
        materials: [
          { name: 'Architecture Overview.pdf', type: 'PDF', size: '2.7 MB' },
        ],
      },
      {
        number: 3, title: 'Instruction Set Architecture',
        description: 'Machine instructions, addressing modes, and the fetch-decode-execute cycle. Introduction to assembly language programming.',
        materials: [
          { name: 'ISA & Assembly.pptx',       type: 'PPTX', size: '3.8 MB' },
          { name: 'Assembly Exercises.pdf',    type: 'PDF',  size: '1.2 MB' },
        ],
      },
      {
        number: 4, title: 'Memory Hierarchy',
        description: 'Cache memory, RAM, and secondary storage. Memory addressing, paging, segmentation, and virtual memory concepts.',
        materials: [
          { name: 'Memory Hierarchy.pdf', type: 'PDF', size: '2.9 MB' },
        ],
      },
      {
        number: 5, title: 'I/O Systems',
        description: 'Input/output interfaces, DMA, interrupt-driven I/O, and peripheral device communication protocols.',
        materials: [
          { name: 'IO Systems.pptx',     type: 'PPTX', size: '3.3 MB' },
          { name: 'Lab Manual.docx',     type: 'DOCX', size: '0.9 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Assignment 1 — Architecture Comparison', due: '01 Oct 2024', status: 'Graded',    marks: '15 / 20' },
      { id: 2, title: 'Assignment 2 — Assembly Programming',    due: '22 Oct 2024', status: 'Submitted', marks: null },
      { id: 3, title: 'Assignment 3 — Memory Design',           due: '12 Nov 2024', status: 'Pending',   marks: null },
    ],
    sessions: [
      { id:  1, date: '04 Sep 2024', topic: 'Digital Logic Review',       status: 'Present' },
      { id:  2, date: '11 Sep 2024', topic: 'Computer Architecture',      status: 'Present' },
      { id:  3, date: '18 Sep 2024', topic: 'CPU Components',             status: 'Present' },
      { id:  4, date: '25 Sep 2024', topic: 'Registers & Buses',          status: 'Absent'  },
      { id:  5, date: '02 Oct 2024', topic: 'Instruction Set Arch.',      status: 'Present' },
      { id:  6, date: '09 Oct 2024', topic: 'Addressing Modes',           status: 'Present' },
      { id:  7, date: '16 Oct 2024', topic: 'Assembly Language',          status: 'Present' },
      { id:  8, date: '23 Oct 2024', topic: 'Fetch-Decode-Execute',       status: 'Present' },
      { id:  9, date: '30 Oct 2024', topic: 'Cache Memory',               status: 'Absent'  },
      { id: 10, date: '06 Nov 2024', topic: 'Virtual Memory',             status: 'Present' },
      { id: 11, date: '13 Nov 2024', topic: 'I/O Interfaces',             status: 'Present' },
      { id: 12, date: '20 Nov 2024', topic: 'DMA & Interrupts',           status: 'Present' },
      { id: 13, date: '27 Nov 2024', topic: 'Peripheral Devices',         status: 'Absent'  },
      { id: 14, date: '04 Dec 2024', topic: 'Review Session',             status: 'Present' },
    ],
  },

  // ── MTH 102 ─────────────────────────────────────────────────────────────────
  {
    id:       'mth-102',
    code:     'MTH 102',
    name:     'Statistics I',
    type:     'Elective',
    lecturer: 'Prof. Claire Mutesi',
    credits:  3,
    color:    '#7C3AED',
    schedule: [{ day: 'Fri', time: '08:00–10:00', room: 'Room 204' }],
    description:
      'Introduces statistical methods for data collection, analysis, and interpretation with practical applications. Topics include descriptive statistics, probability theory, common distributions, and hypothesis testing fundamentals. Students apply statistical tools to real datasets drawn from science, business, and social research.',
    attendance: { attended: 14, total: 14 },
    modules: [
      {
        number: 1, title: 'Descriptive Statistics',
        description: 'Measures of central tendency and dispersion: mean, median, mode, variance, and standard deviation. Data visualisation techniques and exploratory data analysis.',
        materials: [
          { name: 'Descriptive Statistics.pdf',  type: 'PDF',  size: '2.2 MB' },
          { name: 'Lecture 1 Slides.pptx',       type: 'PPTX', size: '2.8 MB' },
        ],
      },
      {
        number: 2, title: 'Probability Theory',
        description: "Sample spaces, events, and probability axioms. Conditional probability, independence, and Bayes' theorem with worked examples.",
        materials: [
          { name: 'Probability Theory Notes.pdf', type: 'PDF', size: '3.0 MB' },
        ],
      },
      {
        number: 3, title: 'Probability Distributions',
        description: 'Discrete distributions: Binomial and Poisson. Continuous distributions: Normal, exponential, and uniform, with practical applications.',
        materials: [
          { name: 'Probability Distributions.pptx', type: 'PPTX', size: '4.1 MB' },
          { name: 'Distribution Tables.pdf',         type: 'PDF',  size: '0.5 MB' },
        ],
      },
      {
        number: 4, title: 'Sampling & Estimation',
        description: 'Random sampling methods, sampling distributions, point estimation, and the construction of confidence intervals.',
        materials: [
          { name: 'Sampling & Estimation.pdf', type: 'PDF', size: '2.6 MB' },
        ],
      },
      {
        number: 5, title: 'Hypothesis Testing',
        description: "Null and alternative hypotheses, test statistics, p-values, and decision rules. t-tests, chi-square tests, and an introduction to ANOVA.",
        materials: [
          { name: 'Hypothesis Testing.pptx',         type: 'PPTX', size: '3.4 MB' },
          { name: 'Test Practice Problems.docx',     type: 'DOCX', size: '0.8 MB' },
        ],
      },
    ],
    assignments: [
      { id: 1, title: 'Assignment 1 — Descriptive Analysis',   due: '21 Sep 2024', status: 'Graded',    marks: '20 / 20' },
      { id: 2, title: 'Assignment 2 — Probability Problems',   due: '12 Oct 2024', status: 'Graded',    marks: '18 / 20' },
      { id: 3, title: 'Assignment 3 — Hypothesis Testing',     due: '02 Nov 2024', status: 'Submitted', marks: null },
    ],
    sessions: [
      { id:  1, date: '06 Sep 2024', topic: 'Introduction to Statistics',    status: 'Present' },
      { id:  2, date: '13 Sep 2024', topic: 'Data Types & Collection',        status: 'Present' },
      { id:  3, date: '20 Sep 2024', topic: 'Central Tendency',               status: 'Present' },
      { id:  4, date: '27 Sep 2024', topic: 'Measures of Dispersion',         status: 'Present' },
      { id:  5, date: '04 Oct 2024', topic: 'Data Visualisation',             status: 'Present' },
      { id:  6, date: '11 Oct 2024', topic: 'Probability Basics',             status: 'Present' },
      { id:  7, date: '18 Oct 2024', topic: 'Conditional Probability',        status: 'Present' },
      { id:  8, date: '25 Oct 2024', topic: "Bayes' Theorem",                 status: 'Present' },
      { id:  9, date: '01 Nov 2024', topic: 'Binomial Distribution',          status: 'Present' },
      { id: 10, date: '08 Nov 2024', topic: 'Normal Distribution',            status: 'Present' },
      { id: 11, date: '15 Nov 2024', topic: 'Sampling Methods',               status: 'Present' },
      { id: 12, date: '22 Nov 2024', topic: 'Confidence Intervals',           status: 'Present' },
      { id: 13, date: '29 Nov 2024', topic: 'Hypothesis Testing Intro',       status: 'Present' },
      { id: 14, date: '06 Dec 2024', topic: 'T-tests & Chi-square',           status: 'Present' },
    ],
  },
]
