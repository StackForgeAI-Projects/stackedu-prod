// API client — results domain

export async function getResults(studentId: string, semesterId?: string) {
  throw new Error(`getResults(${studentId}) — not implemented`)
}

export async function submitResults(courseId: string, data: unknown) {
  throw new Error(`submitResults(${courseId}) — not implemented`)
}

export async function publishResults(semesterId: string) {
  throw new Error(`publishResults(${semesterId}) — not implemented`)
}
