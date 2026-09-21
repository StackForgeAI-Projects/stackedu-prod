// ─────────────────────────────────────────────────────────────────────────────
// StackEDU — Bursar mock data
// ─────────────────────────────────────────────────────────────────────────────

import {
  LayoutDashboard, CreditCard, Settings, Users, Receipt, BarChart2, RefreshCw,
} from 'lucide-react'

// ── Identity ──────────────────────────────────────────────────────────────────

export const BURSAR = {
  fullName:    'Marie-Claire Ingabire',
  firstName:   'Marie-Claire',
  id:          'BUR-2024-0001',
  initials:    'MI',
  institution: 'StackForgeAI University',
  office:      'Finance Office',
  email:       'marie-claire.ingabire@sfu.ac.rw',
  phone:       '+250 788 345 678',
  joinedDate:  '10 Aug 2022',
}

// ── Navigation ────────────────────────────────────────────────────────────────

export const BURSAR_NAV = [
  { label: 'Dashboard',         to: '/bursar/dashboard',        icon: LayoutDashboard },
  { label: 'Payment Ledger',    to: '/bursar/ledger',           icon: CreditCard      },
  { label: 'Fee Structure',     to: '/bursar/fee-structure',    icon: Settings        },
  { label: 'Student Accounts',  to: '/bursar/student-accounts', icon: Users           },
  { label: 'Receipts',          to: '/bursar/receipts',         icon: Receipt         },
  { label: 'Reports',           to: '/bursar/reports',          icon: BarChart2       },
  { label: 'Reconciliation',    to: '/bursar/reconciliation',   icon: RefreshCw       },
]

// ── Shared types ──────────────────────────────────────────────────────────────

export type PaymentMethod  = 'MTN MoMo' | 'Airtel Money' | 'Card' | 'Bank Transfer'
export type TxnStatus      = 'Paid' | 'Pending' | 'Failed'
export type FeeAccountStatus = 'Paid' | 'Outstanding' | 'On Hold'
export type ReceiptStatus  = 'Valid' | 'Voided'
export type GatewayStatus  = 'Pending' | 'Failed' | 'Mismatch'
export type ResolutionType = 'Mark as Paid' | 'Mark as Failed' | 'Request Refund'
export type FeeCategory    = 'Tuition' | 'Levy' | 'Other'
export type YearGroup      = 'All Years' | 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4'

// ── Transactions (20) ─────────────────────────────────────────────────────────

export interface Transaction {
  id:          string
  txnId:       string
  studentId:   string
  studentName: string
  amount:      number
  method:      PaymentMethod
  status:      TxnStatus
  description: string
  date:        string
  time:        string
  gatewayRef:  string
  receiptNo?:  string
}

export const TRANSACTIONS: Transaction[] = [
  { id: '1',  txnId: 'TXN-2025-0020', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha',  amount: 325000, method: 'MTN MoMo',     status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '22 Jan 2025', time: '14:23', gatewayRef: 'GW-MTN-20250122-001', receiptNo: 'RCT-2025-0020' },
  { id: '2',  txnId: 'TXN-2025-0019', studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase', amount: 500000, method: 'Card',          status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '22 Jan 2025', time: '11:15', gatewayRef: 'GW-DPO-20250122-002', receiptNo: 'RCT-2025-0019' },
  { id: '3',  txnId: 'TXN-2025-0018', studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',  amount: 650000, method: 'Bank Transfer', status: 'Paid',    description: 'Semester 1 Tuition Fee',       date: '21 Jan 2025', time: '09:30', gatewayRef: 'GW-BNK-20250121-003', receiptNo: 'RCT-2025-0018' },
  { id: '4',  txnId: 'TXN-2025-0017', studentId: 'SFE-2024-0058', studentName: 'Claudine Mukamana', amount: 325000, method: 'MTN MoMo',     status: 'Pending', description: 'Semester 1 Partial Payment',   date: '21 Jan 2025', time: '16:45', gatewayRef: 'GW-MTN-20250121-004' },
  { id: '5',  txnId: 'TXN-2025-0016', studentId: 'SFE-2024-0071', studentName: 'Eric Nzeyimana',    amount: 325000, method: 'Airtel Money',  status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '20 Jan 2025', time: '13:10', gatewayRef: 'GW-AIR-20250120-005', receiptNo: 'RCT-2025-0016' },
  { id: '6',  txnId: 'TXN-2025-0015', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    amount: 650000, method: 'Card',          status: 'Paid',    description: 'Semester 1 Tuition Fee',       date: '20 Jan 2025', time: '10:05', gatewayRef: 'GW-DPO-20250120-006', receiptNo: 'RCT-2025-0015' },
  { id: '7',  txnId: 'TXN-2025-0014', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', amount: 500000, method: 'Bank Transfer', status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '19 Jan 2025', time: '15:20', gatewayRef: 'GW-BNK-20250119-007', receiptNo: 'RCT-2025-0014' },
  { id: '8',  txnId: 'TXN-2025-0013', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',    amount: 325000, method: 'MTN MoMo',     status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '19 Jan 2025', time: '08:55', gatewayRef: 'GW-MTN-20250119-008', receiptNo: 'RCT-2025-0013' },
  { id: '9',  txnId: 'TXN-2025-0012', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha', amount: 325000, method: 'MTN MoMo',     status: 'Paid',    description: 'Semester 1 Remaining Balance', date: '18 Jan 2025', time: '14:30', gatewayRef: 'GW-MTN-20250118-009', receiptNo: 'RCT-2025-0012' },
  { id: '10', txnId: 'TXN-2025-0011', studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase', amount: 150000, method: 'Airtel Money',  status: 'Failed',  description: 'Administrative Levy',          date: '18 Jan 2025', time: '12:20', gatewayRef: 'GW-AIR-20250118-010' },
  { id: '11', txnId: 'TXN-2025-0010', studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',  amount: 110000, method: 'Card',          status: 'Paid',    description: 'Levies & Fees Bundle',         date: '17 Jan 2025', time: '11:45', gatewayRef: 'GW-DPO-20250117-011', receiptNo: 'RCT-2025-0011' },
  { id: '12', txnId: 'TXN-2025-0009', studentId: 'SFE-2024-0071', studentName: 'Eric Nzeyimana',    amount: 110000, method: 'MTN MoMo',     status: 'Pending', description: 'Levies & Fees Bundle',         date: '17 Jan 2025', time: '09:15', gatewayRef: 'GW-MTN-20250117-012' },
  { id: '13', txnId: 'TXN-2025-0008', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    amount: 110000, method: 'Airtel Money',  status: 'Paid',    description: 'Levies & Fees Bundle',         date: '16 Jan 2025', time: '16:00', gatewayRef: 'GW-AIR-20250116-013', receiptNo: 'RCT-2025-0010' },
  { id: '14', txnId: 'TXN-2025-0007', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', amount: 220000, method: 'Card',          status: 'Paid',    description: 'Remaining Balance',            date: '16 Jan 2025', time: '13:30', gatewayRef: 'GW-DPO-20250116-014', receiptNo: 'RCT-2025-0009' },
  { id: '15', txnId: 'TXN-2025-0006', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',    amount: 70000,  method: 'Bank Transfer', status: 'Paid',    description: 'Administrative & ICT Fees',    date: '15 Jan 2025', time: '10:45', gatewayRef: 'GW-BNK-20250115-015', receiptNo: 'RCT-2025-0008' },
  { id: '16', txnId: 'TXN-2025-0005', studentId: 'SFE-2024-0058', studentName: 'Claudine Mukamana', amount: 325000, method: 'MTN MoMo',     status: 'Failed',  description: 'Semester 1 Partial Payment',   date: '15 Jan 2025', time: '14:20', gatewayRef: 'GW-MTN-20250115-016' },
  { id: '17', txnId: 'TXN-2025-0004', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha', amount: 110000, method: 'Airtel Money',  status: 'Pending', description: 'Levies & Fees Bundle',         date: '14 Jan 2025', time: '11:30', gatewayRef: 'GW-AIR-20250114-017' },
  { id: '18', txnId: 'TXN-2025-0003', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', amount: 650000, method: 'MTN MoMo',     status: 'Paid',    description: 'Semester 1 Tuition Fee',       date: '14 Jan 2025', time: '09:00', gatewayRef: 'GW-MTN-20250114-018', receiptNo: 'RCT-2025-0007' },
  { id: '19', txnId: 'TXN-2025-0002', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',    amount: 150000, method: 'Card',          status: 'Failed',  description: 'Student Activity Fee',         date: '13 Jan 2025', time: '15:15', gatewayRef: 'GW-DPO-20250113-019' },
  { id: '20', txnId: 'TXN-2025-0001', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    amount: 325000, method: 'MTN MoMo',     status: 'Paid',    description: 'Semester 1 Partial Payment',   date: '13 Jan 2025', time: '12:45', gatewayRef: 'GW-MTN-20250113-020', receiptNo: 'RCT-2025-0006' },
]

// ── Fee structure ─────────────────────────────────────────────────────────────

export interface FeeItem {
  id:         number
  name:       string
  category:   FeeCategory
  amount:     number
  dueDate:    string
  programme:  string
  yearGroup:  YearGroup
  status:     'Active' | 'Inactive'
}

export const FEE_ITEMS: FeeItem[] = [
  { id: 1,  name: 'Tuition Fee',          category: 'Tuition', amount: 650000, dueDate: '30 Sep 2024', programme: 'Computer Science',       yearGroup: 'All Years', status: 'Active' },
  { id: 2,  name: 'Administrative Levy',  category: 'Levy',    amount: 50000,  dueDate: '30 Sep 2024', programme: 'Computer Science',       yearGroup: 'All Years', status: 'Active' },
  { id: 3,  name: 'Student Union Fee',    category: 'Levy',    amount: 25000,  dueDate: '30 Sep 2024', programme: 'Computer Science',       yearGroup: 'All Years', status: 'Active' },
  { id: 4,  name: 'Library Fee',          category: 'Levy',    amount: 15000,  dueDate: '30 Sep 2024', programme: 'Computer Science',       yearGroup: 'All Years', status: 'Active' },
  { id: 5,  name: 'ICT Fee',              category: 'Levy',    amount: 20000,  dueDate: '30 Sep 2024', programme: 'Computer Science',       yearGroup: 'All Years', status: 'Active' },
  { id: 6,  name: 'Tuition Fee',          category: 'Tuition', amount: 600000, dueDate: '30 Sep 2024', programme: 'Business Administration', yearGroup: 'All Years', status: 'Active' },
  { id: 7,  name: 'Administrative Levy',  category: 'Levy',    amount: 50000,  dueDate: '30 Sep 2024', programme: 'Business Administration', yearGroup: 'All Years', status: 'Active' },
  { id: 8,  name: 'Student Union Fee',    category: 'Levy',    amount: 25000,  dueDate: '30 Sep 2024', programme: 'Business Administration', yearGroup: 'All Years', status: 'Active' },
  { id: 9,  name: 'Library Fee',          category: 'Levy',    amount: 15000,  dueDate: '30 Sep 2024', programme: 'Business Administration', yearGroup: 'All Years', status: 'Active' },
  { id: 10, name: 'Field Trip Levy',      category: 'Levy',    amount: 30000,  dueDate: '30 Nov 2024', programme: 'Business Administration', yearGroup: 'Year 1',    status: 'Active' },
]

// ── Student fee accounts (15) ─────────────────────────────────────────────────

export interface StudentPayment {
  date:        string
  description: string
  amount:      number
  method:      PaymentMethod
  status:      TxnStatus
  receiptNo:   string
}

export interface BursarStudent {
  id:          string
  name:        string
  initials:    string
  programme:   string
  year:        number
  totalFees:   number
  amountPaid:  number
  outstanding: number
  status:      FeeAccountStatus
  hasHold:     boolean
  payments:    StudentPayment[]
}

export const BURSAR_STUDENTS: BursarStudent[] = [
  {
    id: 'SFE-2024-0042', name: 'Jean-Paul Mugisha',  initials: 'JM',
    programme: 'Computer Science', year: 1, totalFees: 760000, amountPaid: 760000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '22 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 325000, method: 'MTN MoMo',    status: 'Paid', receiptNo: 'RCT-2025-0020' },
      { date: '18 Jan 2025', description: 'Semester 1 Remaining Balance', amount: 325000, method: 'MTN MoMo',    status: 'Paid', receiptNo: 'RCT-2025-0012' },
      { date: '14 Jan 2025', description: 'Levies & Fees Bundle',         amount: 110000, method: 'Airtel Money', status: 'Paid', receiptNo: 'RCT-2025-0005' },
    ],
  },
  {
    id: 'SFE-2024-0017', name: 'Diane Umutoniwase',  initials: 'DU',
    programme: 'Computer Science', year: 1, totalFees: 760000, amountPaid: 500000, outstanding: 260000, status: 'Outstanding', hasHold: false,
    payments: [
      { date: '22 Jan 2025', description: 'Semester 1 Partial Payment', amount: 500000, method: 'Card',         status: 'Paid',   receiptNo: 'RCT-2025-0019' },
      { date: '18 Jan 2025', description: 'Administrative Levy',        amount: 150000, method: 'Airtel Money', status: 'Failed', receiptNo: ''              },
    ],
  },
  {
    id: 'SFE-2024-0033', name: 'Patrick Habimana',   initials: 'PH',
    programme: 'Computer Science', year: 2, totalFees: 760000, amountPaid: 760000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '21 Jan 2025', description: 'Semester 1 Tuition Fee',  amount: 650000, method: 'Bank Transfer', status: 'Paid', receiptNo: 'RCT-2025-0018' },
      { date: '17 Jan 2025', description: 'Levies & Fees Bundle',    amount: 110000, method: 'Card',          status: 'Paid', receiptNo: 'RCT-2025-0011' },
    ],
  },
  {
    id: 'SFE-2024-0058', name: 'Claudine Mukamana',  initials: 'CM',
    programme: 'Computer Science', year: 1, totalFees: 760000, amountPaid: 110000, outstanding: 650000, status: 'On Hold', hasHold: true,
    payments: [
      { date: '21 Jan 2025', description: 'Semester 1 Partial Payment', amount: 325000, method: 'MTN MoMo', status: 'Pending', receiptNo: ''              },
      { date: '15 Jan 2025', description: 'Semester 1 Partial Payment', amount: 325000, method: 'MTN MoMo', status: 'Failed',  receiptNo: ''              },
      { date: '10 Jan 2025', description: 'Registration Deposit',       amount: 110000, method: 'MTN MoMo', status: 'Paid',    receiptNo: 'RCT-2025-0004' },
    ],
  },
  {
    id: 'SFE-2024-0071', name: 'Eric Nzeyimana',     initials: 'EN',
    programme: 'Computer Science', year: 2, totalFees: 760000, amountPaid: 435000, outstanding: 325000, status: 'Outstanding', hasHold: false,
    payments: [
      { date: '20 Jan 2025', description: 'Semester 1 Partial Payment', amount: 325000, method: 'Airtel Money', status: 'Paid',    receiptNo: 'RCT-2025-0016' },
      { date: '17 Jan 2025', description: 'Levies & Fees Bundle',       amount: 110000, method: 'MTN MoMo',    status: 'Pending', receiptNo: ''              },
    ],
  },
  {
    id: 'SFE-2024-0089', name: 'Aline Ingabire',     initials: 'AI',
    programme: 'Computer Science', year: 1, totalFees: 760000, amountPaid: 760000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '20 Jan 2025', description: 'Semester 1 Tuition Fee',  amount: 650000, method: 'Card',         status: 'Paid', receiptNo: 'RCT-2025-0015' },
      { date: '16 Jan 2025', description: 'Levies & Fees Bundle',    amount: 110000, method: 'Airtel Money', status: 'Paid', receiptNo: 'RCT-2025-0010' },
    ],
  },
  {
    id: 'SFE-2024-0023', name: 'Alice Mukeshimana',  initials: 'AM',
    programme: 'Business Administration', year: 2, totalFees: 720000, amountPaid: 720000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '19 Jan 2025', description: 'Semester 1 Partial Payment', amount: 500000, method: 'Bank Transfer', status: 'Paid', receiptNo: 'RCT-2025-0014' },
      { date: '16 Jan 2025', description: 'Remaining Balance',          amount: 220000, method: 'Card',          status: 'Paid', receiptNo: 'RCT-2025-0009' },
    ],
  },
  {
    id: 'SFE-2024-0055', name: 'Solange Mutesi',     initials: 'SM',
    programme: 'Business Administration', year: 1, totalFees: 720000, amountPaid: 395000, outstanding: 325000, status: 'Outstanding', hasHold: false,
    payments: [
      { date: '19 Jan 2025', description: 'Semester 1 Partial Payment',  amount: 325000, method: 'MTN MoMo',    status: 'Paid',   receiptNo: 'RCT-2025-0013' },
      { date: '15 Jan 2025', description: 'Administrative & ICT Fees',   amount: 70000,  method: 'Bank Transfer',status: 'Paid',   receiptNo: 'RCT-2025-0008' },
      { date: '13 Jan 2025', description: 'Student Activity Fee',        amount: 150000, method: 'Card',         status: 'Failed', receiptNo: ''              },
    ],
  },
  {
    id: 'SFE-2024-0011', name: 'Emmanuel Habineza',  initials: 'EH',
    programme: 'Business Administration', year: 3, totalFees: 720000, amountPaid: 720000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '10 Jan 2025', description: 'Full Semester Fee', amount: 720000, method: 'Card', status: 'Paid', receiptNo: 'RCT-2025-0003' },
    ],
  },
  {
    id: 'SFE-2024-0027', name: 'Marie Uwantege',     initials: 'MU',
    programme: 'Computer Science', year: 3, totalFees: 760000, amountPaid: 435000, outstanding: 325000, status: 'Outstanding', hasHold: false,
    payments: [
      { date: '12 Jan 2025', description: 'Semester 1 Partial Payment', amount: 435000, method: 'Card', status: 'Paid', receiptNo: 'RCT-2025-0002' },
    ],
  },
  {
    id: 'SFE-2024-0068', name: 'Fred Nkurunziza',    initials: 'FN',
    programme: 'Computer Science', year: 2, totalFees: 760000, amountPaid: 260000, outstanding: 500000, status: 'On Hold', hasHold: true,
    payments: [
      { date: '08 Jan 2025', description: 'Registration Deposit', amount: 260000, method: 'MTN MoMo', status: 'Paid', receiptNo: 'RCT-2025-0001' },
    ],
  },
  {
    id: 'SFE-2024-0039', name: 'Robert Uwera',       initials: 'RU',
    programme: 'Business Administration', year: 1, totalFees: 720000, amountPaid: 720000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '09 Jan 2025', description: 'Full Semester Fee', amount: 720000, method: 'Bank Transfer', status: 'Paid', receiptNo: 'RCT-2024-0098' },
    ],
  },
  {
    id: 'SFE-2024-0015', name: 'Christine Ishimwe',  initials: 'CI',
    programme: 'Computer Science', year: 4, totalFees: 760000, amountPaid: 760000, outstanding: 0, status: 'Paid', hasHold: false,
    payments: [
      { date: '06 Jan 2025', description: 'Full Semester Fee', amount: 760000, method: 'Card', status: 'Paid', receiptNo: 'RCT-2024-0097' },
    ],
  },
  {
    id: 'SFE-2024-0031', name: 'Bruno Ineza',         initials: 'BI',
    programme: 'Business Administration', year: 2, totalFees: 720000, amountPaid: 395000, outstanding: 325000, status: 'Outstanding', hasHold: false,
    payments: [
      { date: '07 Jan 2025', description: 'Semester 1 Partial Payment', amount: 395000, method: 'Airtel Money', status: 'Paid', receiptNo: 'RCT-2024-0096' },
    ],
  },
  {
    id: 'SFE-2024-0059', name: 'Rose Mukamugema',    initials: 'RM',
    programme: 'Computer Science', year: 1, totalFees: 760000, amountPaid: 0, outstanding: 760000, status: 'On Hold', hasHold: true,
    payments: [],
  },
]

// ── Receipts (15) ─────────────────────────────────────────────────────────────

export interface BursarReceipt {
  id:            number
  receiptNo:     string
  studentId:     string
  studentName:   string
  issueDate:     string
  description:   string
  amount:        number
  method:        PaymentMethod
  status:        ReceiptStatus
  voidedAt?:     string
  voidedReason?: string
}

export const RECEIPTS: BursarReceipt[] = [
  { id: 1,  receiptNo: 'RCT-2025-0020', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha',  issueDate: '22 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 325000, method: 'MTN MoMo',     status: 'Valid'  },
  { id: 2,  receiptNo: 'RCT-2025-0019', studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase', issueDate: '22 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 500000, method: 'Card',          status: 'Valid'  },
  { id: 3,  receiptNo: 'RCT-2025-0018', studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',  issueDate: '21 Jan 2025', description: 'Semester 1 Tuition Fee',       amount: 650000, method: 'Bank Transfer', status: 'Valid'  },
  { id: 4,  receiptNo: 'RCT-2025-0016', studentId: 'SFE-2024-0071', studentName: 'Eric Nzeyimana',    issueDate: '20 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 325000, method: 'Airtel Money',  status: 'Valid'  },
  { id: 5,  receiptNo: 'RCT-2025-0015', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    issueDate: '20 Jan 2025', description: 'Semester 1 Tuition Fee',       amount: 650000, method: 'Card',          status: 'Valid'  },
  { id: 6,  receiptNo: 'RCT-2025-0014', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', issueDate: '19 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 500000, method: 'Bank Transfer', status: 'Valid'  },
  { id: 7,  receiptNo: 'RCT-2025-0013', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',    issueDate: '19 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 325000, method: 'MTN MoMo',     status: 'Valid'  },
  { id: 8,  receiptNo: 'RCT-2025-0012', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha', issueDate: '18 Jan 2025', description: 'Semester 1 Remaining Balance', amount: 325000, method: 'MTN MoMo',     status: 'Valid'  },
  { id: 9,  receiptNo: 'RCT-2025-0011', studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',  issueDate: '17 Jan 2025', description: 'Levies & Fees Bundle',         amount: 110000, method: 'Card',          status: 'Valid'  },
  { id: 10, receiptNo: 'RCT-2025-0010', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    issueDate: '16 Jan 2025', description: 'Levies & Fees Bundle',         amount: 110000, method: 'Airtel Money',  status: 'Valid'  },
  { id: 11, receiptNo: 'RCT-2025-0009', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', issueDate: '16 Jan 2025', description: 'Remaining Balance',            amount: 220000, method: 'Card',          status: 'Valid'  },
  { id: 12, receiptNo: 'RCT-2025-0008', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',    issueDate: '15 Jan 2025', description: 'Administrative & ICT Fees',    amount: 70000,  method: 'Bank Transfer', status: 'Valid'  },
  { id: 13, receiptNo: 'RCT-2025-0007', studentId: 'SFE-2024-0023', studentName: 'Alice Mukeshimana', issueDate: '14 Jan 2025', description: 'Semester 1 Tuition Fee',       amount: 650000, method: 'MTN MoMo',     status: 'Valid'  },
  { id: 14, receiptNo: 'RCT-2025-0006', studentId: 'SFE-2024-0089', studentName: 'Aline Ingabire',    issueDate: '13 Jan 2025', description: 'Semester 1 Partial Payment',   amount: 325000, method: 'MTN MoMo',     status: 'Valid'  },
  { id: 15, receiptNo: 'RCT-2025-0005', studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase', issueDate: '12 Jan 2025', description: 'Registration Deposit',         amount: 110000, method: 'Card',          status: 'Voided', voidedAt: '15 Jan 2025', voidedReason: 'Duplicate transaction — student paid via MTN MoMo on the same day.' },
]

// ── Pending reconciliation (8) ────────────────────────────────────────────────

export interface PendingReconciliation {
  id:            number
  txnId:         string
  studentId:     string
  studentName:   string
  amount:        number
  method:        PaymentMethod
  gatewayStatus: GatewayStatus
  systemStatus:  TxnStatus
  dateTime:      string
  notes?:        string
}

export const PENDING_RECONCILIATION: PendingReconciliation[] = [
  { id: 1, txnId: 'TXN-2025-0017', studentId: 'SFE-2024-0058', studentName: 'Claudine Mukamana',  amount: 325000, method: 'MTN MoMo',     gatewayStatus: 'Pending',  systemStatus: 'Pending', dateTime: '21 Jan 2025 · 16:45' },
  { id: 2, txnId: 'TXN-2025-0011', studentId: 'SFE-2024-0017', studentName: 'Diane Umutoniwase',  amount: 150000, method: 'Airtel Money',  gatewayStatus: 'Failed',   systemStatus: 'Pending', dateTime: '18 Jan 2025 · 12:20' },
  { id: 3, txnId: 'TXN-2025-0004', studentId: 'SFE-2024-0042', studentName: 'Jean-Paul Mugisha',  amount: 110000, method: 'Airtel Money',  gatewayStatus: 'Pending',  systemStatus: 'Pending', dateTime: '14 Jan 2025 · 11:30' },
  { id: 4, txnId: 'TXN-2025-0009', studentId: 'SFE-2024-0071', studentName: 'Eric Nzeyimana',     amount: 110000, method: 'MTN MoMo',     gatewayStatus: 'Pending',  systemStatus: 'Pending', dateTime: '17 Jan 2025 · 09:15' },
  { id: 5, txnId: 'TXN-2025-0002', studentId: 'SFE-2024-0055', studentName: 'Solange Mutesi',     amount: 150000, method: 'Card',          gatewayStatus: 'Failed',   systemStatus: 'Pending', dateTime: '13 Jan 2025 · 15:15' },
  { id: 6, txnId: 'TXN-2025-0005', studentId: 'SFE-2024-0058', studentName: 'Claudine Mukamana',  amount: 325000, method: 'MTN MoMo',     gatewayStatus: 'Failed',   systemStatus: 'Pending', dateTime: '15 Jan 2025 · 14:20' },
  { id: 7, txnId: 'TXN-2025-0021', studentId: 'SFE-2024-0059', studentName: 'Rose Mukamugema',    amount: 325000, method: 'MTN MoMo',     gatewayStatus: 'Mismatch', systemStatus: 'Paid',    dateTime: '20 Jan 2025 · 09:30', notes: 'Gateway shows Paid but system shows a different amount.' },
  { id: 8, txnId: 'TXN-2025-0022', studentId: 'SFE-2024-0031', studentName: 'Bruno Ineza',        amount: 200000, method: 'Card',          gatewayStatus: 'Mismatch', systemStatus: 'Pending', dateTime: '19 Jan 2025 · 14:00', notes: 'Card gateway reference does not match system record.' },
]

export interface ResolvedReconciliation {
  id:         number
  txnId:      string
  studentId:  string
  studentName: string
  amount:     number
  resolution: ResolutionType
  resolvedBy: string
  resolvedAt: string
}

export const RESOLVED_RECONCILIATION: ResolvedReconciliation[] = [
  { id: 1, txnId: 'TXN-2025-0010', studentId: 'SFE-2024-0033', studentName: 'Patrick Habimana',  amount: 110000, resolution: 'Mark as Paid',    resolvedBy: 'Marie-Claire Ingabire', resolvedAt: '20 Jan 2025 · 10:15' },
  { id: 2, txnId: 'TXN-2024-0089', studentId: 'SFE-2024-0068', studentName: 'Fred Nkurunziza',   amount: 260000, resolution: 'Mark as Failed',  resolvedBy: 'Marie-Claire Ingabire', resolvedAt: '18 Jan 2025 · 14:30' },
  { id: 3, txnId: 'TXN-2024-0076', studentId: 'SFE-2024-0074', studentName: 'Alex Habimana',     amount: 200000, resolution: 'Request Refund',  resolvedBy: 'Marie-Claire Ingabire', resolvedAt: '15 Jan 2025 · 11:00' },
]

// ── Dashboard support data ────────────────────────────────────────────────────

export const OUTSTANDING_STUDENTS = [
  { id: 'SFE-2024-0059', name: 'Rose Mukamugema',   amount: 760000, daysOverdue: 52, hasHold: true  },
  { id: 'SFE-2024-0058', name: 'Claudine Mukamana', amount: 650000, daysOverdue: 45, hasHold: true  },
  { id: 'SFE-2024-0068', name: 'Fred Nkurunziza',   amount: 500000, daysOverdue: 38, hasHold: true  },
  { id: 'SFE-2024-0017', name: 'Diane Umutoniwase', amount: 260000, daysOverdue: 22, hasHold: false },
  { id: 'SFE-2024-0071', name: 'Eric Nzeyimana',    amount: 325000, daysOverdue: 15, hasHold: false },
]

export const TODAY_ACTIVITY = [
  { time: '08:15', studentName: 'Jean-Paul Mugisha',  amount: 325000, method: 'MTN MoMo'     as PaymentMethod },
  { time: '09:42', studentName: 'Diane Umutoniwase',  amount: 500000, method: 'Card'          as PaymentMethod },
  { time: '11:20', studentName: 'Patrick Habimana',   amount: 650000, method: 'Bank Transfer' as PaymentMethod },
  { time: '13:05', studentName: 'Eric Nzeyimana',     amount: 325000, method: 'Airtel Money'  as PaymentMethod },
  { time: '15:30', studentName: 'Aline Ingabire',     amount: 325000, method: 'MTN MoMo'     as PaymentMethod },
]

export const PAYMENT_CHART_DATA = [
  { method: 'MTN MoMo',     total: 18500000 },
  { method: 'Airtel Money', total: 12300000 },
  { method: 'Card',         total: 9800000  },
  { method: 'Bank Transfer',total: 4600000  },
]

export const AREA_CHART_DATA = [
  { date: '1 Jan', amount: 2100000  },
  { date: '3 Jan', amount: 3400000  },
  { date: '5 Jan', amount: 1800000  },
  { date: '7 Jan', amount: 4200000  },
  { date: '9 Jan', amount: 2900000  },
  { date: '11 Jan', amount: 5100000 },
  { date: '13 Jan', amount: 3700000 },
  { date: '15 Jan', amount: 6300000 },
  { date: '17 Jan', amount: 4800000 },
  { date: '19 Jan', amount: 7200000 },
  { date: '21 Jan', amount: 5600000 },
  { date: '22 Jan', amount: 2450000 },
]

// ── Shared badge helpers ──────────────────────────────────────────────────────

export function methodColors(method: PaymentMethod) {
  switch (method) {
    case 'MTN MoMo':     return { bg: 'var(--warning-bg)', color: 'var(--warning)'          }
    case 'Airtel Money': return { bg: 'var(--error-bg)',   color: 'var(--error)'             }
    case 'Card':         return { bg: 'var(--info-bg)',    color: 'var(--info)'              }
    case 'Bank Transfer':return { bg: 'var(--muted)',      color: 'var(--muted-foreground)'  }
  }
}

export function statusColors(status: TxnStatus | FeeAccountStatus | ReceiptStatus) {
  switch (status) {
    case 'Paid':        return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Valid':       return { bg: 'var(--success-bg)', color: 'var(--success)' }
    case 'Pending':     return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Outstanding': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Failed':      return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'On Hold':     return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Voided':      return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
    default:            return { bg: 'var(--muted)',      color: 'var(--muted-foreground)' }
  }
}

export function gatewayColors(status: GatewayStatus) {
  switch (status) {
    case 'Pending':  return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
    case 'Failed':   return { bg: 'var(--error-bg)',   color: 'var(--error)'   }
    case 'Mismatch': return { bg: 'var(--info-bg)',    color: 'var(--info)'    }
  }
}
