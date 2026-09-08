import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, desc, eq } from 'drizzle-orm'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import {
  academicYears,
  departments,
  faculties,
  programmes,
  semesters,
} from '../src/db/institution/schema/academic'
import {
  feeItems,
  feeStructures,
  invoices,
  payments,
  receipts,
  reconciliationRecords,
  studentFeeAccounts,
} from '../src/db/institution/schema/finance'
import { studentProfiles, students } from '../src/db/institution/schema/students'
import { AppError } from '../src/lib/errors'
import {
  createBursarAnnouncement,
  createBursarFeeItem,
  getBursarDashboard,
  getBursarProfile,
  getBursarStudentAccount,
  issueSemesterFeeInvoices,
  listBursarFeeItems,
  listBursarFeeMessages,
  listBursarNotifications,
  listBursarPayments,
  listBursarSemesters,
  listBursarStudentAccounts,
  recordBursarManualPayment,
  releaseBursarFeeHold,
  setBursarFeeHold,
  voidBursarReceipt,
} from '../src/services/bursar'
import { notifyUserIds } from '../src/services/role-notifications'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('bursar portal', () => {
  let platform: TestPlatform
  let institutionId: string
  let bursar: { id: string; email: string; role: 'Bursar' }
  let studentId: string
  let studentUserId: string
  let receiptId: string
  let semesterId: string
  let programmeId: string
  let academicYearId: string

  beforeAll(async () => {
    platform = await createTestPlatform()

    const institution = await provisionInstitution({
      name: 'Bursar Test University',
      slug: uniqueSlug('bursar'),
      shortName: 'BTU',
      contactEmail: 'bursar@btu.test',
    })
    institutionId = institution.institutionId

    const bursarUser = await createUser({
      institutionId,
      email: 'bursar@btu.test',
      fullName: 'Test Bursar',
      role: 'Bursar',
      password: 'Bursar#2026',
    })
    bursar = { id: bursarUser.id, email: bursarUser.email, role: 'Bursar' }

    const studentUser = await createUser({
      institutionId,
      email: 'student@btu.test',
      fullName: 'Fee Student',
      role: 'Student',
      password: 'Student#2026',
    })

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'BUS', name: 'Business' }).returning()
    const [department] = await db
      .insert(departments)
      .values({ facultyId: faculty!.id, code: 'FIN', name: 'Finance Department' })
      .returning()
    const [programme] = await db
      .insert(programmes)
      .values({
        departmentId: department!.id,
        code: 'BBA',
        name: 'Business Administration',
        level: 'Bachelor',
        durationYears: 3,
        totalCreditsRequired: 360,
      })
      .returning()
    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning()
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
      })
      .returning()
    semesterId = semester!.id
    academicYearId = year!.id
    programmeId = programme!.id

    const [student] = await db
      .insert(students)
      .values({
        userId: studentUser.id,
        studentNumber: 'BTU-2026-001',
        programmeId: programme!.id,
        yearOfStudy: 1,
      })
      .returning()
    studentId = student!.id
    studentUserId = studentUser.id

    await db.insert(studentProfiles).values({
      studentId: student!.id,
      firstName: 'Fee',
      lastName: 'Student',
    })

    await db.insert(studentFeeAccounts).values({
      studentId: student!.id,
      totalCharged: 450_000,
      totalPaid: 200_000,
      balance: 250_000,
    })

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber: 'INV-BTU-2026-0001',
        studentId: student!.id,
        amountDue: 450_000,
        amountPaid: 200_000,
        status: 'PartiallyPaid',
        issuedAt: new Date().toISOString(),
        dueDate: '2026-12-31',
        lineItems: [{ name: 'Business Administration — Tuition Fee', amount: 450_000, dueDate: '2026-12-31' }],
      })
      .returning()

    const [payment] = await db
      .insert(payments)
      .values({
        reference: 'PAY-BTU-2026-0001',
        studentId: student!.id,
        invoiceId: invoice!.id,
        amount: 200_000,
        method: 'MoMo',
        status: 'Completed',
        paidAt: new Date().toISOString(),
      })
      .returning()

    const [receipt] = await db
      .insert(receipts)
      .values({
        receiptNumber: 'RCT-BTU-2026-0001',
        paymentId: payment!.id,
        studentId: student!.id,
        amount: 200_000,
        issuedAt: new Date().toISOString(),
        verificationCode: 'VR-BTU-001',
      })
      .returning()
    receiptId = receipt!.id

    await db.insert(reconciliationRecords).values({
      externalReference: 'GW-MTN-TEST-001',
      source: 'MTNMoMo',
      amount: 50_000,
      transactionDate: new Date().toISOString(),
      payerName: 'Unknown Payer',
      status: 'Pending',
    })
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('returns the bursar profile for a bursar account', async () => {
    const profile = await getBursarProfile(institutionId, bursar.id)
    expect(profile.fullName).toBe('Test Bursar')
    expect(profile.role).toBe('Bursar')
    expect(profile.staffId).toContain('BUR-')
  })

  it('rejects bursar endpoints for non-bursar roles', async () => {
    const studentUser = await createUser({
      institutionId,
      email: 'other-student@btu.test',
      fullName: 'Other Student',
      role: 'Student',
      password: 'Student#2026',
    })

    await expect(getBursarProfile(institutionId, studentUser.id)).rejects.toBeInstanceOf(AppError)
  })

  it('lists student accounts with outstanding balances', async () => {
    const accounts = await listBursarStudentAccounts(institutionId, bursar.id)
    expect(accounts.some((row) => row.studentId === studentId && row.outstanding === 250_000)).toBe(true)
  })

  it('records a manual payment and updates the account balance', async () => {
    const updated = await recordBursarManualPayment(institutionId, bursar.id, bursar, studentId, {
      amount: 100_000,
      method: 'BankTransfer',
      description: 'Bank transfer top-up',
      notes: 'Verified with bank statement',
    })

    expect(updated.totalPaid).toBe(300_000)
    expect(updated.outstanding).toBe(150_000)

    const ledger = await listBursarPayments(institutionId, bursar.id)
    expect(ledger.some((row) => row.amount === 100_000 && row.method === 'BankTransfer')).toBe(true)
  })

  it('places and releases a fee hold on a student account', async () => {
    const held = await setBursarFeeHold(institutionId, bursar.id, bursar, studentId, {
      reason: 'Outstanding semester fees',
    })
    expect(held.hasHold).toBe(true)
    expect(held.status).toBe('On Hold')

    const released = await releaseBursarFeeHold(
      institutionId,
      bursar.id,
      bursar,
      studentId,
      'Partial payment received',
    )
    expect(released.hasHold).toBe(false)

    const db = await getInstitutionDb(institutionId)
    const [row] = await db.select({ feeHold: students.feeHold }).from(students).where(eq(students.id, studentId))
    expect(row?.feeHold).toBe(false)
  })

  it('voids a receipt and reverses the student balance', async () => {
    const before = await getBursarStudentAccount(institutionId, bursar.id, studentId)
    const receipt = await voidBursarReceipt(institutionId, bursar.id, bursar, receiptId, 'Issued in error')

    expect(receipt.status).toBe('Voided')

    const after = await getBursarStudentAccount(institutionId, bursar.id, studentId)
    expect(after.totalPaid).toBeLessThan(before.totalPaid)
  })

  it('builds a dashboard from live finance records', async () => {
    const dashboard = await getBursarDashboard(institutionId, bursar.id)
    expect(dashboard.stats.outstandingBalances).toBeGreaterThan(0)
    expect(dashboard.recentPayments.length).toBeGreaterThan(0)
  })

  it('lists bursar notifications for the signed-in bursar', async () => {
    const db = await getInstitutionDb(institutionId)
    await notifyUserIds(db, [bursar.id], {
      title: 'Reconciliation mismatch',
      body: 'One MTN MoMo payment needs review.',
      category: 'Reconciliation',
      actionUrl: '/bursar/reconciliation',
    })

    const notifications = await listBursarNotifications(institutionId, bursar.id)
    expect(notifications.some((row) => row.title === 'Reconciliation mismatch')).toBe(true)
  })

  it('sends a fee message to a selected student', async () => {
    const result = await createBursarAnnouncement(institutionId, bursar.id, bursar, {
      title: 'Semester fee reminder',
      body: 'Please settle your outstanding balance before registration closes.',
      audience: { studentIds: [studentId] },
    })
    expect(result.recipientCount).toBe(1)
    expect(result.audienceLabel).toBe('Fee Student')

    const messages = await listBursarFeeMessages(institutionId, bursar.id)
    const message = messages.find((row) => row.title === 'Semester fee reminder')
    expect(message).toBeDefined()
    expect(message?.audienceLabel).toBe('Fee Student')
  })

  it('completes sandbox student payments through the gateway', async () => {
    const { payStudentFees } = await import('../src/services/student')
    const { initiatePaymentGateway } = await import('../src/services/payment-gateway')

    for (const method of ['MoMo', 'Airtel', 'Card'] as const) {
      const gateway = await initiatePaymentGateway(institutionId, method, `PAY-TEST-${method}`)
      expect(gateway.completeImmediately).toBe(true)
    }

    const bank = await initiatePaymentGateway(institutionId, 'BankTransfer', 'PAY-TEST-BANK')
    expect(bank.completeImmediately).toBe(false)

    const fees = await payStudentFees(institutionId, studentUserId, {
      amount: 25_000,
      method: 'MoMo',
      payerPhone: '0780000000',
    })
    expect(fees.payments.some((row) => row.amount === 25_000 && row.status === 'Completed')).toBe(true)
  })

  it('enforces full-only tuition policy when ICT disables instalments', async () => {
    const db = await getInstitutionDb(institutionId)
    const { writePaymentPolicy } = await import('../src/lib/payment-policy-store')
    const { payStudentFees } = await import('../src/services/student')

    await writePaymentPolicy(db, {
      rules: [
        { feeKind: 'ApplicationFee', mode: 'FullOnly' },
        { feeKind: 'TuitionFee', mode: 'FullOnly' },
        { feeKind: 'Levy', mode: 'PartialAllowed' },
        { feeKind: 'Other', mode: 'PartialAllowed' },
      ],
    })

    await expect(
      payStudentFees(institutionId, studentUserId, {
        amount: 25_000,
        method: 'MoMo',
        payerPhone: '0780000000',
      }),
    ).rejects.toMatchObject({ message: 'This fee must be paid in full.' })
  })

  it('lists institution academic years for the bursar fee structure', async () => {
    const { listBursarAcademicYears } = await import('../src/services/bursar')
    const years = await listBursarAcademicYears(institutionId, bursar.id)
    expect(years.some((year) => year.name === '2026/2027' && year.isCurrent)).toBe(true)
  })

  it('lists semesters for an academic year', async () => {
    const semesters = await listBursarSemesters(institutionId, bursar.id, academicYearId)
    expect(semesters.some((semester) => semester.name === 'Semester 1' && semester.isCurrent)).toBe(true)
  })

  it('lists fee items with date added and due date fields', async () => {
    const db = await getInstitutionDb(institutionId)
    const [structure] = await db
      .insert(feeStructures)
      .values({
        name: 'Fee list test',
        programmeId: (await db.select({ id: programmes.id }).from(programmes).limit(1))[0]!.id,
        semesterId,
        isActive: true,
      })
      .returning()
    await db.insert(feeItems).values({
      feeStructureId: structure!.id,
      name: 'Tuition Fee',
      category: 'Tuition',
      amount: 450_000,
      isMandatory: true,
      dueDate: '2026-12-31',
    })

    const items = await listBursarFeeItems(institutionId, bursar.id)
    const tuition = items.find((row) => row.name === 'Tuition Fee' && row.amount === 450_000)
    expect(tuition).toBeDefined()
    expect(tuition?.dueDate).toBe('2026-12-31')
    expect(tuition?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
    expect(tuition?.academicYearName).toBe('2026/2027')
    expect(tuition?.semesterName).toBe('Semester 1')
  })

  it('charges matching students immediately when a fee item is created', async () => {
    const db = await getInstitutionDb(institutionId)
    const csStudentUser = await createUser({
      institutionId,
      email: 'cs-student@btu.test',
      fullName: 'CS Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const [csStudent] = await db
      .insert(students)
      .values({
        userId: csStudentUser.id,
        studentNumber: 'BTU-2026-003',
        programmeId,
        yearOfStudy: 1,
      })
      .returning()

    await createBursarFeeItem(institutionId, bursar.id, bursar, {
      name: 'Computer Lab Fee',
      category: 'Levy',
      amount: 35_000,
      dueDate: '2026-11-30',
      programmeId,
      yearOfStudy: 1,
      semesterId,
    })

    const [invoice] = await db
      .select({ lineItems: invoices.lineItems, amountDue: invoices.amountDue })
      .from(invoices)
      .where(and(eq(invoices.studentId, csStudent!.id), eq(invoices.semesterId, semesterId)))
      .limit(1)

    expect(invoice?.amountDue).toBe(35_000)
    expect(invoice?.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Computer Lab Fee', amount: 35_000, dueDate: '2026-11-30' }),
      ]),
    )
  })

  it('adds a new fee to an existing semester invoice when another fee item is created', async () => {
    const db = await getInstitutionDb(institutionId)
    const mergeStudentUser = await createUser({
      institutionId,
      email: 'merge-student@btu.test',
      fullName: 'Merge Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const [mergeStudent] = await db
      .insert(students)
      .values({
        userId: mergeStudentUser.id,
        studentNumber: 'BTU-2026-004',
        programmeId,
        yearOfStudy: 1,
      })
      .returning()

    await createBursarFeeItem(institutionId, bursar.id, bursar, {
      name: 'Semester Tuition',
      category: 'Tuition',
      amount: 120_000,
      dueDate: '2026-12-15',
      programmeId,
      yearOfStudy: 1,
      semesterId,
    })

    await createBursarFeeItem(institutionId, bursar.id, bursar, {
      name: 'Library Levy',
      category: 'Levy',
      amount: 15_000,
      dueDate: '2026-12-20',
      programmeId,
      yearOfStudy: 1,
      semesterId,
    })

    const [invoice] = await db
      .select({ lineItems: invoices.lineItems, amountDue: invoices.amountDue })
      .from(invoices)
      .where(and(eq(invoices.studentId, mergeStudent!.id), eq(invoices.semesterId, semesterId)))
      .limit(1)

    expect(invoice?.amountDue).toBe(135_000)
    expect(invoice?.lineItems).toHaveLength(2)
  })

  it('issues semester invoices from active fee items', async () => {
    const db = await getInstitutionDb(institutionId)
    await db.update(feeStructures).set({ isActive: false })

    const [structure] = await db
      .insert(feeStructures)
      .values({
        name: 'BBA Semester fees',
        programmeId: (await db.select({ id: programmes.id }).from(programmes).limit(1))[0]!.id,
        semesterId,
        isActive: true,
      })
      .returning()
    await db.insert(feeItems).values({
      feeStructureId: structure!.id,
      name: 'Tuition Fee',
      category: 'Tuition',
      amount: 50_000,
      isMandatory: true,
      dueDate: '2026-12-31',
    })

    const secondStudentUser = await createUser({
      institutionId,
      email: 'second-student@btu.test',
      fullName: 'Second Student',
      role: 'Student',
      password: 'Student#2026',
    })
    const [programme] = await db.select({ id: programmes.id }).from(programmes).limit(1)
    await db.insert(students).values({
      userId: secondStudentUser.id,
      studentNumber: 'BTU-2026-002',
      programmeId: programme!.id,
      yearOfStudy: 1,
    })

    const result = await issueSemesterFeeInvoices(institutionId, bursar.id, bursar)
    expect(result.issuedCount).toBeGreaterThan(0)

    const [issuedInvoice] = await db
      .select({ lineItems: invoices.lineItems, dueDate: invoices.dueDate })
      .from(invoices)
      .innerJoin(students, eq(students.id, invoices.studentId))
      .where(eq(students.studentNumber, 'BTU-2026-002'))
      .limit(1)
    expect(issuedInvoice?.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Tuition Fee', amount: 50_000, dueDate: '2026-12-31' }),
      ]),
    )
    expect(issuedInvoice?.dueDate).toBe('2026-12-31')
  })

  it('rejects semester issue when a fee item has no due date', async () => {
    const db = await getInstitutionDb(institutionId)
    await db.update(feeStructures).set({ isActive: false })

    const [structure] = await db
      .insert(feeStructures)
      .values({
        name: 'Missing due date fees',
        programmeId: (await db.select({ id: programmes.id }).from(programmes).limit(1))[0]!.id,
        semesterId,
        isActive: true,
      })
      .returning()
    await db.insert(feeItems).values({
      feeStructureId: structure!.id,
      name: 'Library Levy',
      category: 'Levy',
      amount: 10_000,
      isMandatory: true,
    })

    await expect(issueSemesterFeeInvoices(institutionId, bursar.id, bursar)).rejects.toMatchObject({
      message: expect.stringContaining('due date'),
    })
  })

  it('schedules fee due reminder windows and sends in-app notifications', async () => {
    const { feeDueRemindersDueNow } = await import('../src/lib/fee-due-reminders')
    const { processFeeDueReminders } = await import('../src/lib/fee-due-reminders')
    const { notifications } = await import('../src/db/institution/schema/communication')

    const dueDate = '2026-12-31'
    const dueMs = new Date(`${dueDate}T23:59:59.999Z`).getTime()
    const weekBefore = new Date(dueMs - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
    expect(feeDueRemindersDueNow(weekBefore, dueDate)).toContain('7d')

    const db = await getInstitutionDb(institutionId)
    await db.insert(invoices).values({
      invoiceNumber: 'INV-BTU-REMINDER-001',
      studentId,
      amountDue: 50_000,
      amountPaid: 0,
      status: 'Issued',
      issuedAt: new Date().toISOString(),
      dueDate,
      lineItems: [{ name: 'Tuition Fee', amount: 50_000, dueDate }],
    })

    const sent = await processFeeDueReminders(db, weekBefore)
    expect(sent).toBeGreaterThan(0)

    const [note] = await db
      .select({ title: notifications.title })
      .from(notifications)
      .where(eq(notifications.userId, studentUserId))
      .orderBy(desc(notifications.createdAt))
      .limit(1)
    expect(note?.title).toContain('1 week')
  })
})
