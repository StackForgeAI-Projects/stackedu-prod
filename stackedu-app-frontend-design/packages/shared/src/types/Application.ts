export type ApplicationStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'DocumentsRequested'
  | 'Accepted'
  | 'Rejected'

export interface ApplicantDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  nationalId: string
  previousQualification: string
}

export interface ApplicationDocument {
  name: string
  fileUrl: string
  uploadedAt: string
}

export interface Application {
  id: string
  institutionId: string
  applicantDetails: ApplicantDetails
  programmeApplied: string
  documents: ApplicationDocument[]
  status: ApplicationStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}
