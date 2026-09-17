import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Download, ExternalLink, Lock, Pin } from 'lucide-react'
import type { StudentCourseDetail } from '@stackedu/shared'
import { materialSourceLabel } from '@stackedu/shared'
import { StudentShell } from '@/components/StudentShell'
import { ClassroomSessionList } from '@/components/classroom/ClassroomSessionList'
import { CourseDiscussionBoard } from '@/components/course/CourseDiscussionBoard'
import { StudyAssistantPanel } from '@/components/course/StudyAssistantPanel'
import { Button } from '@/components/ui/button'
import {
  getStudentCourse,
  getStudentMaterialDownloadUrl,
  recordStudentMaterialView,
  studentCourseQueryKey,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateShort } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/student/course-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: CourseDetailPage,
})

function CourseDetailPage() {
  const { id } = Route.useSearch()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: studentCourseQueryKey(id),
    queryFn: () => getStudentCourse(id),
    enabled: Boolean(id),
  })

  return (
    <StudentShell pageTitle="Course" guide="Attendance, published modules, materials, live classes, the study assistant, announcements and discussions for this offering. A module with a prerequisite stays shut until you finish the one before it.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/courses" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← My courses</Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a course from My Courses.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading course…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load this course.')}</p>
        ) : data ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 52, height: 52, backgroundColor: data.color }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#fff' }}>{data.code}</span>
              </div>
              <div>
                <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{data.name}</h1>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  {data.lecturerName ?? 'Lecturer TBC'} · {data.credits} credits · {data.semesterName}
                </p>
              </div>
            </div>
            {data.description ? <p className="t-body mb-6" style={{ color: 'var(--foreground)' }}>{data.description}</p> : null}

            {data.announcements.length > 0 ? (
              <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Announcements</h2>
                {data.announcements.map((item) => (
                  <div key={item.id} className="py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.isPinned ? <Pin style={{ width: 13, height: 13, color: 'var(--brand)' }} /> : null}
                    </div>
                    <p className="t-body-sm whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>{item.body}</p>
                    {item.publishedAt ? (
                      <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>{formatDateShort(item.publishedAt)}</p>
                    ) : null}
                  </div>
                ))}
              </section>
            ) : null}

            <section className="mb-6">
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Live classes</h2>
              <ClassroomSessionList
                role="student"
                sessions={data.liveSessions}
                empty="No live classes for this course yet."
                onChanged={async () => {
                  await queryClient.invalidateQueries({ queryKey: studentCourseQueryKey(id) })
                }}
              />
            </section>

            <StudyAssistantPanel offeringId={id} />

            <div className="mb-6">
              <CourseDiscussionBoard
                offeringId={id}
                threads={data.discussions}
                role="student"
                onChanged={async () => {
                  await queryClient.invalidateQueries({ queryKey: studentCourseQueryKey(id) })
                }}
              />
            </div>

            <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Attendance</h2>
              <p className="t-body mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {data.attendanceRate === null ? 'No sessions recorded yet.' : `${data.attendanceRate}% of recorded sessions`}
              </p>
              {data.attendance.map((row) => (
                <div key={row.id} className="flex justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm">{row.date} · {row.topic ?? 'Class'}</span>
                  <span className="t-label">{row.status}</span>
                </div>
              ))}
            </section>

            <CourseFeed
              data={data}
              onViewed={async () => {
                await queryClient.invalidateQueries({ queryKey: studentCourseQueryKey(id) })
              }}
            />

            <section className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <div className="flex justify-between mb-3">
                <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)' }}>Assignments</h2>
                <Link to="/student/assignment-submit" search={{ id: '' }} className="text-sm" style={{ color: 'var(--success)' }}>All →</Link>
              </div>
              {data.assessments.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published assignments.</p>
              ) : data.assessments.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{item.type}{item.dueAt ? ` · due ${item.dueAt.slice(0, 10)}` : ''}</p>
                  </div>
                  {item.acceptsSubmissions ? (
                    <Link to="/student/assignment-submit" search={{ id: item.id }} className="t-caption flex-shrink-0" style={{ color: 'var(--success)' }}>
                      Submit
                    </Link>
                  ) : null}
                </div>
              ))}
            </section>
          </>
        ) : null}
      </div>
    </StudentShell>
  )
}

function CourseFeed({
  data,
  onViewed,
}: {
  data: StudentCourseDetail
  onViewed: () => Promise<void>
}) {
  const lockedIds = new Set(data.modules.filter((module) => module.isLocked).map((module) => module.id))
  const ungrouped = data.materials.filter((item) => !item.moduleId)

  return (
    <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
      <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Course content</h2>
      {data.modules.length === 0 && data.materials.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published materials yet.</p>
      ) : null}

      {data.modules.map((module) => {
        const items = data.materials.filter((item) => item.moduleId === module.id)
        return (
          <div key={module.id} className="py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-semibold">{module.title}</p>
              {module.isLocked ? <Lock style={{ width: 13, height: 13, color: 'var(--muted-foreground)' }} /> : null}
            </div>
            {module.summary ? (
              <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>{module.summary}</p>
            ) : null}
            <p className="t-caption mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {module.isLocked
                ? module.lockedReason
                : `${module.viewedCount} of ${module.materialCount} opened`}
            </p>
            {module.isLocked ? null : items.map((item) => (
              <MaterialRow key={item.id} item={item} onViewed={onViewed} />
            ))}
          </div>
        )
      })}

      {ungrouped.length > 0 ? (
        <div className="py-3" style={{ borderTop: '1px solid var(--border)' }}>
          {data.modules.length > 0 ? (
            <p className="text-sm font-semibold mb-2">Other materials</p>
          ) : null}
          {ungrouped.filter((item) => !item.moduleId || !lockedIds.has(item.moduleId)).map((item) => (
            <MaterialRow key={item.id} item={item} onViewed={onViewed} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function MaterialRow({
  item,
  onViewed,
}: {
  item: StudentCourseDetail['materials'][number]
  onViewed: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const viewMutation = useMutation({
    mutationFn: () => recordStudentMaterialView(item.id),
    onSuccess: async () => {
      await onViewed()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not open that material.')),
  })

  const markViewed = async () => {
    if (!item.isViewed) await viewMutation.mutateAsync()
  }

  return (
    <div className="flex flex-col gap-2 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {item.description ? `${item.description} · ` : ''}
            {materialSourceLabel({
              fileKey: item.hasFile ? item.fileName : null,
              externalUrl: item.externalUrl,
              bodyText: item.bodyText,
            })}
            {item.fileName ? ` · ${item.fileName}` : ''}
            {item.isViewed ? ' · Opened' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {item.bodyText ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = !open
                setOpen(next)
                if (next) void markViewed()
              }}
            >
              {open ? 'Hide page' : 'Read page'}
            </Button>
          ) : null}
          {item.hasFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                try {
                  const target = await getStudentMaterialDownloadUrl(item.id)
                  window.open(target.url, '_blank', 'noopener,noreferrer')
                  await onViewed()
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Could not open that file.'))
                }
              }}
            >
              <Download style={{ width: 13, height: 13 }} /> Download
            </Button>
          ) : null}
          {item.externalUrl ? (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { void markViewed() }}
            >
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <ExternalLink style={{ width: 13, height: 13 }} /> Open link
              </Button>
            </a>
          ) : null}
        </div>
      </div>
      {open && item.bodyText ? (
        <p className="t-body-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{item.bodyText}</p>
      ) : null}
    </div>
  )
}
