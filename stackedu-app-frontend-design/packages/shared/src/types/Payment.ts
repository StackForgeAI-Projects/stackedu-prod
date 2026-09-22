export type PaymentMethod = 'MoMo' | 'Airtel' | 'Card' | 'BankTransfer'
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Voided'

export interface Payment {
  id: string // e.g. PAY-002841
  studentId: string
  institutionId: string
  /** Integer Rwandan Francs — no floats, no decimals */
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  receiptUrl: string | null
  reference: string | null // gateway reference
  createdAt: string
}
