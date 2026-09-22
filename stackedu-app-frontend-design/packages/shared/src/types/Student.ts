export type EnrolmentStatus = 'Active' | 'Suspended' | 'Transferred' | 'Graduated' | 'Withdrawn'

export interface PersonalDetails {
  firstName: string
  lastName: string
  dateOfBirth: string // ISO 8601 date
  gender: 'Male' | 'Female' | 'Other'
  nationalId: string
  phone: string
  email: string
  address: string
}

export interface AcademicRecord {
  semesterGpa: number
  cgpa: number
  totalCreditsEarned: number
  academicStanding: 'Good' | 'Probation' | 'Suspension'
}

export interface Student {
  id: string // e.g. STU-2024-0481
  institutionId: string
  personalDetails: PersonalDetails
  enrolmentStatus: EnrolmentStatus
  programme: string
  yearOfStudy: number
  feeHold: boolean
  academicRecord: AcademicRecord
  createdAt: string
}
