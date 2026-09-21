export interface Course {
  id: string
  code: string // e.g. SE401
  name: string
  credits: number
  department: string
  lecturerId: string
  prerequisiteIds: string[]
  semesterId: string
  institutionId: string
}
