// ─────────────────────────────────────────────────────────────────────────────
// Librarian shared types and mock data
// ─────────────────────────────────────────────────────────────────────────────

export type ResourceType   = 'E-Book' | 'Journal' | 'Research Paper' | 'Course Pack' | 'Physical Book'
export type ResourceStatus = 'Active' | 'Restricted' | 'Archived' | 'On Loan'
export type CollectionId   = 'ebooks' | 'journals' | 'research' | 'coursepacks' | 'physical' | 'support'
export type RequestStatus  = 'Pending' | 'Fulfilled' | 'Declined'
export type RequestType    = 'New Resource' | 'Existing Resource'
export type LibrarianNotifType = 'request' | 'overdue' | 'upload' | 'system' | 'restriction'

export interface CatalogueResource {
  id:             number
  type:           ResourceType
  title:          string
  author:         string
  publisher:      string
  department:     string
  year:           number
  isbn?:          string
  subjects:       string[]
  description:    string
  accessCount:    number
  status:         ResourceStatus
  dateAdded:      string
  collection:     CollectionId
  stockCount?:    number
  availableCount?: number
  shelfLocation?: string
  dewey?:         string
}

export interface LibraryCollection {
  id:            CollectionId
  name:          string
  description:   string
  iconColor:     string
  resourceCount: number
  lastUpdated:   string
  accessLevel:   'All Students' | 'Restricted'
}

export interface ResourceRequest {
  id:            number
  requestId:     string
  requester:     string
  studentId?:    string
  role:          'Student' | 'Lecturer'
  resourceTitle: string
  description:   string
  requestType:   RequestType
  dateSubmitted: string
  status:        RequestStatus
  resolution?:   string
}

export interface LibrarianNotif {
  id:           number
  type:         LibrarianNotifType
  title:        string
  body:         string
  detailedBody: string
  timestamp:    string
  read:         boolean
  action?:      string
}

// ─────────────────────────────────────────────────────────────────────────────

export const LIBRARIAN = {
  fullName:   'Diane Mukamana',
  firstName:  'Diane',
  initials:   'DM',
  email:      'diane.mukamana@sfu.ac.rw',
  phone:      '+250 788 456 123',
  employeeId: 'STF-LIB-014',
  office:     'Library Services',
  joinedDate: '3 Feb 2023',
}

// ─────────────────────────────────────────────────────────────────────────────
// 15 catalogue resources (matching student E-Library data)
// ─────────────────────────────────────────────────────────────────────────────

export const CATALOGUE_RESOURCES: CatalogueResource[] = [
  {
    id: 1, type: 'E-Book', collection: 'ebooks', status: 'Active',
    title: 'Introduction to Algorithms (4th ed.)',
    author: 'Cormen, Leiserson, Rivest & Stein',
    publisher: 'MIT Press', department: 'Computer Science', year: 2022,
    isbn: '978-0-262-04630-5', subjects: ['Computer Science', 'Algorithms'],
    description: 'The definitive algorithms textbook covering a broad range of algorithms with rigorous analysis.',
    accessCount: 127, dateAdded: '10 Aug 2025',
  },
  {
    id: 2, type: 'E-Book', collection: 'ebooks', status: 'Active',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Russell & Norvig',
    publisher: 'Pearson', department: 'Computer Science', year: 2020,
    isbn: '978-0-134-61099-3', subjects: ['AI', 'Machine Learning'],
    description: 'The definitive AI textbook covering search, knowledge representation, planning, and ML.',
    accessCount: 89, dateAdded: '9 Aug 2025',
  },
  {
    id: 3, type: 'E-Book', collection: 'ebooks', status: 'Active',
    title: 'Database System Concepts',
    author: 'Silberschatz, Korth & Sudarshan',
    publisher: 'McGraw-Hill', department: 'Computer Science', year: 2019,
    isbn: '978-0-078-02215-9', subjects: ['Databases', 'Computer Science'],
    description: 'Standard database textbook covering relational models, SQL, and modern NoSQL approaches.',
    accessCount: 64, dateAdded: '8 Aug 2025',
  },
  {
    id: 4, type: 'E-Book', collection: 'ebooks', status: 'Active',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall', department: 'Software Engineering', year: 2008,
    isbn: '978-0-132-35088-4', subjects: ['Software Engineering', 'Best Practices'],
    description: 'A landmark guide to writing maintainable, readable software with real-world refactoring examples.',
    accessCount: 43, dateAdded: '7 Aug 2025',
  },
  {
    id: 5, type: 'E-Book', collection: 'ebooks', status: 'Restricted',
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Arpaci-Dusseau & Arpaci-Dusseau',
    publisher: 'Arpaci-Dusseau Books', department: 'Computer Science', year: 2023,
    subjects: ['Operating Systems', 'Computer Science'],
    description: 'Respected OS textbook through three lenses: virtualisation, concurrency, and persistence.',
    accessCount: 38, dateAdded: '6 Aug 2025',
  },
  {
    id: 6, type: 'Journal', collection: 'journals', status: 'Active',
    title: 'IEEE Transactions on Software Engineering',
    author: 'IEEE', publisher: 'IEEE',
    department: 'Software Engineering', year: 2024,
    subjects: ['Software Engineering', 'Research'],
    description: 'Premier journal publishing peer-reviewed articles on software design, testing, and maintenance.',
    accessCount: 56, dateAdded: '5 Aug 2025',
  },
  {
    id: 7, type: 'Journal', collection: 'journals', status: 'Active',
    title: 'ACM Computing Surveys',
    author: 'ACM', publisher: 'ACM',
    department: 'Computer Science', year: 2024,
    subjects: ['Computer Science', 'Surveys'],
    description: 'Prestigious ACM journal publishing comprehensive surveys covering all areas of computing.',
    accessCount: 34, dateAdded: '4 Aug 2025',
  },
  {
    id: 8, type: 'Journal', collection: 'journals', status: 'Active',
    title: 'Journal of Artificial Intelligence Research',
    author: 'JAIR', publisher: 'JAIR',
    department: 'Computer Science', year: 2024,
    subjects: ['AI', 'Machine Learning'],
    description: 'Open-access journal covering all areas of AI research including ML, reasoning, and NLP.',
    accessCount: 41, dateAdded: '3 Aug 2025',
  },
  {
    id: 9, type: 'Research Paper', collection: 'research', status: 'Active',
    title: 'Deep Learning in Healthcare Applications',
    author: 'Zhang et al.', publisher: '',
    department: 'Computer Science', year: 2023,
    subjects: ['AI', 'Healthcare'],
    description: 'Survey of deep learning techniques in clinical settings, covering diagnostic imaging and drug discovery.',
    accessCount: 22, dateAdded: '2 Aug 2025',
  },
  {
    id: 10, type: 'Research Paper', collection: 'research', status: 'Active',
    title: 'Machine Learning for Academic Performance Prediction',
    author: 'Uwimana et al.', publisher: '',
    department: 'Computer Science', year: 2024,
    subjects: ['Computer Science', 'EdTech'],
    description: 'Applying ML classifiers to predict student outcomes from early-semester data at Rwandan universities.',
    accessCount: 19, dateAdded: '1 Aug 2025',
  },
  {
    id: 11, type: 'Research Paper', collection: 'research', status: 'Active',
    title: 'AI-Driven Adaptive Learning Systems',
    author: 'Osei & Kamara', publisher: '',
    department: 'Computer Science', year: 2024,
    subjects: ['AI', 'EdTech'],
    description: 'Adaptive learning platform using reinforcement learning, showing 23% improvement in completion rates.',
    accessCount: 17, dateAdded: '31 Jul 2025',
  },
  {
    id: 12, type: 'Course Pack', collection: 'coursepacks', status: 'Active',
    title: 'CSC 101 Lecture Notes & Exercises',
    author: 'Dr. Emmanuel Nkurunziza', publisher: '',
    department: 'Computer Science', year: 2024,
    subjects: ['Computer Science'],
    description: 'Comprehensive lecture notes and exercise sets for CSC 101 covering all 12 modules.',
    accessCount: 78, dateAdded: '30 Jul 2025',
  },
  {
    id: 13, type: 'Course Pack', collection: 'coursepacks', status: 'Active',
    title: 'CSC 102 Programming Assignments & Solutions',
    author: 'Prof. Aline Uwimana', publisher: '',
    department: 'Computer Science', year: 2024,
    subjects: ['Computer Science', 'Programming'],
    description: 'Complete set of programming assignments and worked solutions for CSC 102.',
    accessCount: 65, dateAdded: '29 Jul 2025',
  },
  {
    id: 14, type: 'Physical Book', collection: 'physical', status: 'Active',
    title: 'Introduction to Algorithms',
    author: 'Cormen, Leiserson, Rivest & Stein',
    publisher: 'MIT Press', department: 'Computer Science', year: 2022,
    isbn: '978-0-262-04630-5', subjects: ['Computer Science', 'Algorithms'],
    description: 'The definitive algorithms textbook. Physical copy available in the library.',
    accessCount: 24, dateAdded: '28 Jul 2025',
    stockCount: 3, availableCount: 2, shelfLocation: 'Shelf B4 · Floor 2', dewey: '005.1 COR',
  },
  {
    id: 15, type: 'Physical Book', collection: 'physical', status: 'On Loan',
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    publisher: 'Cengage Learning', department: 'Mathematics', year: 2020,
    isbn: '978-1-337-61392-7', subjects: ['Mathematics', 'Calculus'],
    description: "World's most widely used calculus textbook with rigorous precision and accessible explanations.",
    accessCount: 15, dateAdded: '27 Jul 2025',
    stockCount: 2, availableCount: 0, shelfLocation: 'Shelf A2 · Floor 1', dewey: '515 STE',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

export const LIBRARY_COLLECTIONS: LibraryCollection[] = [
  { id: 'ebooks',     name: 'E-Books',          description: 'Academic e-books across all disciplines, available to all enrolled students.',    iconColor: '#0D9488', resourceCount: 12, lastUpdated: '10 Aug 2025', accessLevel: 'All Students' },
  { id: 'journals',   name: 'Journals',          description: 'Peer-reviewed academic journals and periodicals for research and study.',          iconColor: '#7C3AED', resourceCount: 8,  lastUpdated: '9 Aug 2025',  accessLevel: 'All Students' },
  { id: 'research',   name: 'Research Papers',   description: 'Student and faculty research papers, theses, and dissertations.',                  iconColor: '#D97706', resourceCount: 24, lastUpdated: '8 Aug 2025',  accessLevel: 'All Students' },
  { id: 'coursepacks',name: 'Course Packs',      description: 'Curated materials and lecture notes uploaded by lecturers for their courses.',     iconColor: '#2563EB', resourceCount: 10, lastUpdated: '7 Aug 2025',  accessLevel: 'All Students' },
  { id: 'physical',   name: 'Physical Books',    description: 'Physical book catalogue — check availability before visiting the library.',        iconColor: '#16A34A', resourceCount: 200, lastUpdated: '6 Aug 2025', accessLevel: 'All Students' },
  { id: 'support',    name: 'Research Support',  description: 'Citation guides, referencing tools, and research methodology resources.',          iconColor: '#DC2626', resourceCount: 8,  lastUpdated: '5 Aug 2025',  accessLevel: 'Restricted'   },
]

// ─────────────────────────────────────────────────────────────────────────────

export const RESOURCE_REQUESTS: ResourceRequest[] = [
  { id: 1,  requestId: 'REQ-2025-0041', requester: 'Jean-Paul Mugisha',    studentId: 'SFE-2024-0042', role: 'Student',  resourceTitle: 'Advanced Machine Learning Techniques',      description: 'Need this for my final year research project on AI in education systems.', requestType: 'New Resource',      dateSubmitted: '12 Aug 2025', status: 'Pending'   },
  { id: 2,  requestId: 'REQ-2025-0040', requester: 'Dr. Emmanuel Nkurunziza',                           role: 'Lecturer', resourceTitle: 'Journal of Software Engineering — 2025',    description: 'Required for the CSC 401 course reading list — latest edition needed.',    requestType: 'New Resource',      dateSubmitted: '11 Aug 2025', status: 'Pending'   },
  { id: 3,  requestId: 'REQ-2025-0039', requester: 'Amina Uwase',          studentId: 'SFE-2024-0018', role: 'Student',  resourceTitle: 'African Literature: Post-Colonial Perspectives', description: 'This book is part of our ENG 301 reading list but not available.', requestType: 'New Resource',      dateSubmitted: '10 Aug 2025', status: 'Pending'   },
  { id: 4,  requestId: 'REQ-2025-0038', requester: 'Dr. Patrick Habimana',                             role: 'Lecturer', resourceTitle: 'Advanced Calculus and Real Analysis (4th ed.)',description: 'Supplementary textbook for MTH 301 — Real Analysis.',                      requestType: 'New Resource',      dateSubmitted: '9 Aug 2025',  status: 'Pending'   },
  { id: 5,  requestId: 'REQ-2025-0037', requester: 'Claudine Ingabire',    studentId: 'SFE-2024-0031', role: 'Student',  resourceTitle: 'Introduction to Algorithms (4th ed.)',       description: 'The e-book access is restricted, requesting unrestricted access.',          requestType: 'Existing Resource', dateSubmitted: '8 Aug 2025',  status: 'Fulfilled', resolution: 'Access restriction updated for all Year 2+ CS students.' },
  { id: 6,  requestId: 'REQ-2025-0036', requester: 'Prof. Aline Uwimana',                              role: 'Lecturer', resourceTitle: 'Python for Data Analysis (3rd ed.)',          description: 'Required for the new CSC 402 Data Science module starting next semester.', requestType: 'New Resource',      dateSubmitted: '7 Aug 2025',  status: 'Fulfilled', resolution: 'Ordered — expected arrival 20 Aug 2025.' },
  { id: 7,  requestId: 'REQ-2025-0035', requester: 'Eric Nzeyimana',       studentId: 'SFE-2024-0059', role: 'Student',  resourceTitle: 'Signals and Systems (2nd ed.)',              description: 'The physical copy on Shelf D1 is always borrowed. Need digital access.',    requestType: 'Existing Resource', dateSubmitted: '6 Aug 2025',  status: 'Fulfilled', resolution: 'Digital e-book version added to catalogue.' },
  { id: 8,  requestId: 'REQ-2025-0034', requester: 'Dr. James Uwera',                                  role: 'Lecturer', resourceTitle: 'Digital Logic Design: A Systems Approach',   description: 'Comprehensive digital logic textbook for CSC 103 next semester.',          requestType: 'New Resource',      dateSubmitted: '5 Aug 2025',  status: 'Declined',  resolution: 'Budget constraints — deferred to next academic year.' },
  { id: 9,  requestId: 'REQ-2025-0033', requester: 'Solange Mutesi',       studentId: 'SFE-2024-0073', role: 'Student',  resourceTitle: 'The Elements of Statistical Learning',       description: 'Essential for my machine learning research. Not in the catalogue.',         requestType: 'New Resource',      dateSubmitted: '4 Aug 2025',  status: 'Declined',  resolution: 'Resource is available at no cost online — link shared with student.' },
  { id: 10, requestId: 'REQ-2025-0032', requester: 'Jean-Claude Habimana', studentId: 'SFE-2024-0012', role: 'Student',  resourceTitle: 'Computer Networks: A Top-Down Approach',    description: 'My copy of this book is outdated — requesting the 8th edition.',           requestType: 'Existing Resource', dateSubmitted: '3 Aug 2025',  status: 'Fulfilled', resolution: 'Added 8th edition (2021) digital copy to E-Books collection.' },
  { id: 11, requestId: 'REQ-2025-0031', requester: 'Prof. Sarah Ingabire',                             role: 'Lecturer', resourceTitle: 'University Physics (15th ed.) — Lab Supplement', description: 'Supplementary material for PHY 101 lab sessions.',                    requestType: 'New Resource',      dateSubmitted: '2 Aug 2025',  status: 'Pending'   },
  { id: 12, requestId: 'REQ-2025-0030', requester: 'Diane Nduwimana',      studentId: 'SFE-2024-0089', role: 'Student',  resourceTitle: 'Kinyarwanda Language Processing — NLP Guide', description: 'Needed for my final year project in natural language processing.',      requestType: 'New Resource',      dateSubmitted: '1 Aug 2025',  status: 'Pending'   },
]

// ─────────────────────────────────────────────────────────────────────────────

export const LIBRARIAN_NOTIFS: LibrarianNotif[] = [
  {
    id: 1, type: 'request', read: false, timestamp: '2 hours ago',
    title: 'New resource request from Jean-Paul Mugisha',
    body: 'Jean-Paul Mugisha (Student) has requested "Advanced Machine Learning Techniques" for a final year research project.',
    detailedBody: 'Student Jean-Paul Mugisha (SFE-2024-0042) submitted a new resource request on 12 Aug 2025. The requested resource is "Advanced Machine Learning Techniques" — needed for a final year research project on AI in education systems. Please review and fulfil or decline the request in the Resource Requests section.',
    action: 'View request',
  },
  {
    id: 2, type: 'overdue', read: false, timestamp: '6 hours ago',
    title: 'Overdue book: "Calculus: Early Transcendentals"',
    body: 'Calculus: Early Transcendentals borrowed by Eric Nzeyimana (SFE-2024-0059) was due on 10 Aug 2025 and has not been returned.',
    detailedBody: 'The physical copy of "Calculus: Early Transcendentals" (ISBN 978-1-337-61392-7, Shelf A2 · Floor 1) borrowed by Eric Nzeyimana (SFE-2024-0059) was due on 10 Aug 2025. It is now 2 days overdue. Please send a reminder to the borrower. A second copy remains available for other students.',
    action: 'Send reminder',
  },
  {
    id: 3, type: 'upload', read: false, timestamp: 'Yesterday',
    title: 'New course pack uploaded by Dr. Emmanuel Nkurunziza',
    body: 'Dr. Nkurunziza uploaded "CSC 401 Advanced Algorithms — Week 8 Notes" and it awaits cataloguing in the Library.',
    detailedBody: 'Dr. Emmanuel Nkurunziza (Lecturer, CSC 401) uploaded a new course pack titled "CSC 401 Advanced Algorithms — Week 8 Notes" on 11 Aug 2025. The file is pending cataloguing. Please add it to the Course Packs collection, assign appropriate department tags and access restrictions, then publish it for students.',
    action: 'Catalogue resource',
  },
  {
    id: 4, type: 'system', read: true, timestamp: '2 days ago',
    title: 'Scheduled maintenance — 15 Aug 2025, 02:00–04:00',
    body: 'The StackEDU platform will undergo scheduled maintenance on 15 Aug 2025 from 02:00 to 04:00 EAT. The E-Library will be read-only during this window.',
    detailedBody: 'StackForgeAI will perform scheduled maintenance on the StackEDU platform on Friday 15 Aug 2025 from 02:00 to 04:00 EAT. During this window, the E-Library will be accessible in read-only mode — students can browse and download existing resources, but uploading, cataloguing, and editing resources will be unavailable. No action is required on your part.',
  },
  {
    id: 5, type: 'restriction', read: true, timestamp: '3 days ago',
    title: 'Resource access restriction updated by ICT',
    body: 'The ICT department updated access restrictions for "Operating Systems: Three Easy Pieces" — now restricted to Year 2+ Computer Science students.',
    detailedBody: 'The ICT department updated the access restriction settings for "Operating Systems: Three Easy Pieces" on 9 Aug 2025. The resource is now restricted to Year 2 and above Computer Science students, following a review of the curriculum requirements for CSC 301. If this change requires adjustment, please contact the ICT administrator through the system settings.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Physical book loans (for analytics page)
// ─────────────────────────────────────────────────────────────────────────────

export interface BookLoan {
  id:         number
  title:      string
  borrower:   string
  studentId:  string
  loanDate:   string
  dueDate:    string
  overdue:    boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics mock data
// ─────────────────────────────────────────────────────────────────────────────

export interface UsageTrendPoint { day: string; views: number }

export const USAGE_TREND: UsageTrendPoint[] = [
  { day: '14 Jul', views: 48 }, { day: '15 Jul', views: 52 }, { day: '16 Jul', views: 61 },
  { day: '17 Jul', views: 57 }, { day: '18 Jul', views: 44 }, { day: '19 Jul', views: 29 },
  { day: '20 Jul', views: 25 }, { day: '21 Jul', views: 63 }, { day: '22 Jul', views: 68 },
  { day: '23 Jul', views: 71 }, { day: '24 Jul', views: 65 }, { day: '25 Jul', views: 49 },
  { day: '26 Jul', views: 31 }, { day: '27 Jul', views: 28 }, { day: '28 Jul', views: 74 },
  { day: '29 Jul', views: 79 }, { day: '30 Jul', views: 82 }, { day: '31 Jul', views: 76 },
  { day: '1 Aug',  views: 58 }, { day: '2 Aug',  views: 36 }, { day: '3 Aug',  views: 33 },
  { day: '4 Aug',  views: 85 }, { day: '5 Aug',  views: 91 }, { day: '6 Aug',  views: 88 },
  { day: '7 Aug',  views: 80 }, { day: '8 Aug',  views: 62 }, { day: '9 Aug',  views: 39 },
  { day: '10 Aug', views: 41 }, { day: '11 Aug', views: 94 }, { day: '12 Aug', views: 102 },
]

export interface CategoryUsage { type: ResourceType; views: number }

export const USAGE_BY_CATEGORY: CategoryUsage[] = [
  { type: 'E-Book',         views: 642 },
  { type: 'Course Pack',    views: 412 },
  { type: 'Journal',        views: 389 },
  { type: 'Research Paper', views: 271 },
  { type: 'Physical Book',  views: 133 },
]

export interface DepartmentUsage { department: string; views: number }

export const USAGE_BY_DEPARTMENT: DepartmentUsage[] = [
  { department: 'Computer Science',      views: 892 },
  { department: 'Software Engineering',  views: 341 },
  { department: 'Mathematics',           views: 264 },
  { department: 'Physics',               views: 178 },
  { department: 'EdTech',                views: 96  },
  { department: 'Engineering',           views: 76  },
]

export interface SearchKeyword { term: string; count: number }

export const SEARCH_KEYWORDS: SearchKeyword[] = [
  { term: 'algorithms',       count: 156 },
  { term: 'machine learning', count: 134 },
  { term: 'database',         count: 98  },
  { term: 'calculus',         count: 87  },
  { term: 'data structures',  count: 79  },
  { term: 'python',           count: 68  },
  { term: 'networking',       count: 54  },
  { term: 'statistics',       count: 47  },
  { term: 'research methods', count: 39  },
  { term: 'operating systems',count: 32  },
]

// ─────────────────────────────────────────────────────────────────────────────

export const BOOK_LOANS: BookLoan[] = [
  { id: 1, title: 'Introduction to Algorithms',             borrower: 'Jean-Paul Mugisha',    studentId: 'SFE-2024-0042', loanDate: '1 Aug 2025',  dueDate: '15 Aug 2025', overdue: false },
  { id: 2, title: 'Calculus: Early Transcendentals',        borrower: 'Eric Nzeyimana',       studentId: 'SFE-2024-0059', loanDate: '25 Jul 2025', dueDate: '10 Aug 2025', overdue: true  },
  { id: 3, title: 'University Physics',                     borrower: 'Claudine Ingabire',    studentId: 'SFE-2024-0031', loanDate: '3 Aug 2025',  dueDate: '17 Aug 2025', overdue: false },
  { id: 4, title: 'Data Structures and Algorithms',         borrower: 'Solange Mutesi',       studentId: 'SFE-2024-0073', loanDate: '28 Jul 2025', dueDate: '11 Aug 2025', overdue: true  },
  { id: 5, title: 'African Literature Anthology',           borrower: 'Amina Uwase',          studentId: 'SFE-2024-0018', loanDate: '30 Jul 2025', dueDate: '13 Aug 2025', overdue: true  },
  { id: 6, title: 'Linear Algebra',                        borrower: 'Jean-Claude Habimana', studentId: 'SFE-2024-0012', loanDate: '5 Aug 2025',  dueDate: '19 Aug 2025', overdue: false },
  { id: 7, title: 'Engineering Mathematics',               borrower: 'Diane Nduwimana',      studentId: 'SFE-2024-0089', loanDate: '4 Aug 2025',  dueDate: '18 Aug 2025', overdue: false },
  { id: 8, title: 'Probability and Statistics',            borrower: 'Peter Nkurunziza',     studentId: 'SFE-2024-0055', loanDate: '2 Aug 2025',  dueDate: '16 Aug 2025', overdue: false },
  { id: 9, title: 'Computer Architecture',                 borrower: 'Grace Mutesi',         studentId: 'SFE-2024-0067', loanDate: '6 Aug 2025',  dueDate: '20 Aug 2025', overdue: false },
  { id: 10, title: 'Research Methods for Students',        borrower: 'Robert Habimana',      studentId: 'SFE-2024-0044', loanDate: '1 Aug 2025',  dueDate: '15 Aug 2025', overdue: false },
  { id: 11, title: 'Introduction to Robotics',             borrower: 'Alice Uwimana',        studentId: 'SFE-2024-0033', loanDate: '7 Aug 2025',  dueDate: '21 Aug 2025', overdue: false },
  { id: 12, title: 'Signals and Systems',                  borrower: 'Bernard Nzeyimana',    studentId: 'SFE-2024-0021', loanDate: '29 Jul 2025', dueDate: '12 Aug 2025', overdue: true  },
  { id: 13, title: 'Discrete Mathematics and Its Applications', borrower: 'Charlotte Ingabire', studentId: 'SFE-2024-0078', loanDate: '3 Aug 2025', dueDate: '17 Aug 2025', overdue: false },
  { id: 14, title: 'Introduction to Algorithms',           borrower: 'Daniel Mukamana',      studentId: 'SFE-2024-0092', loanDate: '8 Aug 2025',  dueDate: '22 Aug 2025', overdue: false },
]
