export type ResourceType = 'Ebook' | 'Journal' | 'ResearchPaper' | 'CoursePack' | 'Video'

export interface AccessScope {
  programmes: string[] // empty = all programmes
  departments: string[] // empty = all departments
  yearGroups: number[]  // empty = all years
}

export interface LibraryResource {
  id: string
  title: string
  author: string
  isbn?: string
  type: ResourceType
  subjectTags: string[]
  accessScope: AccessScope
  fileUrl: string // Cloudflare R2 URL
  uploadedBy: string // Librarian user ID
  institutionId: string
  createdAt: string
}
