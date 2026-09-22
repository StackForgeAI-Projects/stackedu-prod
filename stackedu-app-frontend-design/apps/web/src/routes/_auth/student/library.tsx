import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, BarChart2, CreditCard, Library, Bell,
  BookMarked, FileText, GraduationCap, Microscope, ArrowLeft,
  Search, Download, ChevronLeft, ChevronRight, CheckCircle2, Clock, X,
  Phone, MessageSquare, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/student/library')({
  component: ELibraryPage,
})

// ── Nav ───────────────────────────────────────────────────────────────────────

const STUDENT_NAV = [
  { label: 'Dashboard',     to: '/student/dashboard',     icon: LayoutDashboard },
  { label: 'My Courses',    to: '/student/courses',       icon: BookOpen        },
  { label: 'Results',       to: '/student/results',       icon: BarChart2       },
  { label: 'Fees',          to: '/student/fees',          icon: CreditCard      },
  { label: 'E-Library',     to: '/student/library',       icon: Library         },
  { label: 'Notifications', to: '/student/notifications', icon: Bell            },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type CollectionId = 'ebooks' | 'journals' | 'research' | 'coursepacks' | 'physical' | 'support'
type DigitalResourceType = 'E-Book' | 'Journal' | 'Research Paper' | 'Course Pack' | 'Guide'

interface DigitalResource {
  id: number
  collection: Exclude<CollectionId, 'physical'>
  type: DigitalResourceType
  title: string
  author: string
  publisher: string
  subject: string
  year: number
  isNew: boolean
  description: string
  lecturer?: string
  course?: string
}

interface PhysicalBook {
  id: number
  collection: 'physical'
  type: 'Physical Book'
  title: string
  author: string
  isbn: string
  year: number
  publisher: string
  subject: string
  subjectColor: string
  available: boolean
  expectedReturn?: string
  location: string
  isNew: boolean
}

type AnyResource = DigitalResource | PhysicalBook

function isPhysicalBook(r: AnyResource): r is PhysicalBook {
  return r.collection === 'physical'
}

// ── Collection definitions ────────────────────────────────────────────────────

interface CollectionDef {
  id: CollectionId
  name: string
  description: string
  count: string
  Icon: LucideIcon
  badge?: { label: string; bg: string; color: string }
}

const COLLECTIONS: CollectionDef[] = [
  {
    id: 'ebooks',
    name: 'E-Books',
    description: 'Access academic e-books across all disciplines available to all enrolled students.',
    count: '12 resources',
    Icon: BookOpen,
    badge: { label: 'Most Used', bg: 'var(--warning-bg)', color: 'var(--warning)' },
  },
  {
    id: 'journals',
    name: 'Journals',
    description: 'Peer-reviewed academic journals and periodicals for research and study.',
    count: '8 resources',
    Icon: FileText,
    badge: { label: 'Open Access', bg: 'var(--success-bg)', color: 'var(--success)' },
  },
  {
    id: 'research',
    name: 'Research Papers',
    description: 'Student and faculty research papers, theses, and dissertations.',
    count: '24 resources',
    Icon: GraduationCap,
    badge: { label: 'New', bg: 'var(--brand)', color: 'var(--brand-ink)' },
  },
  {
    id: 'coursepacks',
    name: 'Course Packs',
    description: 'Curated materials and lecture notes uploaded by your lecturers.',
    count: '6 resources',
    Icon: BookMarked,
  },
  {
    id: 'physical',
    name: 'Physical Books',
    description: 'Browse the physical book catalogue. Check availability before visiting the library.',
    count: '200+ items',
    Icon: Library,
  },
  {
    id: 'support',
    name: 'Research Support',
    description: 'Citation guides, referencing tools, and research methodology resources.',
    count: '8 guides',
    Icon: Microscope,
  },
]

// ── Type badge styles ─────────────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'E-Book':         { bg: 'var(--info-bg)',          color: 'var(--info)'             },
  'Journal':        { bg: 'var(--success-bg)',        color: 'var(--success)'          },
  'Research Paper': { bg: 'var(--warning-bg)',        color: 'var(--warning)'          },
  'Course Pack':    { bg: 'rgba(32,244,78,0.12)',     color: 'var(--brand)'            },
  'Guide':          { bg: 'var(--muted)',             color: 'var(--muted-foreground)' },
  'Physical Book':  { bg: 'var(--muted)',             color: 'var(--muted-foreground)' },
}

// ── Digital resources ─────────────────────────────────────────────────────────

const DIGITAL_RESOURCES: DigitalResource[] = [
  // E-Books
  {
    id: 1, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Introduction to Algorithms (4th ed.)',
    author: 'Cormen, Leiserson, Rivest & Stein',
    publisher: 'MIT Press', subject: 'Computer Science', year: 2022,
    description: 'The definitive algorithms textbook, covering a broad range of algorithms in depth with rigorous analysis. This edition adds new chapters on machine learning and approximation algorithms, making it essential for every CS student.',
  },
  {
    id: 2, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Computer Science: An Overview',
    author: 'J. Glenn Brookshear',
    publisher: 'Pearson', subject: 'Computer Science', year: 2020,
    description: 'An accessible introduction to the entire field of computer science for students with little prior background. Covers algorithms, programming languages, operating systems, networking, and artificial intelligence in an approachable style.',
  },
  {
    id: 3, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Calculus: Early Transcendentals (9th ed.)',
    author: 'James Stewart',
    publisher: 'Cengage Learning', subject: 'Mathematics', year: 2020,
    description: "The world's most widely used calculus textbook, renowned for mathematical precision and accessible explanations. This edition includes new diagnostic tests and review sections to help students build a strong foundation.",
  },
  {
    id: 4, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'University Physics (15th ed.)',
    author: 'Young & Freedman',
    publisher: 'Pearson', subject: 'Physics', year: 2019,
    description: 'A comprehensive physics textbook for science and engineering students, emphasising the connection between basic principles and real-world applications. Widely used in first-year physics programmes at universities worldwide.',
  },
  // E-Books (continued)
  {
    id: 5, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Discrete Mathematics and Its Applications',
    author: 'Kenneth H. Rosen',
    publisher: 'McGraw-Hill', subject: 'Mathematics', year: 2019,
    description: 'A thorough introduction to discrete mathematics with a strong emphasis on applications. Covers logic, set theory, algorithms, number theory, graph theory, and combinatorics — all essential foundations for computer science students.',
  },
  {
    id: 6, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Arpaci-Dusseau & Arpaci-Dusseau',
    publisher: 'Arpaci-Dusseau Books', subject: 'Computer Science', year: 2023,
    description: 'A widely respected operating systems textbook that presents the subject through three conceptual lenses: virtualisation, concurrency, and persistence. Known for its clarity and practical focus, it is freely available online.',
  },
  {
    id: 7, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Computer Networks: A Top-Down Approach',
    author: 'Kurose & Ross',
    publisher: 'Pearson', subject: 'Networking', year: 2021,
    description: 'The leading networking textbook, structured from the application layer down to the physical layer. Balances theory with real-world protocols and includes extensive programming assignments and Wireshark labs.',
  },
  {
    id: 8, collection: 'ebooks', type: 'E-Book', isNew: true,
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Russell & Norvig',
    publisher: 'Pearson', subject: 'AI', year: 2020,
    description: 'The definitive AI textbook, covering search, knowledge representation, planning, machine learning, natural language processing, and robotics. Now in its fourth edition with expanded coverage of deep learning and probabilistic methods.',
  },
  {
    id: 9, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Database System Concepts',
    author: 'Silberschatz, Korth & Sudarshan',
    publisher: 'McGraw-Hill', subject: 'Computer Science', year: 2019,
    description: 'The standard database systems textbook, covering relational models, SQL, normalisation, transaction management, and modern NoSQL approaches. Widely adopted in undergraduate and graduate database courses worldwide.',
  },
  {
    id: 10, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall', subject: 'Software Engineering', year: 2008,
    description: 'A landmark guide to writing maintainable, readable software. Martin presents principles, patterns, and practices for producing clean code, illustrated with real-world refactoring examples drawn from Java and other languages.',
  },
  {
    id: 11, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'The Pragmatic Programmer',
    author: 'Hunt & Thomas',
    publisher: 'Addison-Wesley', subject: 'Software Engineering', year: 2019,
    description: 'A classic software engineering guide covering career development, coding practices, project management, and professional habits. The 20th anniversary edition is fully updated with new content on modern tools and methodologies.',
  },
  {
    id: 12, collection: 'ebooks', type: 'E-Book', isNew: false,
    title: 'Introduction to Machine Learning',
    author: 'Ethem Alpaydin',
    publisher: 'MIT Press', subject: 'AI', year: 2020,
    description: 'A comprehensive introduction to machine learning methods and their mathematical foundations. Covers supervised, unsupervised, and reinforcement learning, with chapters on neural networks, SVMs, and probabilistic models.',
  },
  // Journals
  {
    id: 13, collection: 'journals', type: 'Journal', isNew: false,
    title: 'IEEE Transactions on Software Engineering',
    author: 'IEEE', publisher: 'IEEE',
    subject: 'Software Engineering', year: 2023,
    description: 'The premier journal for software engineering research, publishing peer-reviewed articles on software design, testing, maintenance, and AI-assisted development. An essential resource for software engineering students and researchers.',
  },
  {
    id: 14, collection: 'journals', type: 'Journal', isNew: true,
    title: 'ACM Computing Surveys',
    author: 'ACM', publisher: 'ACM',
    subject: 'Computer Science', year: 2024,
    description: 'A prestigious ACM journal publishing comprehensive surveys and tutorials covering all areas of computing. Each article provides an expert overview of a research sub-field, making it invaluable for both students and researchers.',
  },
  {
    id: 15, collection: 'journals', type: 'Journal', isNew: false,
    title: 'International Journal of Engineering Education',
    author: 'IJEE', publisher: 'IJEE',
    subject: 'Engineering', year: 2023,
    description: 'A peer-reviewed journal focused on research and innovation in engineering education, covering curriculum development, teaching methodologies, and the integration of technology in engineering degree programmes worldwide.',
  },
  {
    id: 16, collection: 'journals', type: 'Journal', isNew: true,
    title: 'African Journal of Science and Technology',
    author: 'AJST', publisher: 'AJST',
    subject: 'Science', year: 2024,
    description: 'An open-access journal dedicated to scientific research across Africa, covering engineering, natural sciences, and applied technology. Particularly relevant for researchers working on African-context problems and locally-driven solutions.',
  },
  {
    id: 17, collection: 'journals', type: 'Journal', isNew: true,
    title: 'Journal of Computer Science and Technology',
    author: 'JCST', publisher: 'JCST',
    subject: 'Computer Science', year: 2024,
    description: 'An international journal covering a broad range of topics in computer science and technology, from algorithms and software systems to hardware design and human-computer interaction. Indexed by major academic databases.',
  },
  {
    id: 18, collection: 'journals', type: 'Journal', isNew: false,
    title: 'African Journal of Mathematics',
    author: 'AJM', publisher: 'AJM',
    subject: 'Mathematics', year: 2023,
    description: 'A peer-reviewed journal dedicated to publishing high-quality mathematical research from African scholars and institutions. Covers pure and applied mathematics with a focus on problems relevant to African academic contexts.',
  },
  {
    id: 19, collection: 'journals', type: 'Journal', isNew: true,
    title: 'Rwanda Journal of Engineering and Technology',
    author: 'RJET', publisher: 'RJET',
    subject: 'Engineering', year: 2024,
    description: 'Rwanda\'s premier engineering and technology journal, publishing research on infrastructure, renewable energy, ICT, and sustainable development. Represents local academic output from Rwandan universities and research institutions.',
  },
  {
    id: 20, collection: 'journals', type: 'Journal', isNew: true,
    title: 'Journal of Artificial Intelligence Research',
    author: 'JAIR', publisher: 'JAIR',
    subject: 'AI', year: 2024,
    description: 'An open-access journal covering all areas of artificial intelligence research. JAIR publishes peer-reviewed papers on machine learning, reasoning, planning, natural language processing, and robotics, freely accessible to all readers.',
  },
  {
    id: 21, collection: 'journals', type: 'Journal', isNew: false,
    title: 'International Journal of Computer Applications',
    author: 'IJCA', publisher: 'IJCA',
    subject: 'Computer Science', year: 2023,
    description: 'A broad-scope computer science journal publishing research on software engineering, data science, network security, and emerging computing paradigms. Particularly accessible for students publishing their first academic papers.',
  },
  {
    id: 22, collection: 'journals', type: 'Journal', isNew: true,
    title: 'Journal of Educational Technology',
    author: 'JET', publisher: 'JET',
    subject: 'EdTech', year: 2024,
    description: 'A multidisciplinary journal exploring the intersection of education and technology, covering e-learning, learning management systems, gamification, and the impact of AI on modern pedagogical approaches.',
  },
  // Research Papers
  {
    id: 23, collection: 'research', type: 'Research Paper', isNew: false,
    title: 'Deep Learning in Healthcare Applications',
    author: 'Zhang et al.', publisher: '',
    subject: 'AI & Healthcare', year: 2023,
    description: 'A comprehensive survey of deep learning techniques applied in clinical settings, covering diagnostic imaging, patient outcome prediction, and drug discovery. Proposes a framework for evaluating the reliability of AI-powered medical tools.',
  },
  {
    id: 24, collection: 'research', type: 'Research Paper', isNew: false,
    title: 'Blockchain for Education Records',
    author: 'Nakamura & Owusu', publisher: '',
    subject: 'EdTech', year: 2022,
    description: 'An investigation into blockchain technology for securing and verifying academic credentials. The authors propose a decentralised architecture for issuing tamper-proof certificates and transcripts, with a working pilot implementation.',
  },
  {
    id: 25, collection: 'research', type: 'Research Paper', isNew: true,
    title: 'AI-Driven Adaptive Learning Systems',
    author: 'Osei & Kamara', publisher: '',
    subject: 'EdTech', year: 2024,
    description: 'This research presents an adaptive learning platform using reinforcement learning to personalise content delivery for university students. Results demonstrate a 23% improvement in course completion rates across five participating institutions.',
  },
  {
    id: 26, collection: 'research', type: 'Research Paper', isNew: true,
    title: 'Machine Learning for Academic Performance Prediction',
    author: 'Uwimana et al.', publisher: '',
    subject: 'Computer Science', year: 2024,
    description: 'A study applying machine learning classifiers to predict student academic outcomes from early-semester data. Conducted at three Rwandan universities, achieving 87% accuracy and identifying early-warning indicators for at-risk students.',
  },
  {
    id: 27, collection: 'research', type: 'Research Paper', isNew: true,
    title: 'Natural Language Processing for Kinyarwanda',
    author: 'Nkurunziza et al.', publisher: '',
    subject: 'AI', year: 2024,
    description: 'This paper presents the first large-scale NLP toolkit for the Kinyarwanda language, including a tokeniser, named-entity recogniser, and sentiment analyser. The work addresses a critical gap in African-language NLP resources.',
  },
  {
    id: 28, collection: 'research', type: 'Research Paper', isNew: false,
    title: 'Digital Transformation in African Universities',
    author: 'Uwera & Habimana', publisher: '',
    subject: 'EdTech', year: 2023,
    description: 'A comparative study examining digital transformation initiatives across 12 African universities, identifying key success factors, barriers, and policy recommendations for institutions pursuing technology-led modernisation.',
  },
  {
    id: 29, collection: 'research', type: 'Research Paper', isNew: false,
    title: 'Mobile Learning Adoption in Rwanda',
    author: 'Mutesi et al.', publisher: '',
    subject: 'EdTech', year: 2023,
    description: 'An empirical study of mobile learning adoption among Rwandan university students, exploring factors influencing usage, student attitudes, and the role of mobile money in enabling digital education access.',
  },
  {
    id: 30, collection: 'research', type: 'Research Paper', isNew: true,
    title: 'Cloud Computing for Academic Institutions',
    author: 'Ingabire & Mukamana', publisher: '',
    subject: 'Computer Science', year: 2024,
    description: 'A framework for cloud computing adoption in East African academic institutions, covering infrastructure design, data sovereignty considerations, cost modelling, and case studies from three Rwandan universities.',
  },
  {
    id: 31, collection: 'research', type: 'Research Paper', isNew: false,
    title: 'Cybersecurity Challenges in East Africa',
    author: 'Nzeyimana et al.', publisher: '',
    subject: 'Computer Science', year: 2023,
    description: 'A systematic review of cybersecurity threats and vulnerabilities faced by organisations in East Africa, with recommendations for policy, technical controls, and capacity building across public and private sectors.',
  },
  {
    id: 32, collection: 'research', type: 'Research Paper', isNew: true,
    title: 'Renewable Energy Systems Optimization',
    author: 'Bizimana et al.', publisher: '',
    subject: 'Engineering', year: 2024,
    description: 'This paper proposes optimisation algorithms for hybrid renewable energy systems in off-grid rural communities in Rwanda. Results show a 31% reduction in levelised energy costs compared to conventional diesel-based solutions.',
  },
  // Course Packs
  {
    id: 33, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'CSC 101 Lecture Notes & Exercises',
    author: 'Dr. Emmanuel Nkurunziza', publisher: '',
    subject: 'Computer Science', year: 2024,
    lecturer: 'Dr. Emmanuel Nkurunziza',
    course: 'CSC 101 — Introduction to Computer Science',
    description: 'Comprehensive lecture notes and exercise sets for CSC 101. Covers all 12 modules with worked examples, review questions, and past examination problems to help students consolidate their understanding after each class.',
  },
  {
    id: 34, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'MTH 101 Tutorial Sheets & Solutions',
    author: 'Dr. Patrick Habimana', publisher: '',
    subject: 'Mathematics', year: 2024,
    lecturer: 'Dr. Patrick Habimana',
    course: 'MTH 101 — Calculus I',
    description: 'Weekly tutorial sheets and full worked solutions for MTH 101 — Calculus I. Includes limit problems, differentiation exercises, integration tasks, and revision material aligned with the mid-semester and final assessments.',
  },
  {
    id: 35, collection: 'coursepacks', type: 'Course Pack', isNew: false,
    title: 'ENG 101 Writing & Communication Guide',
    author: 'Ms. Grace Mukamana', publisher: '',
    subject: 'English', year: 2024,
    lecturer: 'Ms. Grace Mukamana',
    course: 'ENG 101 — English Communication Skills',
    description: 'A structured writing and communication guide for ENG 101 students. Covers academic essay structure, research writing conventions, oral presentation skills, and referencing guidelines used in the course assessments.',
  },
  {
    id: 36, collection: 'coursepacks', type: 'Course Pack', isNew: false,
    title: 'PHY 101 Lab Manual',
    author: 'Prof. Sarah Ingabire', publisher: '',
    subject: 'Physics', year: 2024,
    lecturer: 'Prof. Sarah Ingabire',
    course: 'PHY 101 — Physics I',
    description: 'The complete laboratory manual for PHY 101 — Physics I. Contains 10 laboratory experiments with objectives, procedure steps, data recording templates, and report writing guidelines for each practical session.',
  },
  {
    id: 37, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'CSC 102 Programming Assignments & Solutions',
    author: 'Prof. Aline Uwimana', publisher: '',
    subject: 'Computer Science', year: 2024,
    lecturer: 'Prof. Aline Uwimana',
    course: 'CSC 102 — Programming Fundamentals',
    description: 'A complete set of programming assignments and fully worked solutions for CSC 102. Covers Python fundamentals, control flow, functions, recursion, and file I/O, with step-by-step explanations for each solution.',
  },
  {
    id: 38, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'CSC 103 Digital Logic Problem Sets',
    author: 'Dr. James Uwera', publisher: '',
    subject: 'Computer Science', year: 2024,
    lecturer: 'Dr. James Uwera',
    course: 'CSC 103 — Digital Logic Design',
    description: 'Problem sets and solutions covering Boolean algebra, logic gates, combinational and sequential circuits, and Karnaugh maps for CSC 103. Includes past examination questions with full worked solutions.',
  },
  {
    id: 39, collection: 'coursepacks', type: 'Course Pack', isNew: false,
    title: 'ENG 101 Essay Writing Samples',
    author: 'Ms. Grace Mukamana', publisher: '',
    subject: 'English', year: 2024,
    lecturer: 'Ms. Grace Mukamana',
    course: 'ENG 101 — English Communication Skills',
    description: 'A curated collection of annotated essay samples for ENG 101 students. Includes examples of strong and weak academic writing with detailed feedback notes, helping students understand assessment criteria and improve their own work.',
  },
  {
    id: 40, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'MTH 102 Statistics Exercises',
    author: 'Prof. Claire Mutesi', publisher: '',
    subject: 'Mathematics', year: 2024,
    lecturer: 'Prof. Claire Mutesi',
    course: 'MTH 102 — Probability and Statistics',
    description: 'Weekly exercise sheets covering probability theory, descriptive statistics, distributions, hypothesis testing, and regression analysis for MTH 102. All exercises include detailed solutions and examiner notes.',
  },
  {
    id: 41, collection: 'coursepacks', type: 'Course Pack', isNew: false,
    title: 'PHY 101 Physics Formula Sheet',
    author: 'Prof. Sarah Ingabire', publisher: '',
    subject: 'Physics', year: 2024,
    lecturer: 'Prof. Sarah Ingabire',
    course: 'PHY 101 — Physics I',
    description: 'A comprehensive formula reference sheet for PHY 101 covering mechanics, thermodynamics, waves, and electrostatics. Formatted for use in open-book assessments with concise derivations and unit conversions.',
  },
  {
    id: 42, collection: 'coursepacks', type: 'Course Pack', isNew: true,
    title: 'CSC 104 Computer Organisation Notes',
    author: 'Dr. Peter Nzeyimana', publisher: '',
    subject: 'Computer Science', year: 2024,
    lecturer: 'Dr. Peter Nzeyimana',
    course: 'CSC 104 — Computer Organisation & Architecture',
    description: 'Full lecture notes for CSC 104 covering number systems, CPU architecture, memory hierarchy, instruction sets, and I/O systems. Includes annotated diagrams and past paper questions with model answers.',
  },
  // Research Support
  {
    id: 43, collection: 'support', type: 'Guide', isNew: false,
    title: 'APA Citation Guide (7th Edition)',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Citation & Referencing', year: 2023,
    description: 'A complete guide to the APA 7th edition citation format. Covers in-text citations, reference list formatting, and worked examples for books, journals, websites, and all other source types commonly used in academic work.',
  },
  {
    id: 44, collection: 'support', type: 'Guide', isNew: false,
    title: 'Harvard Referencing Guide',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Citation & Referencing', year: 2023,
    description: 'A step-by-step guide to the Harvard referencing system used in academic writing. Includes clear formatting rules and worked examples for all common source types encountered in undergraduate and postgraduate research.',
  },
  {
    id: 45, collection: 'support', type: 'Guide', isNew: false,
    title: 'MLA Style Guide (9th Edition)',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Citation & Referencing', year: 2023,
    description: 'A comprehensive guide to the MLA 9th edition format for academic writing in humanities disciplines. Covers works-cited page construction and in-text citations for a wide range of source types including digital media.',
  },
  {
    id: 46, collection: 'support', type: 'Guide', isNew: true,
    title: 'Research Methodology Handbook',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Research Methods', year: 2024,
    description: 'An introduction to the principles and practices of academic research. Covers quantitative and qualitative research designs, data collection methods, analysis techniques, and the structure of a well-written research report.',
  },
  {
    id: 47, collection: 'support', type: 'Guide', isNew: false,
    title: 'Academic Integrity & Plagiarism Guide',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Academic Writing', year: 2024,
    description: 'A guide to academic integrity standards and how to avoid plagiarism in all forms of academic work. Explains what constitutes plagiarism, how to paraphrase and cite correctly, and the institutional consequences of dishonesty.',
  },
  {
    id: 48, collection: 'support', type: 'Guide', isNew: false,
    title: 'Literature Review Writing Guide',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Academic Writing', year: 2023,
    description: 'A practical guide for students writing their first literature review. Covers how to search for and evaluate sources, how to organise and synthesise findings, and how to integrate the review into a research paper or thesis.',
  },
  {
    id: 49, collection: 'support', type: 'Guide', isNew: false,
    title: 'Statistical Analysis for Social Sciences',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Research Methods', year: 2024,
    description: 'An introductory guide to statistical methods commonly used in social science research. Covers descriptive statistics, hypothesis testing, regression analysis, and how to interpret and present results in an academic context.',
  },
  {
    id: 50, collection: 'support', type: 'Guide', isNew: true,
    title: 'Thesis & Dissertation Writing Guide',
    author: 'Library Team', publisher: 'StackEDU Library',
    subject: 'Academic Writing', year: 2024,
    description: 'A comprehensive guide for students preparing a thesis or dissertation. Covers structure, chapter organisation, the research proposal process, ethical approval procedures, and examination requirements at the institution.',
  },
]

// ── Physical books ────────────────────────────────────────────────────────────

const PHYSICAL_BOOKS: PhysicalBook[] = [
  {
    id: 101, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Introduction to Algorithms',
    author: 'Cormen, Leiserson, Rivest & Stein',
    isbn: '978-0-262-04630-5', year: 2022, publisher: 'MIT Press',
    subject: 'Computer Science', subjectColor: '#DBEAFE',
    available: true, location: 'Shelf B4 · Floor 2',
  },
  {
    id: 102, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    isbn: '978-1-337-61392-7', year: 2020, publisher: 'Cengage Learning',
    subject: 'Mathematics', subjectColor: '#EDE9FE',
    available: false, expectedReturn: '15 Jun 2025', location: 'Shelf A2 · Floor 1',
  },
  {
    id: 103, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'University Physics',
    author: 'Young & Freedman',
    isbn: '978-0-135-15961-3', year: 2019, publisher: 'Pearson',
    subject: 'Physics', subjectColor: '#DCFCE7',
    available: true, location: 'Shelf C1 · Floor 2',
  },
  {
    id: 104, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Data Structures and Algorithms',
    author: 'Michael T. Goodrich',
    isbn: '978-1-118-77133-4', year: 2018, publisher: 'Wiley',
    subject: 'Computer Science', subjectColor: '#DBEAFE',
    available: false, expectedReturn: '20 Jun 2025', location: 'Shelf B4 · Floor 2',
  },
  {
    id: 105, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Linear Algebra',
    author: 'Gilbert Strang',
    isbn: '978-0-980-23272-6', year: 2016, publisher: 'Wellesley-Cambridge Press',
    subject: 'Mathematics', subjectColor: '#EDE9FE',
    available: true, location: 'Shelf A3 · Floor 1',
  },
  {
    id: 106, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Engineering Mathematics',
    author: 'K.A. Stroud',
    isbn: '978-1-352-01063-4', year: 2020, publisher: 'Red Globe Press',
    subject: 'Engineering', subjectColor: '#FEF3C7',
    available: true, location: 'Shelf D2 · Floor 3',
  },
  {
    id: 107, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Introduction to Robotics',
    author: 'John J. Craig',
    isbn: '978-0-201-54361-6', year: 2005, publisher: 'Pearson',
    subject: 'Engineering', subjectColor: '#FEF3C7',
    available: true, location: 'Shelf D3 · Floor 3',
  },
  {
    id: 108, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Probability and Statistics',
    author: 'Walpole, Myers & Myers',
    isbn: '978-0-321-62911-1', year: 2012, publisher: 'Pearson',
    subject: 'Mathematics', subjectColor: '#EDE9FE',
    available: false, expectedReturn: '10 Jul 2025', location: 'Shelf A4 · Floor 1',
  },
  {
    id: 109, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Computer Architecture',
    author: 'Patterson & Hennessy',
    isbn: '978-0-128-12275-4', year: 2017, publisher: 'Morgan Kaufmann',
    subject: 'Computer Science', subjectColor: '#DBEAFE',
    available: true, location: 'Shelf B5 · Floor 2',
  },
  {
    id: 110, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Signals and Systems',
    author: 'Oppenheim & Willsky',
    isbn: '978-0-138-14757-4', year: 1997, publisher: 'Pearson',
    subject: 'Engineering', subjectColor: '#FEF3C7',
    available: true, location: 'Shelf D1 · Floor 3',
  },
  {
    id: 111, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'African Literature Anthology',
    author: 'Ngugi et al.',
    isbn: '978-0-435-90523-1', year: 2010, publisher: 'Heinemann',
    subject: 'Literature', subjectColor: '#FCE7F3',
    available: false, expectedReturn: '5 Jul 2025', location: 'Shelf E1 · Floor 1',
  },
  {
    id: 112, collection: 'physical', type: 'Physical Book', isNew: false,
    title: 'Research Methods for Students',
    author: 'John W. Creswell',
    isbn: '978-1-506-38687-1', year: 2018, publisher: 'SAGE Publications',
    subject: 'Research', subjectColor: '#FEF9C3',
    available: true, location: 'Shelf A5 · Floor 1',
  },
]

const ALL_RESOURCES: AnyResource[] = [...DIGITAL_RESOURCES, ...PHYSICAL_BOOKS]

// ─────────────────────────────────────────────────────────────────────────────
// Page — state machine: home → collection → (sheet overlay)
// ─────────────────────────────────────────────────────────────────────────────

function ELibraryPage() {
  const [view,               setView]               = useState<'home' | 'collection'>('home')
  const [activeCollectionId, setActiveCollectionId] = useState<CollectionId | null>(null)
  const [activeResource,     setActiveResource]     = useState<AnyResource | null>(null)
  const [homeSearch,         setHomeSearch]         = useState('')

  const openCollection = (id: CollectionId) => {
    setActiveCollectionId(id)
    setView('collection')
    setHomeSearch('')
  }

  const goHome = () => {
    setView('home')
    setActiveCollectionId(null)
  }

  return (
    <AppShell
      navItems={STUDENT_NAV}
      pageTitle="E-Library"
      userName="Jean-Paul Mugisha"
      userRole="Student"
      userInitials="JM"
      unreadCount={3}
      infoCardLabel="STUDENT ID"
      infoCardValue="SFE-2024-0042"
      infoCardSubtext="Year 1"
    >
      {view === 'home' ? (
        <LibraryHome
          homeSearch={homeSearch}
          onSearchChange={setHomeSearch}
          onCollectionClick={openCollection}
          onResourceClick={setActiveResource}
        />
      ) : (
        activeCollectionId && (
          <CollectionPage
            collectionId={activeCollectionId}
            onBack={goHome}
            onResourceClick={setActiveResource}
          />
        )
      )}

      {/* Resource detail Sheet — always mounted, open state drives visibility */}
      <Sheet
        open={activeResource !== null}
        onOpenChange={(open) => { if (!open) setActiveResource(null) }}
      >
        <SheetContent
          side="right"
          className="p-0 border-l overflow-hidden flex flex-col"
          style={{ width: 'min(860px, 55vw)' }}
        >
          {activeResource && (
            isPhysicalBook(activeResource)
              ? <PhysicalBookSheetContent book={activeResource} onClose={() => setActiveResource(null)} />
              : <DigitalSheetContent resource={activeResource} />
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 1 — Library Homepage
// ─────────────────────────────────────────────────────────────────────────────

function LibraryHome({
  homeSearch,
  onSearchChange,
  onCollectionClick,
  onResourceClick,
}: {
  homeSearch: string
  onSearchChange: (q: string) => void
  onCollectionClick: (id: CollectionId) => void
  onResourceClick: (r: AnyResource) => void
}) {
  const q = homeSearch.toLowerCase()
  const searchResults = homeSearch
    ? ALL_RESOURCES.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q)
      )
    : []

  return (
    <div className="px-8 py-8 max-w-[1200px] mx-auto">

      {/* Section header */}
      <div className="mb-6">
        <h1
          className="t-h1 mb-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}
        >
          E-Library
        </h1>
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
          Browse our collection of academic resources by category.
        </p>
      </div>

      {/* Full-width search bar */}
      <div
        className="flex items-center gap-3 mb-8"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0 16px',
          height: 48,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <Search style={{ width: 16, height: 16, color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by title, author, subject, or keyword..."
          value={homeSearch}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: '0.9375rem', color: 'var(--foreground)' }}
        />
        {homeSearch && (
          <button
            onClick={() => onSearchChange('')}
            style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0, flexShrink: 0 }}
            aria-label="Clear search"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {homeSearch ? (
        /* ── Search results ── */
        <div>
          <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{homeSearch}&rdquo;
          </p>
          {searchResults.length === 0 ? (
            <EmptyState
              title="No results found"
              subtitle={`No resources match "${homeSearch}". Try a different search term.`}
              actionLabel="Clear search"
              onAction={() => onSearchChange('')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {searchResults.map(r => (
                <SearchResultRow
                  key={`${r.collection}-${r.id}`}
                  resource={r}
                  onLearnMore={() => onResourceClick(r)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Collections grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COLLECTIONS.map((col, i) => (
            <CollectionCard
              key={col.id}
              collection={col}
              delay={i * 40}
              onClick={() => onCollectionClick(col.id)}
            />
          ))}
        </div>
      )}

      {/* ── Contact / help section ─────────────────────────────────────────── */}
      <LibraryContactSection />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Library contact section (Level 1 homepage only)
// ─────────────────────────────────────────────────────────────────────────────

function LibraryContactSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name,    setName]    = useState('Jean-Paul Mugisha')
  const [email,   setEmail]   = useState('jeanpaul.mugisha@ur.ac.rw')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setDialogOpen(false)
    setSubject('')
    setMessage('')
    toast.success('Your message has been sent. The library team will respond within 24 hours.')
  }

  return (
    <>
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 48,
          paddingBottom: 48,
          textAlign: 'center',
        }}
      >
        <h3
          className="t-h3 mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Can't find what you're looking for?
        </h3>
        <p
          className="t-body mb-6 mx-auto"
          style={{ color: 'var(--muted-foreground)', maxWidth: 480 }}
        >
          Contact the library team or leave a message and we'll get back to you.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Call us — opens phone dialer */}
          <a href="tel:+250123456789">
            <Button variant="outline" className="gap-2">
              <Phone style={{ width: 15, height: 15 }} />
              Call us
            </Button>
          </a>

          {/* Leave a message — opens Dialog */}
          <Button variant="outline" className="gap-2" onClick={() => setDialogOpen(true)}>
            <MessageSquare style={{ width: 15, height: 15 }} />
            Leave a message
          </Button>

          {/* Ask StackEDU AI — navigates to dashboard AI card */}
          <Link to="/student/dashboard">
            <Button
              className="gap-2"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              <Sparkles style={{ width: 15, height: 15 }} />
              Ask StackEDU AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Leave a message dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{ maxWidth: 480 }}>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--foreground)',
            }}
          >
            Leave a Message
          </DialogTitle>
          <div className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-name">Name</Label>
              <Input
                id="lib-name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-email">Email</Label>
              <Input
                id="lib-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-subject">Subject</Label>
              <Input
                id="lib-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Request for a specific textbook"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-message">Message</Label>
              <Textarea
                id="lib-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe what you are looking for or your question..."
                rows={4}
              />
            </div>
            <div className="flex gap-3 mt-1">
              <Button
                className="flex-1"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending…
                  </span>
                ) : 'Send message'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection card (Level 1 grid item)
// ─────────────────────────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  delay,
  onClick,
}: {
  collection: CollectionDef
  delay: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { Icon, badge, name, description, count } = collection

  return (
    <div
      className="relative flex flex-col cursor-pointer select-none"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 24,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
        animation: `fade-up 250ms ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
    >
      {/* Badge — top right */}
      {badge && (
        <span
          className="t-label absolute px-2.5 py-1"
          style={{
            top: 20, right: 20,
            backgroundColor: badge.bg,
            color: badge.color,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {badge.label}
        </span>
      )}

      {/* Icon circle */}
      <div
        className="flex items-center justify-center mb-4 flex-shrink-0"
        style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: '50%' }}
      >
        <Icon style={{ width: 24, height: 24, color: 'var(--ink)' }} />
      </div>

      {/* Name */}
      <h3
        className="mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--foreground)',
          lineHeight: 1.4,
        }}
      >
        {name}
      </h3>

      {/* Description */}
      <p
        className="flex-1"
        style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
      >
        {description}
      </p>

      {/* Footer */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span
          style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--success)' }}
        >
          {count} →
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Search result row (flat list on home search)
// ─────────────────────────────────────────────────────────────────────────────

function SearchResultRow({
  resource,
  onLearnMore,
}: {
  resource: AnyResource
  onLearnMore: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const tc = TYPE_STYLE[resource.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  const collName = COLLECTIONS.find(c => c.id === resource.collection)?.name ?? ''

  return (
    <div
      className="flex items-center gap-4"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: '14px 20px',
        transition: 'box-shadow 150ms ease-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="t-label px-2.5 py-1 flex-shrink-0"
        style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)' }}
      >
        {resource.type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>
          {resource.title}
        </p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {resource.author} · {resource.subject} · {resource.year}
        </p>
      </div>
      <span className="t-caption flex-shrink-0 hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
        {collName}
      </span>
      <Button variant="outline" size="sm" onClick={onLearnMore} className="flex-shrink-0">
        Learn more
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 2 — Collection page
// ─────────────────────────────────────────────────────────────────────────────

const DIGITAL_PAGE_SIZE  = 9
const PHYSICAL_PAGE_SIZE = 12

function CollectionPage({
  collectionId,
  onBack,
  onResourceClick,
}: {
  collectionId: CollectionId
  onBack: () => void
  onResourceClick: (r: AnyResource) => void
}) {
  const [colSearch,      setColSearch]      = useState('')
  const [subjectFilter,  setSubjectFilter]  = useState('All')
  const [page,           setPage]           = useState(1)

  const collection = COLLECTIONS.find(c => c.id === collectionId)!
  const isPhysical = collectionId === 'physical'
  const pageSize   = isPhysical ? PHYSICAL_PAGE_SIZE : DIGITAL_PAGE_SIZE

  const rawResources: AnyResource[] = isPhysical
    ? PHYSICAL_BOOKS
    : DIGITAL_RESOURCES.filter(r => r.collection === collectionId)

  const subjects = ['All', ...Array.from(new Set(rawResources.map(r => r.subject)))]

  const filtered = rawResources.filter(r => {
    const q       = colSearch.toLowerCase()
    const matchQ  = !q || r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
    const matchS  = subjectFilter === 'All' || r.subject === subjectFilter
    return matchQ && matchS
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSubject = (s: string) => { setSubjectFilter(s); setPage(1) }
  const handleSearch  = (q: string) => { setColSearch(q);     setPage(1) }

  return (
    <div className="px-8 py-8 max-w-[1200px] mx-auto animate-fade-up">

      {/* Back breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 mb-6 transition-opacity hover:opacity-70"
        style={{
          color: 'var(--muted-foreground)',
          background: 'none', border: 'none',
          cursor: 'pointer', fontSize: '0.875rem', padding: 0,
        }}
      >
        <ArrowLeft style={{ width: 15, height: 15 }} />
        E-Library → {collection.name}
      </button>

      {/* Collection header */}
      <div className="mb-6">
        <h2
          className="mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem', fontWeight: 700,
            color: 'var(--foreground)', letterSpacing: '-0.01em',
          }}
        >
          {collection.name}
        </h2>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
          {filtered.length} {isPhysical ? 'items' : 'resources'}
        </p>
      </div>

      {/* Filter tabs + search row */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Subject filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {subjects.map(s => {
            const active = subjectFilter === s
            return (
              <button
                key={s}
                onClick={() => handleSubject(s)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150"
                style={{
                  backgroundColor: active ? 'var(--brand)' : 'var(--muted)',
                  color: active ? 'var(--brand-ink)' : 'var(--muted-foreground)',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Collection search */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          style={{
            backgroundColor: 'var(--muted)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px', height: 38, minWidth: 220,
          }}
        >
          <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            value={colSearch}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}
          />
          {colSearch && (
            <button
              onClick={() => handleSearch('')}
              style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      {/* Resource grid */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No resources found"
          subtitle={colSearch ? `No results for "${colSearch}".` : 'No resources match your current filters.'}
          actionLabel={colSearch ? 'Clear search' : undefined}
          onAction={colSearch ? () => handleSearch('') : undefined}
        />
      ) : isPhysical ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((r, i) => (
            <PhysicalBookCard
              key={r.id}
              book={r as PhysicalBook}
              delay={i * 30}
              onLearnMore={() => onResourceClick(r)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((r, i) => (
            <DigitalResourceCard
              key={r.id}
              resource={r as DigitalResource}
              delay={i * 30}
              onLearnMore={() => onResourceClick(r)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              color: 'var(--foreground)',
              backgroundColor: 'var(--muted)',
              border: 'none',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft style={{ width: 13, height: 13 }} />
            Previous
          </button>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              color: 'var(--foreground)',
              backgroundColor: 'var(--muted)',
              border: 'none',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Digital resource card (3-col grid in collection page)
// ─────────────────────────────────────────────────────────────────────────────

function DigitalResourceCard({
  resource,
  delay,
  onLearnMore,
}: {
  resource: DigitalResource
  delay: number
  onLearnMore: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const tc = TYPE_STYLE[resource.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  return (
    <div
      className="relative flex flex-col"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding: 20,
        transition: 'box-shadow 150ms ease-out',
        animation: `fade-up 250ms ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* NEW badge — top right */}
      {resource.isNew && (
        <span
          className="t-label absolute px-2 py-0.5"
          style={{
            top: 16, right: 16,
            backgroundColor: 'var(--brand)',
            color: 'var(--brand-ink)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          NEW
        </span>
      )}

      {/* Type badge — top left */}
      <span
        className="t-label px-2.5 py-1 w-fit mb-4"
        style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)' }}
      >
        {resource.type}
      </span>

      {/* Title */}
      <h3
        className="mb-1 line-clamp-2"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9375rem', fontWeight: 600,
          color: 'var(--foreground)', lineHeight: 1.4,
        }}
      >
        {resource.title}
      </h3>

      {/* Author */}
      <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
        {resource.author}
      </p>

      {/* Subject + year */}
      <div className="flex items-center gap-2 mb-4 mt-auto">
        <span
          className="t-label px-2 py-0.5"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}
        >
          {resource.subject}
        </span>
        <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{resource.year}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onLearnMore}
        className="w-full"
        style={{ fontSize: '0.8125rem' }}
      >
        Learn more
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Physical book card (4-col grid in collection page)
// ─────────────────────────────────────────────────────────────────────────────

function PhysicalBookCard({
  book,
  delay,
  onLearnMore,
}: {
  book: PhysicalBook
  delay: number
  onLearnMore: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        transition: 'box-shadow 150ms ease-out',
        animation: `fade-up 250ms ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover — 180px coloured placeholder */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ height: 180, backgroundColor: book.subjectColor }}
      >
        {/* Not available — top left */}
        {!book.available && (
          <span
            className="t-label absolute px-2 py-0.5"
            style={{
              top: 10, left: 10,
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Not available
          </span>
        )}
        {/* NEW circle — top right */}
        {book.isNew && (
          <div
            className="absolute t-label flex items-center justify-center"
            style={{
              top: 10, right: 10,
              width: 28, height: 28,
              backgroundColor: 'var(--brand)',
              color: 'var(--brand-ink)',
              borderRadius: '50%',
              fontSize: 9,
            }}
          >
            NEW
          </div>
        )}
        <p
          className="px-4 text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '0.875rem',
            color: 'var(--ink)', lineHeight: 1.4,
          }}
        >
          {book.title}
        </p>
      </div>

      {/* Book info */}
      <div style={{ padding: '14px 14px 16px' }} className="flex flex-col flex-1">
        <p
          className="font-semibold mb-1 line-clamp-2"
          style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.4 }}
        >
          {book.title}
        </p>
        <p className="t-caption mb-3" style={{ color: 'var(--muted-foreground)' }}>
          {book.author}
        </p>
        <span
          className="t-label px-2 py-0.5 w-fit mb-3"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}
        >
          BOOK
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onLearnMore}
          className="w-full mt-auto"
          style={{ fontSize: '0.8125rem' }}
        >
          Learn more
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 3 — Digital resource Sheet content
// ─────────────────────────────────────────────────────────────────────────────

function DigitalSheetContent({ resource }: { resource: DigitalResource }) {
  const tc = TYPE_STYLE[resource.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }

  const related = DIGITAL_RESOURCES
    .filter(r => r.collection === resource.collection && r.id !== resource.id)
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span
          className="t-label px-2.5 py-1 inline-flex mb-3"
          style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 'var(--radius-sm)' }}
        >
          {resource.type}
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--foreground)', lineHeight: 1.3, letterSpacing: '-0.01em',
          }}
        >
          {resource.title}
        </h2>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px 32px', flex: 1 }}>

        {/* Meta rows */}
        <div
          className="flex flex-col gap-3 mb-5 pb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <SheetDataRow label="Author"      value={resource.author} />
          {resource.publisher && <SheetDataRow label="Publisher" value={resource.publisher} />}
          <SheetDataRow label="Year"        value={String(resource.year)} />
          {resource.course   && <SheetDataRow label="Course"     value={resource.course} />}
          {resource.lecturer && <SheetDataRow label="Uploaded by" value={resource.lecturer} />}
        </div>

        {/* Subject tag */}
        <div className="mb-5">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>SUBJECT</p>
          <span
            className="t-label px-2.5 py-1"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderRadius: 'var(--radius-sm)' }}
          >
            {resource.subject}
          </span>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>ABOUT</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', lineHeight: 1.65 }}>
            {resource.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            className="flex-1 gap-2"
            style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Download
          </Button>
          <Button variant="outline" className="flex-1">
            Add to reading list
          </Button>
        </div>

        {/* Related resources */}
        {related.length > 0 && (
          <div>
            <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>RELATED RESOURCES</p>
            <div className="flex flex-col gap-2">
              {related.map(r => {
                const rtc = TYPE_STYLE[r.type] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span
                      className="t-label px-2 py-0.5 inline-flex mb-1.5"
                      style={{ backgroundColor: rtc.bg, color: rtc.color, borderRadius: 'var(--radius-sm)' }}
                    >
                      {r.type}
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>
                      {r.title}
                    </p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {r.author}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 3 — Physical book Sheet content
// ─────────────────────────────────────────────────────────────────────────────

function PhysicalBookSheetContent({
  book,
  onClose,
}: {
  book: PhysicalBook
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Coloured cover */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ height: 200, backgroundColor: book.subjectColor }}
      >
        <p
          className="px-8 text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '1.125rem',
            color: 'var(--ink)', lineHeight: 1.4,
            maxWidth: '80%',
          }}
        >
          {book.title}
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 24px 32px' }}>
        <h2
          className="mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--foreground)', lineHeight: 1.3, letterSpacing: '-0.01em',
          }}
        >
          {book.title}
        </h2>
        <p className="t-body-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>{book.author}</p>

        {/* Meta */}
        <div
          className="flex flex-col gap-3 mb-5 pb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <SheetDataRow label="ISBN"      value={book.isbn} mono />
          <SheetDataRow label="Year"      value={String(book.year)} />
          <SheetDataRow label="Publisher" value={book.publisher} />
          <SheetDataRow label="Location"  value={book.location} />
        </div>

        {/* Availability */}
        <div
          className="flex items-start gap-3 mb-6 p-4"
          style={{
            borderRadius: 'var(--radius-xl)',
            backgroundColor: book.available ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: `1px solid ${book.available ? 'var(--success)' : 'var(--warning)'}`,
          }}
        >
          {book.available ? (
            <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
          ) : (
            <Clock style={{ width: 18, height: 18, color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
          )}
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: book.available ? 'var(--success)' : 'var(--warning)' }}>
              {book.available ? 'Available · Visit the library to borrow' : 'Currently borrowed'}
            </p>
            {!book.available && book.expectedReturn && (
              <p className="t-caption mt-0.5" style={{ color: 'var(--warning)' }}>
                Expected return: {book.expectedReturn}
              </p>
            )}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function SheetDataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="t-caption flex-shrink-0"
        style={{ color: 'var(--muted-foreground)', minWidth: 88, paddingTop: 1 }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.875rem',
          color: 'var(--foreground)',
          lineHeight: 1.5,
          fontFamily: mono ? 'var(--font-mono)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="flex items-center justify-center rounded-2xl mb-4"
        style={{ width: 56, height: 56, backgroundColor: 'var(--muted)' }}
      >
        <Search style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
      </div>
      <h3 className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        {title}
      </h3>
      <p className="t-body-sm mb-5" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
        {subtitle}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
