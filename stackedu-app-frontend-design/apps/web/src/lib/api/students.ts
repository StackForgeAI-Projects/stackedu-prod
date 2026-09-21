// API client — students domain
// All functions will use TanStack Query (useQuery / useMutation) at the call site.
// TODO: wire up to the Hono.js API once the backend is built.

export async function getStudent(id: string) {
  throw new Error(`getStudent(${id}) — not implemented`)
}

export async function getStudentList(params?: { programme?: string; year?: number; status?: string }) {
  throw new Error('getStudentList — not implemented')
}

export async function updateStudent(id: string, data: unknown) {
  throw new Error(`updateStudent(${id}) — not implemented`)
}
