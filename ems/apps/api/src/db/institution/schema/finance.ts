import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { money, primaryKeyColumn, timestamps } from '../../columns'
import { programmes, semesters } from './academic'
import {
  invoiceStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  reconciliationStatusEnum,
} from './enums'
import { users } from './people'
import { students } from './students'

/**
 * Finance.
 *
 * Every amount is a whole number of Rwandan Francs held in a bigint. Nothing
 * here is ever deleted — a correction is a new row, so the ledger can always be
 * replayed and explained to an auditor.
 */

export const feeStructures = pgTable(
  'fee_structures',
  {
    id: primaryKeyColumn(),
    name: text('name').notNull(),
    programmeId: uuid('programme_id').references(() => programmes.id, { onDelete: 'cascade' }),
    /** Null applies the structure to every year of the programme. */
    yearOfStudy: integer('year_of_study'),
    semesterId: uuid('semester_id').references(() => semesters.id, { onDelete: 'cascade' }),
    totalAmount: money('total_amount').notNull().default(0),
    currency: text('currency').notNull().default('RWF'),
    isActive: boolean('is_active').notNull().default(true),
    effectiveFrom: date('effective_from'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('fee_structures_programme_idx').on(t.programmeId, t.yearOfStudy)],
)

export const feeItems = pgTable(
  'fee_items',
  {
    id: primaryKeyColumn(),
    feeStructureId: uuid('fee_structure_id')
      .notNull()
      .references(() => feeStructures.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** e.g. Tuition, Accommodation, Library, Examination. */
    category: text('category').notNull(),
    amount: money('amount').notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    /** Payment deadline set by the Bursar for this fee item. */
    dueDate: date('due_date'),
    ...timestamps(),
  },
  (t) => [index('fee_items_structure_idx').on(t.feeStructureId)],
)

/**
 * The running position for one student: what they owe in total and what they
 * have paid. Kept as a summary row so a fee check never has to sum the whole
 * ledger during registration.
 */
export const studentFeeAccounts = pgTable(
  'student_fee_accounts',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    totalCharged: money('total_charged').notNull().default(0),
    totalPaid: money('total_paid').notNull().default(0),
    /** Negative means the student is in credit. */
    balance: money('balance').notNull().default(0),
    currency: text('currency').notNull().default('RWF'),
    lastPaymentAt: timestamp('last_payment_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('student_fee_accounts_student_key').on(t.studentId)],
)

export const invoices = pgTable(
  'invoices',
  {
    id: primaryKeyColumn(),
    invoiceNumber: text('invoice_number').notNull(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    semesterId: uuid('semester_id').references(() => semesters.id, { onDelete: 'set null' }),
    feeStructureId: uuid('fee_structure_id').references(() => feeStructures.id, {
      onDelete: 'set null',
    }),
    amountDue: money('amount_due').notNull(),
    amountPaid: money('amount_paid').notNull().default(0),
    status: invoiceStatusEnum('status').notNull().default('Draft'),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'string' }),
    dueDate: date('due_date'),
    /** Snapshot of the fee items at issue time, so later price changes cannot alter an issued invoice. */
    lineItems: jsonb('line_items').$type<Array<{ name: string; amount: number; dueDate: string }>>(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('invoices_number_key').on(t.invoiceNumber),
    index('invoices_student_idx').on(t.studentId, t.status),
    index('invoices_due_idx').on(t.dueDate),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: primaryKeyColumn(),
    /** Printed on the receipt, e.g. PAY-002841. */
    reference: text('reference').notNull(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    amount: money('amount').notNull(),
    currency: text('currency').notNull().default('RWF'),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('Pending'),
    gatewayReference: text('gateway_reference'),
    /** Whole gateway response, kept verbatim for dispute resolution. */
    gatewayPayload: jsonb('gateway_payload').$type<Record<string, unknown>>(),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    failureReason: text('failure_reason'),
    voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
    voidedAt: timestamp('voided_at', { withTimezone: true, mode: 'string' }),
    voidReason: text('void_reason'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('payments_reference_key').on(t.reference),
    index('payments_student_idx').on(t.studentId, t.createdAt),
    index('payments_status_idx').on(t.status),
    index('payments_gateway_ref_idx').on(t.gatewayReference),
  ],
)

/**
 * One row per attempt to charge, keyed by an idempotency key.
 *
 * This is what stops a student who taps "Pay" three times from being charged
 * three times: the second and third attempts find the existing key and return
 * the original outcome instead of contacting the gateway again.
 */
export const paymentAttempts = pgTable(
  'payment_attempts',
  {
    id: primaryKeyColumn(),
    paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
    idempotencyKey: text('idempotency_key').notNull(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    amount: money('amount').notNull(),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('Pending'),
    requestPayload: jsonb('request_payload').$type<Record<string, unknown>>(),
    responsePayload: jsonb('response_payload').$type<Record<string, unknown>>(),
    attemptNumber: integer('attempt_number').notNull().default(1),
    errorMessage: text('error_message'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('payment_attempts_idempotency_key').on(t.idempotencyKey),
    index('payment_attempts_payment_idx').on(t.paymentId),
  ],
)

export const receipts = pgTable(
  'receipts',
  {
    id: primaryKeyColumn(),
    receiptNumber: text('receipt_number').notNull(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'restrict' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    amount: money('amount').notNull(),
    fileKey: text('file_key'),
    /** Lets anyone confirm a presented receipt is genuine. */
    verificationCode: text('verification_code'),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('receipts_number_key').on(t.receiptNumber),
    index('receipts_student_idx').on(t.studentId),
    index('receipts_payment_idx').on(t.paymentId),
  ],
)

export const feeHolds = pgTable(
  'fee_holds',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    amountOutstanding: money('amount_outstanding').notNull().default(0),
    /** What the hold prevents, e.g. Registration, Results, Transcript. */
    blocks: text('blocks').array().notNull().default([]),
    placedBy: uuid('placed_by').references(() => users.id, { onDelete: 'set null' }),
    placedAt: timestamp('placed_at', { withTimezone: true, mode: 'string' }),
    releasedBy: uuid('released_by').references(() => users.id, { onDelete: 'set null' }),
    releasedAt: timestamp('released_at', { withTimezone: true, mode: 'string' }),
    releaseReason: text('release_reason'),
    ...timestamps(),
  },
  (t) => [index('fee_holds_student_idx').on(t.studentId, t.releasedAt)],
)

/**
 * Money that arrived at the bank or mobile money account but has not yet been
 * matched to a student. The bursar works this queue down each day.
 */
export const reconciliationRecords = pgTable(
  'reconciliation_records',
  {
    id: primaryKeyColumn(),
    externalReference: text('external_reference').notNull(),
    source: text('source').notNull(),
    amount: money('amount').notNull(),
    transactionDate: timestamp('transaction_date', { withTimezone: true, mode: 'string' }).notNull(),
    payerName: text('payer_name'),
    payerPhone: text('payer_phone'),
    narration: text('narration'),
    status: reconciliationStatusEnum('status').notNull().default('Pending'),
    matchedPaymentId: uuid('matched_payment_id').references(() => payments.id, {
      onDelete: 'set null',
    }),
    matchedStudentId: uuid('matched_student_id').references(() => students.id, {
      onDelete: 'set null',
    }),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('reconciliation_external_ref_key').on(t.externalReference, t.source),
    index('reconciliation_status_idx').on(t.status, t.transactionDate),
  ],
)

export const refunds = pgTable(
  'refunds',
  {
    id: primaryKeyColumn(),
    reference: text('reference').notNull(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'restrict' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    amount: money('amount').notNull(),
    reason: text('reason').notNull(),
    status: paymentStatusEnum('status').notNull().default('Pending'),
    /** Refunds always need a second person to approve them. */
    requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
    gatewayReference: text('gateway_reference'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('refunds_reference_key').on(t.reference),
    index('refunds_student_idx').on(t.studentId),
  ],
)
