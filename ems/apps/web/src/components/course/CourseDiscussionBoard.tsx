import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { CreateLecturerDiscussionRequest, DiscussionThreadDetail, DiscussionThreadSummary } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { PagedList } from '@/components/ListPagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import {
  createLecturerDiscussion,
  createLecturerDiscussionPost,
  deleteLecturerDiscussion,
  getLecturerDiscussion,
  lecturerCourseQueryKey,
  updateLecturerDiscussion,
} from '@/lib/api/lecturer'
import {
  createStudentDiscussionPost,
  getStudentDiscussion,
  studentCourseQueryKey,
  studentDiscussionQueryKey,
} from '@/lib/api/student'
import { formatDateShort } from '@/lib/utils'
import { toast } from 'sonner'

export function CourseDiscussionBoard({
  offeringId,
  threads,
  role,
  onChanged,
}: {
  offeringId: string
  threads: DiscussionThreadSummary[]
  role: 'lecturer' | 'student'
  onChanged: () => Promise<void>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Discussions</h2>
          <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Course forum. Announcements stay one-way; this is the place to reply.
          </p>
        </div>
        {role === 'lecturer' ? (
          <Button type="button" onClick={() => setCreateOpen(true)} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
            Start discussion
          </Button>
        ) : null}
      </div>
      <PagedList
        items={threads}
        getKey={(row) => row.id}
        defaultPageSize={5}
        itemLabel="discussions"
        empty={
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 24, textAlign: 'center' }}>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No discussions yet.</p>
          </div>
        }
        renderItem={(row) => (
          <button
            type="button"
            className="w-full text-left"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '14px 16px' }}
            onClick={() => setActiveId(row.id)}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.title}</p>
            <p className="t-caption mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{row.prompt}</p>
            <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {row.postCount} {row.postCount === 1 ? 'reply' : 'replies'}
              {row.graded ? ' · Graded' : ''}
              {row.closedAt ? ' · Closed' : ''}
              {role === 'lecturer' && !row.isPublished ? ' · Draft' : ''}
            </p>
          </button>
        )}
      />

      {role === 'lecturer' ? (
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
            <DiscussionForm
              offeringId={offeringId}
              onClose={() => setCreateOpen(false)}
              onSuccess={async () => {
                await onChanged()
                setCreateOpen(false)
              }}
            />
          </SheetContent>
        </Sheet>
      ) : null}

      <Sheet open={Boolean(activeId)} onOpenChange={(open) => { if (!open) setActiveId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {activeId ? (
            <ThreadPanel
              threadId={activeId}
              role={role}
              offeringId={offeringId}
              onChanged={onChanged}
              onClose={() => setActiveId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function DiscussionForm({
  offeringId,
  onClose,
  onSuccess,
}: {
  offeringId: string
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [publish, setPublish] = useState(true)
  const [graded, setGraded] = useState(false)
  const create = useMutation({
    mutationFn: (input: CreateLecturerDiscussionRequest) => createLecturerDiscussion(input),
    onSuccess: async () => {
      toast.success('Discussion started.')
      await onSuccess()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not start that discussion.')),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600 }}>Start discussion</h3>
        <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Students reply in a thread. If this is graded, a coursework column is created for the same title.
        </p>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div>
          <label className="t-label mb-1.5 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="t-label mb-1.5 block">Opening question</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} />
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Publish to students</span>
          <Switch checked={publish} onCheckedChange={setPublish} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Count toward the final mark</span>
          <Switch checked={graded} onCheckedChange={setGraded} />
        </label>
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '16px 24px 24px' }}>
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <ConfirmAlertDialog
          trigger={
            <Button className="flex-1" disabled={title.trim().length < 2 || prompt.trim().length < 2 || create.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              {create.isPending ? 'Saving…' : 'Start discussion'}
            </Button>
          }
          title="Start this discussion?"
          tone="success"
          headlineLabel="Action"
          headline={publish ? 'Publish discussion' : 'Save draft'}
          summary={`"${title.trim()}" will be added to this course.`}
          notices={[
            { icon: 'user', label: publish ? 'Enrolled students can reply.' : 'Students will not see a draft.' },
            { icon: 'file', label: graded ? 'A coursework column is created so you can mark this discussion.' : 'This stays ungraded unless you change it later.' },
          ]}
          confirmLabel="Start"
          confirmVariant="brand"
          loading={create.isPending}
          onConfirm={() => create.mutate({ offeringId, title: title.trim(), prompt: prompt.trim(), publish, graded })}
        />
      </div>
    </div>
  )
}

function ThreadPanel({
  threadId,
  role,
  offeringId,
  onChanged,
  onClose,
}: {
  threadId: string
  role: 'lecturer' | 'student'
  offeringId: string
  onChanged: () => Promise<void>
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const queryKey = role === 'lecturer' ? ['lecturer', 'discussion', threadId] : studentDiscussionQueryKey(threadId)
  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: () => (role === 'lecturer' ? getLecturerDiscussion(threadId) : getStudentDiscussion(threadId)),
  })
  const [reply, setReply] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)

  const post = useMutation({
    mutationFn: () =>
      role === 'lecturer'
        ? createLecturerDiscussionPost(threadId, { body: reply.trim(), parentPostId: parentId })
        : createStudentDiscussionPost(threadId, { body: reply.trim(), parentPostId: parentId }),
    onSuccess: async () => {
      toast.success('Reply posted.')
      setReply('')
      setParentId(null)
      await queryClient.invalidateQueries({ queryKey })
      await queryClient.invalidateQueries({ queryKey: studentCourseQueryKey(offeringId) })
      await queryClient.invalidateQueries({ queryKey: lecturerCourseQueryKey(offeringId) })
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not post that reply.')),
  })

  const closeThread = useMutation({
    mutationFn: () => updateLecturerDiscussion(threadId, { close: true }),
    onSuccess: async () => {
      toast.success('Discussion closed.')
      await queryClient.invalidateQueries({ queryKey })
      await onChanged()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not close that discussion.')),
  })

  const remove = useMutation({
    mutationFn: () => deleteLecturerDiscussion(threadId),
    onSuccess: async () => {
      toast.success('Discussion deleted.')
      await onChanged()
      onClose()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not delete that discussion.')),
  })

  if (isPending) return <p className="t-body p-6" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
  if (error || !data) {
    return <p className="t-body p-6" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load this discussion.')}</p>
  }

  const closed = Boolean(data.closedAt)
  const roots = data.posts.filter((post) => !post.parentPostId)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600 }}>{data.title}</h3>
        <p className="t-body-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>{data.prompt}</p>
        <p className="t-caption mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {data.graded ? 'Graded · ' : ''}{closed ? 'Closed' : 'Open'}
        </p>
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {roots.length === 0 ? (
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No replies yet.</p>
        ) : roots.map((root) => (
          <PostBlock
            key={root.id}
            thread={data}
            post={root}
            closed={closed}
            onReply={() => setParentId(root.id)}
          />
        ))}
        {!closed ? (
          <div>
            <label className="t-label mb-1.5 block">{parentId ? 'Reply to this post' : 'Write a reply'}</label>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
            {parentId ? (
              <button type="button" className="t-caption mt-1" style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }} onClick={() => setParentId(null)}>
                Cancel nested reply
              </button>
            ) : null}
          </div>
        ) : (
          <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>This discussion is closed.</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3" style={{ padding: '16px 24px 24px' }}>
        {role === 'lecturer' ? (
          <>
            {!closed ? (
              <ConfirmAlertDialog
                trigger={<Button variant="outline">Close</Button>}
                title="Close this discussion?"
                tone="info"
                headlineLabel="Action"
                headline="Close discussion"
                summary="Students will still be able to read it, but nobody can add a new reply."
                confirmLabel="Close"
                confirmVariant="brand"
                loading={closeThread.isPending}
                onConfirm={() => closeThread.mutate()}
              />
            ) : null}
            <ConfirmAlertDialog
              trigger={<Button variant="outline">Delete</Button>}
              title="Delete this discussion?"
              tone="destructive"
              headlineLabel="Action"
              headline="Remove discussion"
              summary={`"${data.title}" will be removed if students have not posted yet.`}
              notices={[{ icon: 'lock', label: 'If students have already posted, close it instead.' }]}
              confirmLabel="Delete"
              confirmVariant="destructive"
              loading={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </>
        ) : null}
        <div className="flex-1" />
        {!closed ? (
          <ConfirmAlertDialog
            trigger={
              <Button disabled={reply.trim().length < 2 || post.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                {post.isPending ? 'Posting…' : 'Post reply'}
              </Button>
            }
            title="Post this reply?"
            tone="success"
            headlineLabel="Action"
            headline="Add to the thread"
            summary="Your reply will be visible to the lecturer and enrolled students on this course."
            confirmLabel="Post"
            confirmVariant="brand"
            loading={post.isPending}
            onConfirm={() => post.mutate()}
          />
        ) : null}
      </div>
    </div>
  )
}

function PostBlock({
  thread,
  post,
  closed,
  onReply,
}: {
  thread: DiscussionThreadDetail
  post: DiscussionThreadDetail['posts'][number]
  closed: boolean
  onReply: () => void
}) {
  const children = thread.posts.filter((row) => row.parentPostId === post.id)
  return (
    <div>
      <div style={{ backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-lg)', padding: 12 }}>
        <p className="t-caption mb-1" style={{ color: 'var(--muted-foreground)' }}>
          {post.authorName} · {post.authorRole} · {formatDateShort(post.createdAt)}
        </p>
        <p className="t-body-sm whitespace-pre-wrap">{post.body}</p>
        {!closed ? (
          <button type="button" className="t-caption mt-2" style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', padding: 0 }} onClick={onReply}>
            Reply
          </button>
        ) : null}
      </div>
      {children.length > 0 ? (
        <div className="mt-2 ml-4 sm:ml-6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children.map((child) => (
            <PostBlock key={child.id} thread={thread} post={child} closed={closed} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
