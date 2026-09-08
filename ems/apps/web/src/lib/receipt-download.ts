import type { PaymentMethod } from '@stackedu/shared'
import { downloadReceiptPdf } from '@/lib/receipt-pdf'

export interface ReceiptDownloadSource {
  receiptNumber: string
  reference: string
  amount: number
  method: PaymentMethod
  paidAt: string | null
  studentName: string
  studentNumber: string
  description: string
  institutionName: string
  verificationCode?: string | null
  status?: 'Valid' | 'Voided'
}

export async function downloadReceiptDocument(source: ReceiptDownloadSource): Promise<void> {
  await downloadReceiptPdf({
    receiptNumber: source.receiptNumber,
    reference: source.reference,
    amount: source.amount,
    method: source.method,
    paidAt: source.paidAt,
    studentName: source.studentName,
    studentNumber: source.studentNumber,
    institutionName: source.institutionName,
    description: source.description,
    verificationCode: source.verificationCode,
    status: source.status,
  })
}
