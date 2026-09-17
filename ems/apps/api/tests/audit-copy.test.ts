import { describe, expect, it } from 'vitest'
import { auditActionLabel, auditSummary, buildAuditDetail } from '@stackedu/shared'

/**
 * The audit log is read by people, not machines. Every entry has to say what
 * happened in words a registrar would use, and the label it is grouped under
 * has to stay the same for every entry of that kind.
 */
describe('audit log wording', () => {
  it('describes a sign-in, a sign-out, and an idle sign-out differently', () => {
    expect(auditSummary({ action: 'session.login', metadata: { method: 'password' } }))
      .toBe('Signed in with a password')
    expect(auditSummary({ action: 'session.login', metadata: { method: 'two-factor' } }))
      .toBe('Signed in with a password and an authenticator code')
    expect(auditSummary({ action: 'session.logout' })).toBe('Signed out')
    expect(auditSummary({ action: 'session.logout.inactivity' }))
      .toBe('Signed out automatically after being idle')
  })

  it('names the record that was touched, not just the action', () => {
    expect(auditSummary({
      action: 'course.create',
      targetType: 'course',
      metadata: { code: 'MTH101', name: 'Calculus' },
    })).toBe('Created the course MTH101 — Calculus')

    expect(auditSummary({
      action: 'fee_hold.place',
      targetType: 'student',
      metadata: { studentNumber: 'SFU/2026/001' },
    })).toBe('Placed a finance hold on student SFU/2026/001')

    expect(auditSummary({
      action: 'announcement.create',
      targetType: 'announcement',
      metadata: { title: 'Exams start Monday', recipientCount: 1 },
    })).toBe('Published the announcement "Exams start Monday" to 1 person')
  })

  /**
   * The filter dropdown groups on this, so it must not carry any detail that
   * varies between two entries of the same kind.
   */
  it('gives a stable label that never mentions a specific record', () => {
    expect(auditActionLabel('settings.logo.upload')).toBe('Changed the institution logo')
    expect(auditActionLabel('payment.record_manual')).toBe('Recorded a payment by hand')
    expect(auditActionLabel('student.withdraw')).toBe('Withdrew a student')
  })

  it('falls back to readable words for an action it has never seen', () => {
    expect(auditActionLabel('library.loan_overdue')).toBe('Library loan overdue')
  })

  it('explains a colour change in the entry detail', () => {
    const detail = buildAuditDetail({
      action: 'settings.update',
      actorEmail: 'ict@sfu.ac.rw',
      actorRole: 'ICTManager',
      targetType: 'institution',
      changes: { brandColor: { from: null, to: '#1D4ED8' } },
    })

    expect(detail.headline).toBe('Updated the institution settings')
    expect(detail.subheadline).toContain('ICT Manager')
    expect(JSON.stringify(detail.sections)).toContain(
      'System colour changed from the StackEDU default to #1D4ED8.',
    )
  })
})
