import {
  LayoutDashboard, CreditCard, Settings, Users, Receipt, BarChart2, RefreshCw, Megaphone,
} from 'lucide-react'

export const BURSAR_NAV = [
  { label: 'Dashboard', to: '/bursar/dashboard', icon: LayoutDashboard },
  { label: 'Payment Ledger', to: '/bursar/ledger', icon: CreditCard },
  { label: 'Fee Structure', to: '/bursar/fee-structure', icon: Settings },
  { label: 'Student Accounts', to: '/bursar/student-accounts', icon: Users },
  { label: 'Receipts', to: '/bursar/receipts', icon: Receipt },
  { label: 'Fee Messages', to: '/bursar/announcements', icon: Megaphone },
  { label: 'Reports', to: '/bursar/reports', icon: BarChart2 },
  { label: 'Reconciliation', to: '/bursar/reconciliation', icon: RefreshCw },
]
