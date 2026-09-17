import type { UserRole } from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import { auditLogs } from '../db/institution/schema/settings'

export async function writeAudit(input: {
  institutionId: string
  actorId: string
  actorEmail: string
  actorRole: UserRole
  action: string
  targetType?: string
  targetId?: string
  changes?: Record<string, { from: unknown; to: unknown }>
  metadata?: Record<string, unknown>
  requestId?: string
  ipAddress?: string | undefined
  userAgent?: string | undefined
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    changes: input.changes ?? null,
    metadata: input.metadata ?? null,
    requestId: input.requestId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  })
}
