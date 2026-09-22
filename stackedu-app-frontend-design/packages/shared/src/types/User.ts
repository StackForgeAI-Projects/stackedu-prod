export type UserRole =
  | 'Student'
  | 'Lecturer'
  | 'Bursar'
  | 'AcademicAdmin'
  | 'Librarian'
  | 'ICTManager'

export interface User {
  id: string
  role: UserRole
  institutionId: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string // ISO 8601
}
