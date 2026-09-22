import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import type {
  LecturerCourseAnnouncement,
  LecturerCourseMaterial,
  LecturerCourseModule,
} from '@stackedu/shared'
import { formatMaterialFileSize, materialSourceLabel } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { ClassroomSessionList } from '@/components/classroom/ClassroomSessionList'
import { CourseDiscussionBoard } from '@/components/course/CourseDiscussionBoard'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { PagedList } from '@/components/ListPagination'
import { AddMaterialControl } from '@/components/lecturer/AddMaterialControl'
import { MaterialForm, MaterialRowActions, TableIconButton } from '@/components/lecturer/CourseMaterialEditor'
import { ModuleForm } from '@/components/lecturer/CourseModuleEditor'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLecturerAnnouncement,
  deleteLecturerAnnouncement,
  deleteLecturerModule,
  getLecturerCourse,
  lecturerCourseQueryKey,
  listLecturerCourses,
  lecturerCoursesQueryKey,
  updateLecturerAnnouncement,
} from '@/lib/api/lecturer'
import { formatDateShort } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/lecturer/course-management')({
  validateSearch: (search: Record<string, unknown>) => ({
    offeringId: typeof search.offeringId === 'string' ? search.offeringId : undefined,
    addModule: search.addModule === true || search.addModule === '1',
  }),
  component: CourseManagementPage,
})

function CourseManagementPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [offeringId, setOfferingId] = useState(search.offeringId ?? '')
  const [moduleOpen, setModuleOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<LecturerCourseModule | null>(null)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<LecturerCourseMaterial | null>(null)
  const [announceOpen, setAnnounceOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<LecturerCourseAnnouncement | null>(null)

  useEffect(() => {
    if (search.offeringId) setOfferingId(search.offeringId)
  }, [search.offeringId])

  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  useEffect(() => {
    if (!search.addModule || !offeringId) return
    setEditingModule(null)
    setModuleOpen(true)
    void navigate({
      to: '/lecturer/course-management',
      search: { offeringId, addModule: false },
      replace: true,
    })
  }, [search.addModule, offeringId, navigate])

  const { data: detail, isPending: detailPending } = useQuery({
    queryKey: lecturerCourseQueryKey(offeringId),
    queryFn: () => getLecturerCourse(offeringId),
    enabled: Boolean(offeringId),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(offeringId) })
  }

  const modules = detail?.modules ?? []
  const materials = detail?.materials ?? []
  const announcements = detail?.announcements ?? []

  return (
    <LecturerShell
      pageTitle="Course Management"
      guide="Build the course as modules of pages, files and links, then post announcements, run live classes, and start discussions. Students see published items. A module with a prerequisite stays shut until the earlier one is finished."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Course Management</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Modules, materials and announcements for the courses assigned to you.</p>
          </div>
          {courses.length > 0 ? (
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Choose a course" /></SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.offeringId} value={course.offeringId}>
                    {course.code} {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading courses…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load courses.')}</p>
        ) : courses.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No courses assigned this semester.</p>
        ) : detailPending && !detail ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading this course…</p>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Modules</h2>
                <Button
                  type="button"
                  onClick={() => { setEditingModule(null); setModuleOpen(true) }}
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Add module
                </Button>
              </div>
              <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {modules.length === 0 ? (
                  <p className="t-body-sm px-5 py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    No modules yet. Add one first — you need a module before you can add course material.
                  </p>
                ) : modules.map((module, index) => {
                  const prerequisite = modules.find((row) => row.id === module.prerequisiteModuleId)
                  return (
                    <div
                      key={module.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5"
                      style={{ paddingTop: 14, paddingBottom: 14, borderBottom: index < modules.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{module.title}</p>
                          <span
                            className="t-label px-2 py-0.5"
                            style={{
                              backgroundColor: module.isPublished ? 'var(--success-bg)' : 'var(--muted)',
                              color: module.isPublished ? 'var(--success)' : 'var(--muted-foreground)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {module.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {module.materialCount} {module.materialCount === 1 ? 'item' : 'items'}
                          {prerequisite ? ` · After "${prerequisite.title}"` : ''}
                          {module.summary ? ` · ${module.summary}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TableIconButton
                          label="Edit module"
                          icon={Pencil}
                          onClick={() => { setEditingModule(module); setModuleOpen(true) }}
                        />
                        <DeleteModuleButton module={module} onChanged={refresh} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Materials</h2>
                <AddMaterialControl
                  offeringId={offeringId}
                  hasModules={modules.length > 0}
                  icon="upload"
                  onAdd={() => { setEditingMaterial(null); setMaterialOpen(true) }}
                />
              </div>
              <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {materials.length === 0 ? (
                  <p className="t-body-sm px-5 py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    No materials for this course. Add a page, a file or a link.
                  </p>
                ) : materials.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5"
                    style={{ paddingTop: 14, paddingBottom: 14, borderBottom: index < materials.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                        <span className="t-label px-2 py-0.5" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
                          {materialSourceLabel(item)}
                        </span>
                      </div>
                      <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {item.moduleName ?? 'Ungrouped'}
                        {item.fileName ? ` · ${item.fileName} · ${formatMaterialFileSize(item.fileSizeBytes)}` : ''}
                        {` · ${item.isPublished ? 'Published' : 'Draft'}`}
                        {` · ${formatDateShort(item.createdAt)}`}
                      </p>
                    </div>
                    <MaterialRowActions
                      material={item}
                      onEdit={() => { setEditingMaterial(item); setMaterialOpen(true) }}
                      onChanged={refresh}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Announcements</h2>
                <Button
                  type="button"
                  onClick={() => { setEditingAnnouncement(null); setAnnounceOpen(true) }}
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6 }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> Post announcement
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.length === 0 ? (
                  <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24, textAlign: 'center' }}>
                    <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No announcements for this course.</p>
                  </div>
                ) : (
                  <PagedList
                    items={announcements}
                    getKey={(row) => row.id}
                    defaultPageSize={5}
                    itemLabel="announcements"
                    renderItem={(row) => (
                      <AnnouncementCard
                        announcement={row}
                        onEdit={() => { setEditingAnnouncement(row); setAnnounceOpen(true) }}
                        onChanged={refresh}
                      />
                    )}
                  />
                )}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Live classes</h2>
              <ClassroomSessionList
                role="lecturer"
                sessions={detail?.liveSessions ?? []}
                offeringId={offeringId}
                empty="No live classes for this course yet."
                onChanged={refresh}
              />
            </section>

            <section className="mt-8">
              <CourseDiscussionBoard
                offeringId={offeringId}
                threads={detail?.discussions ?? []}
                role="lecturer"
                onChanged={refresh}
              />
            </section>
          </>
        )}
      </div>

      <Sheet open={moduleOpen} onOpenChange={(open) => { setModuleOpen(open); if (!open) setEditingModule(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {offeringId ? (
            <ModuleForm
              offeringId={offeringId}
              module={editingModule}
              modules={modules}
              onClose={() => { setModuleOpen(false); setEditingModule(null) }}
              onSuccess={async () => {
                await refresh()
                setModuleOpen(false)
                setEditingModule(null)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={materialOpen} onOpenChange={(open) => { setMaterialOpen(open); if (!open) setEditingMaterial(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {offeringId ? (
            <MaterialForm
              offeringId={offeringId}
              material={editingMaterial}
              modules={modules}
              onClose={() => { setMaterialOpen(false); setEditingMaterial(null) }}
              onSuccess={async () => {
                await refresh()
                setMaterialOpen(false)
                setEditingMaterial(null)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={announceOpen} onOpenChange={(open) => { setAnnounceOpen(open); if (!open) setEditingAnnouncement(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {offeringId ? (
            <AnnouncementForm
              offeringId={offeringId}
              announcement={editingAnnouncement}
              onClose={() => { setAnnounceOpen(false); setEditingAnnouncement(null) }}
              onSuccess={async () => {
                await refresh()
                setAnnounceOpen(false)
                setEditingAnnouncement(null)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function DeleteModuleButton({
  module,
  onChanged,
}: {
  module: LecturerCourseModule
  onChanged: () => Promise<void>
}) {
  const mutation = useMutation({
    mutationFn: () => deleteLecturerModule(module.id),
    onSuccess: async () => {
      toast.success(`"${module.title}" removed.`)
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that module.')),
  })

  return (
    <ConfirmAlertDialog
      trigger={<TableIconButton label="Delete module" icon={Trash2} danger />}
      title="Delete this module?"
      tone="destructive"
      headlineLabel="Action"
      headline="Delete module"
      summary={`"${module.title}" will be removed. Materials inside it stay on the course, ungrouped.`}
      notices={[
        { icon: 'lock', label: 'Any later module that named this one as a prerequisite will need a new one set.' },
        { icon: 'trash', label: 'This cannot be undone.' },
      ]}
      confirmLabel="Delete"
      confirmVariant="destructive"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate()}
    />
  )
}

function AnnouncementCard({
  announcement,
  onEdit,
  onChanged,
}: {
  announcement: LecturerCourseAnnouncement
  onEdit: () => void
  onChanged: () => Promise<void>
}) {
  const mutation = useMutation({
    mutationFn: () => deleteLecturerAnnouncement(announcement.id),
    onSuccess: async () => {
      toast.success(`"${announcement.title}" deleted.`)
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that announcement.')),
  })

  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '18px 20px' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{announcement.title}</p>
            {announcement.isPinned ? <Pin style={{ width: 13, height: 13, color: 'var(--brand)' }} /> : null}
            <span
              className="t-label px-2 py-0.5"
              style={{
                backgroundColor: announcement.publishedAt ? 'var(--success-bg)' : 'var(--muted)',
                color: announcement.publishedAt ? 'var(--success)' : 'var(--muted-foreground)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {announcement.publishedAt ? 'Posted' : 'Draft'}
            </span>
          </div>
          <p className="t-body-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>{announcement.body}</p>
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            {formatDateShort(announcement.publishedAt ?? announcement.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TableIconButton label="Edit announcement" icon={Pencil} onClick={onEdit} />
          <ConfirmAlertDialog
            trigger={<TableIconButton label="Delete announcement" icon={Trash2} danger />}
            title="Delete this announcement?"
            tone="destructive"
            headlineLabel="Action"
            headline="Delete course announcement"
            summary={`"${announcement.title}" will be removed from the course feed.`}
            notices={[{ icon: 'trash', label: 'Students will no longer see this announcement.' }]}
            confirmLabel="Delete"
            confirmVariant="destructive"
            loading={mutation.isPending}
            onConfirm={() => mutation.mutate()}
          />
        </div>
      </div>
    </div>
  )
}

function AnnouncementForm({
  offeringId,
  announcement,
  onClose,
  onSuccess,
}: {
  offeringId: string
  announcement: LecturerCourseAnnouncement | null
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const isEdit = announcement !== null
  const [title, setTitle] = useState(announcement?.title ?? '')
  const [body, setBody] = useState(announcement?.body ?? '')
  const [pinned, setPinned] = useState(announcement?.isPinned ?? false)
  const [publish, setPublish] = useState(announcement ? Boolean(announcement.publishedAt) : true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(announcement?.title ?? '')
    setBody(announcement?.body ?? '')
    setPinned(announcement?.isPinned ?? false)
    setPublish(announcement ? Boolean(announcement.publishedAt) : true)
  }, [announcement])

  const save = async () => {
    if (title.trim().length < 2 || body.trim().length < 2) return
    setSaving(true)
    try {
      if (isEdit && announcement) {
        await updateLecturerAnnouncement(announcement.id, {
          title: title.trim(),
          body: body.trim(),
          isPinned: pinned,
          publish,
        })
        toast.success(publish ? `Announcement "${title.trim()}" posted.` : `Draft "${title.trim()}" saved.`)
      } else {
        await createLecturerAnnouncement({
          offeringId,
          title: title.trim(),
          body: body.trim(),
          isPinned: pinned,
          publish,
        })
        toast.success(publish ? `Announcement "${title.trim()}" posted.` : `Draft "${title.trim()}" saved.`)
      }
      await onSuccess()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save that announcement.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {isEdit ? 'Edit announcement' : 'Post announcement'}
        </h3>
        <FormInfoBox lines={isEdit ? formInfo.editAnnouncement : formInfo.postAnnouncement} />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Message</label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement…" rows={5} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Pin to the top of the feed</span>
          <Switch checked={pinned} onCheckedChange={setPinned} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Post now</span>
          <Switch checked={publish} onCheckedChange={setPublish} />
        </div>
      </div>
      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10 }}>
        <ConfirmAlertDialog
          trigger={
            <Button
              type="button"
              className="flex-1"
              disabled={title.trim().length < 2 || body.trim().length < 2 || saving}
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {saving ? 'Saving…' : publish ? 'Post' : 'Save draft'}
            </Button>
          }
          title={publish ? 'Post this announcement?' : 'Save this draft?'}
          tone="success"
          headlineLabel="Action"
          headline={publish ? 'Post announcement' : 'Save draft'}
          summary={`"${title.trim()}" will ${publish ? 'appear in the student course feed' : 'stay on this screen until you post it'}.`}
          notices={[{ icon: 'bell', label: publish ? 'Enrolled students are notified when it is posted.' : 'Students cannot see a draft.' }]}
          confirmLabel={publish ? 'Post' : 'Save draft'}
          confirmVariant="brand"
          loading={saving}
          onConfirm={() => void save()}
        />
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
