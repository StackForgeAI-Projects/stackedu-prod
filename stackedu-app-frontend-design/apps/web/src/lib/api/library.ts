// API client — e-library domain

export async function getResources(params?: { type?: string; subject?: string; department?: string }) {
  throw new Error('getResources — not implemented')
}

export async function getResource(id: string) {
  throw new Error(`getResource(${id}) — not implemented`)
}

export async function createResource(data: unknown) {
  throw new Error('createResource — not implemented')
}
