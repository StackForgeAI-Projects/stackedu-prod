import { LayoutDashboard, Library, BookMarked, Inbox, BarChart2, Bell } from 'lucide-react'

export const LIBRARIAN_NAV = [
  { label: 'Dashboard', to: '/librarian/dashboard', icon: LayoutDashboard },
  { label: 'Resource Catalogue', to: '/librarian/catalogue', icon: Library },
  { label: 'Collections', to: '/librarian/collections', icon: BookMarked },
  { label: 'Resource Requests', to: '/librarian/requests', icon: Inbox },
  { label: 'Analytics', to: '/librarian/analytics', icon: BarChart2 },
  { label: 'Notifications', to: '/librarian/notifications', icon: Bell },
]
