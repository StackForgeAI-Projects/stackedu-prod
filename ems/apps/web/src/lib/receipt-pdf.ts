import type { PaymentMethod } from '@stackedu/shared'
import { brandColorValue, parseHexColor } from '@/lib/brand-theme'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export interface ReceiptPdfInput {
  receiptNumber: string
  reference: string
  amount: number
  method: PaymentMethod
  paidAt: string | null
  studentName: string
  studentNumber: string
  institutionName: string
  description: string
  verificationCode?: string | null
  status?: 'Valid' | 'Voided'
}

function safeFileName(studentName: string, description: string): string {
  const base = `${studentName} - ${description}`.replace(/[\\/:*?"<>|]/g, '-').trim()
  return `${base.slice(0, 120)}.pdf`
}

function methodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'MoMo': return 'MTN MoMo'
    case 'Airtel': return 'Airtel Money'
    case 'Card': return 'Card'
    case 'BankTransfer': return 'Bank transfer'
    default: return method
  }
}

export async function downloadReceiptPdf(input: ReceiptPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  const brand = parseHexColor(brandColorValue()) ?? { r: 15, g: 189, b: 59 }
  doc.setFillColor(brand.r, brand.g, brand.b)
  doc.rect(0, 0, pageWidth, 42, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('StackEDU', 16, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Official payment receipt', 16, 27)

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(10)
  doc.text(input.institutionName, pageWidth - 16, 18, { align: 'right' })
  doc.text(input.receiptNumber, pageWidth - 16, 25, { align: 'right' })

  doc.setDrawColor(230, 230, 230)
  doc.roundedRect(14, 52, pageWidth - 28, 118, 4, 4, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text(formatCurrency(input.amount), 22, 72)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(input.description, 22, 82)

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(10)
  const rows: Array<[string, string]> = [
    ['Student', input.studentName],
    ['Student ID', input.studentNumber],
    ['Payment reference', input.reference],
    ['Method', methodLabel(input.method)],
    ['Paid on', input.paidAt ? formatDateTime(input.paidAt) : 'Pending'],
  ]
  if (input.verificationCode) rows.push(['Verification code', input.verificationCode])
  if (input.status === 'Voided') rows.push(['Status', 'VOIDED'])

  let y = 96
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 22, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 62, y)
    y += 10
  }

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('This receipt confirms payment recorded in StackEDU. Keep it for your records.', 22, 178)

  doc.save(safeFileName(input.studentName, input.description))
}
