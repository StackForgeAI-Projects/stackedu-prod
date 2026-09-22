// API client — fees / payments domain
// All amounts are integer RWF — no floats anywhere in this file.

export async function getFeeStatement(studentId: string) {
  throw new Error(`getFeeStatement(${studentId}) — not implemented`)
}

export async function initiatePayment(data: unknown) {
  throw new Error('initiatePayment — not implemented')
}

export async function getPaymentHistory(studentId: string) {
  throw new Error(`getPaymentHistory(${studentId}) — not implemented`)
}
