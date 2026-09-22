export interface Mark {
  component: string // e.g. "Coursework", "Final Exam"
  score: number
  outOf: number
  weight: number // percentage weight in final grade
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface Result {
  studentId: string
  courseId: string
  semesterId: string
  marks: Mark[]
  grade: Grade
  gpa: number
  publishedAt: string | null
  publishedBy: string | null // User ID of Academic Admin who published
}
