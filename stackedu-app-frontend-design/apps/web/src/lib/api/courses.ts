// API client — courses domain

export async function getCourseList(params?: { semester?: string; department?: string }) {
  throw new Error('getCourseList — not implemented')
}

export async function getCourse(id: string) {
  throw new Error(`getCourse(${id}) — not implemented`)
}

export async function createCourse(data: unknown) {
  throw new Error('createCourse — not implemented')
}
