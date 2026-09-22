import { LiveKitRoom, useRoomContext, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { RoomEvent } from 'livekit-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Maximize2, Minimize2 } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { ClassroomJoin, ClassroomSessionDetail } from '@stackedu/shared'
import { cn } from '@/lib/utils'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api/client'
import {
  endLecturerClassroomSession,
  getLecturerClassroomSession,
  muteAllLecturerClassroomStudents,
} from '@/lib/api/lecturer'
import { getStudentClassroomSession } from '@/lib/api/student'
import { toast } from 'sonner'

export type WhiteboardScene = {
  t?: number
  elements?: readonly unknown[]
  appState?: Record<string, unknown>
}

type WhiteboardSync = {
  publish: (scene: WhiteboardScene) => void
  subscribe: (fn: (scene: WhiteboardScene) => void) => () => void
}

const noopSync: WhiteboardSync = {
  publish: () => undefined,
  subscribe: () => () => undefined,
}

export function whiteboardChannelIsLive(sync: WhiteboardSync): boolean {
  return sync !== noopSync
}

const WhiteboardSyncContext = createContext<WhiteboardSync>(noopSync)

export function useClassroomWhiteboardSync(): WhiteboardSync {
  return useContext(WhiteboardSyncContext)
}

type LiveRole = 'lecturer' | 'student'

type ClassroomLiveContextValue = {
  role: LiveRole | null
  sessionId: string | null
  join: ClassroomJoin | null
  session: ClassroomSessionDetail | null
  connect: (input: { role: LiveRole; sessionId: string; join: ClassroomJoin }) => void
  updateSession: (session: ClassroomSessionDetail) => void
  disconnect: () => void
  setStageEl: (el: HTMLElement | null) => void
}

const ClassroomLiveContext = createContext<ClassroomLiveContextValue | null>(null)

const idleLive: ClassroomLiveContextValue = {
  role: null,
  sessionId: null,
  join: null,
  session: null,
  connect: () => undefined,
  updateSession: () => undefined,
  disconnect: () => undefined,
  setStageEl: () => undefined,
}

export function useClassroomLive(): ClassroomLiveContextValue {
  return useContext(ClassroomLiveContext) ?? idleLive
}

export function ClassroomLiveProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<LiveRole | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [join, setJoin] = useState<ClassroomJoin | null>(null)
  const [session, setSession] = useState<ClassroomSessionDetail | null>(null)
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null)

  const connect = useCallback((input: { role: LiveRole; sessionId: string; join: ClassroomJoin }) => {
    setRole(input.role)
    setSessionId(input.sessionId)
    setJoin(input.join)
    setSession(input.join.session)
  }, [])

  const updateSession = useCallback((next: ClassroomSessionDetail) => {
    setSession(next)
    setJoin((current) => (current ? { ...current, session: next } : current))
    if (next.status !== 'Live') {
      setJoin(null)
    }
  }, [])

  const disconnect = useCallback(() => {
    setJoin(null)
    setSessionId(null)
    setRole(null)
    setSession(null)
    setStageEl(null)
  }, [])

  const liveSession = useQuery({
    queryKey: ['classroom-live-session', role, sessionId],
    queryFn: () => {
      if (!role || !sessionId) return null
      return role === 'lecturer'
        ? getLecturerClassroomSession(sessionId)
        : getStudentClassroomSession(sessionId)
    },
    enabled: Boolean(role && sessionId && join),
    refetchInterval: 8000,
  })

  const polled = liveSession.data
  const shownSession = polled && polled.id === sessionId ? polled : session
  const shownJoin = useMemo(() => {
    if (!join || shownSession?.status !== 'Live') return null
    return { ...join, session: shownSession }
  }, [join, shownSession])

  useEffect(() => {
    if (!polled || !sessionId || polled.id !== sessionId) return
    if (polled.status === 'Live') return
    setJoin(null)
  }, [polled, sessionId])

  const media = shownJoin?.media ?? null
  const recording = Boolean(shownSession?.recordings.some((row) => row.status === 'Pending'))
  const [boardSync, setBoardSync] = useState<WhiteboardSync>(noopSync)

  const value = useMemo<ClassroomLiveContextValue>(
    () => ({
      role,
      sessionId,
      join: shownJoin,
      session: shownSession,
      connect,
      updateSession,
      disconnect,
      setStageEl,
    }),
    [role, sessionId, shownJoin, shownSession, connect, updateSession, disconnect],
  )

  return (
    <ClassroomLiveContext.Provider value={value}>
      <WhiteboardSyncContext.Provider value={boardSync}>
        {media && role && sessionId ? (
          <LiveKitRoom
            serverUrl={media.url}
            token={media.token}
            connect
            audio
            video
            onDisconnected={disconnect}
            style={{ display: 'contents' }}
          >
            <WhiteboardLiveBridge onReady={setBoardSync} />
            <ClassroomMediaChrome
              role={role}
              sessionId={sessionId}
              session={shownSession}
              recording={recording}
              stageEl={stageEl}
              onEnded={disconnect}
              onSession={updateSession}
            />
          </LiveKitRoom>
        ) : null}
        {children}
      </WhiteboardSyncContext.Provider>
    </ClassroomLiveContext.Provider>
  )
}

function WhiteboardLiveBridge({ onReady }: { onReady: (sync: WhiteboardSync) => void }) {
  const room = useRoomContext()
  const listeners = useRef(new Set<(scene: WhiteboardScene) => void>())

  useEffect(() => {
    const onData = (payload: Uint8Array, _p: unknown, _k: unknown, topic?: string) => {
      if (topic && topic !== 'whiteboard') return
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as WhiteboardScene
        listeners.current.forEach((fn) => fn(parsed))
      } catch {
        // Ignore a partial live payload.
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room])

  const sync = useMemo<WhiteboardSync>(
    () => ({
      publish: (scene) => {
        const bytes = new TextEncoder().encode(JSON.stringify(scene))
        void room.localParticipant.publishData(bytes, { reliable: true, topic: 'whiteboard' }).catch(() => undefined)
      },
      subscribe: (fn) => {
        listeners.current.add(fn)
        return () => {
          listeners.current.delete(fn)
        }
      },
    }),
    [room],
  )

  useEffect(() => {
    onReady(sync)
    return () => onReady(noopSync)
  }, [onReady, sync])

  return null
}

function ClassroomMediaChrome({
  role,
  sessionId,
  session,
  recording,
  stageEl,
  onEnded,
  onSession,
}: {
  role: LiveRole
  sessionId: string
  session: ClassroomSessionDetail | null
  recording: boolean
  stageEl: HTMLElement | null
  onEnded: () => void
  onSession: (session: ClassroomSessionDetail) => void
}) {
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFull = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen().catch(() => undefined)
  }

  const muteMutation = useMutation({
    mutationFn: () => muteAllLecturerClassroomStudents(sessionId),
    onSuccess: (result) => {
      toast.success(result.muted > 0 ? 'All students are muted.' : 'No student microphones were on.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not mute students.')),
  })

  const endMutation = useMutation({
    mutationFn: () => endLecturerClassroomSession(sessionId),
    onSuccess: (next) => {
      toast.success('Class ended.')
      onSession(next)
      onEnded()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not end that class.')),
  })

  const pip = !stageEl
  const media = (
    <div
      ref={wrapRef}
      className="relative w-full h-full min-w-0 overflow-hidden"
      style={{ backgroundColor: '#111', borderRadius: pip ? 'var(--radius-lg)' : undefined }}
    >
      {recording ? (
        <div
          className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 text-xs font-semibold"
          style={{
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--error)',
          }}
        >
          <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--error)' }} />
          Recording
        </div>
      ) : null}
      <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center justify-end gap-2">
        {role === 'lecturer' ? (
          <ConfirmAlertDialog
            trigger={<ClassroomVideoLabelButton>Mute all</ClassroomVideoLabelButton>}
            title="Mute all students?"
            tone="warning"
            headlineLabel="Action"
            headline="Mute student microphones"
            summary="Every student microphone in this room will be turned off. You stay unmuted."
            notices={[{ icon: 'lock', label: 'Students can unmute themselves afterwards.' }]}
            confirmLabel="Mute all"
            confirmVariant="warning"
            loading={muteMutation.isPending}
            onConfirm={() => muteMutation.mutate()}
          />
        ) : null}
        <ClassroomVideoLabelButton onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'}>
          {full ? <Minimize2 style={{ width: 14, height: 14 }} /> : <Maximize2 style={{ width: 14, height: 14 }} />}
          {full ? 'Exit full screen' : 'Full screen'}
        </ClassroomVideoLabelButton>
      </div>
      <div className="h-full min-w-0 overflow-hidden" data-lk-theme="default">
        <VideoConference />
      </div>
    </div>
  )

  if (stageEl) {
    return createPortal(
      <div className="h-full w-full min-w-0 overflow-hidden">{media}</div>,
      stageEl,
    )
  }

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden"
      style={{
        right: 16,
        bottom: 16,
        width: 'min(360px, calc(100vw - 24px))',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {session?.title ?? 'Live class'}
        </p>
        <ClassroomVideoLabelButton
          onClick={() => {
            void navigate({
              to: role === 'lecturer' ? '/lecturer/classroom-session' : '/student/classroom-session',
              search: { id: sessionId },
            })
          }}
        >
          Back to class
        </ClassroomVideoLabelButton>
      </div>
      <div style={{ height: 200 }}>{media}</div>
      <div className="flex flex-wrap gap-2 px-3 py-2">
        <ClassroomVideoLabelButton onClick={onEnded}>Leave</ClassroomVideoLabelButton>
        {role === 'lecturer' ? (
          <ConfirmAlertDialog
            trigger={<ClassroomVideoLabelButton>End class</ClassroomVideoLabelButton>}
            title="End this class?"
            tone="destructive"
            headlineLabel="Action"
            headline="End live class"
            summary={`"${session?.title ?? 'This class'}" will close. Students will drop from the room.`}
            notices={[{ icon: 'clock', label: 'You can draft a summary after the class ends.' }]}
            confirmLabel="End class"
            confirmVariant="destructive"
            loading={endMutation.isPending}
            onConfirm={async () => { await endMutation.mutateAsync() }}
          />
        ) : null}
      </div>
    </div>
  )
}

const ClassroomVideoLabelButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function ClassroomVideoLabelButton({ children, className, style, ...props }, ref) {
    return (
      <Button
        ref={ref}
        type="button"
        size="sm"
        variant="outline"
        {...props}
        className={cn('classroom-video-label-btn shrink-0 gap-1.5 hover:text-(--foreground)', className)}
        style={{
          ...style,
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          WebkitTextFillColor: 'var(--foreground)',
        }}
      >
        {children}
      </Button>
    )
  },
)
