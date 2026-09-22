import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useEffect, useRef, useState } from 'react'
import type { ClassroomJoin } from '@stackedu/shared'
import { useClassroomWhiteboardSync, type WhiteboardScene } from '@/components/classroom/ClassroomLiveProvider'

type Scene = WhiteboardScene

function stampOf(scene: Scene): number {
  return typeof scene.t === 'number' ? scene.t : 0
}

export function ClassroomWhiteboard({
  sessionId,
  canEdit,
  isLive,
  collab,
  loadScene,
  saveScene,
}: {
  sessionId: string
  canEdit: boolean
  isLive: boolean
  collab: ClassroomJoin['collab']
  loadScene: (id: string) => Promise<unknown>
  saveScene: (id: string, scene: unknown) => Promise<void>
}) {
  const sync = useClassroomWhiteboardSync()
  const [initial, setInitial] = useState<Scene | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const applyingRemote = useRef(false)
  const lastStamp = useRef(0)
  const apiRef = useRef<{ updateScene: (scene: Scene) => void } | null>(null)

  const applyRemote = (scene: Scene) => {
    const stamp = stampOf(scene)
    if (stamp && stamp <= lastStamp.current) return
    lastStamp.current = stamp || Date.now()
    if (!apiRef.current) return
    applyingRemote.current = true
    try {
      apiRef.current.updateScene({ elements: scene.elements ?? [] })
    } finally {
      applyingRemote.current = false
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadScene(sessionId)
      .then((scene) => {
        if (cancelled) return
        const next = (scene as Scene) ?? { elements: [] }
        lastStamp.current = stampOf(next)
        setInitial(next)
      })
      .catch(() => {
        if (!cancelled) setInitial({ elements: [] })
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, loadScene])

  useEffect(() => {
    return sync.subscribe((scene) => applyRemote(scene))
  }, [sync])

  useEffect(() => {
    if (!isLive) return
    const tick = window.setInterval(() => {
      void loadScene(sessionId)
        .then((scene) => applyRemote((scene as Scene) ?? {}))
        .catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(tick)
  }, [isLive, sessionId, loadScene])

  useEffect(() => {
    if (!collab) return
    const provider = new HocuspocusProvider({
      url: collab.url,
      name: collab.documentName,
      token: collab.token,
    })
    providerRef.current = provider
    const map = provider.document.getMap<string>('scene')
    const onUpdate = () => {
      const raw = map.get('payload')
      if (!raw) return
      try {
        applyRemote(JSON.parse(raw) as Scene)
      } catch {
        // Ignore a partial live payload.
      }
    }
    map.observe(onUpdate)
    return () => {
      map.unobserve(onUpdate)
      provider.destroy()
      providerRef.current = null
    }
  }, [collab])

  const persist = (scene: Scene) => {
    if (!canEdit || applyingRemote.current) return
    const payload = { ...scene, t: Date.now() }
    lastStamp.current = payload.t
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveScene(sessionId, payload).catch(() => undefined)
    }, 800)
    sync.publish(payload)
    providerRef.current?.document.getMap<string>('scene').set('payload', JSON.stringify(payload))
  }

  if (!initial) {
    return <p className="t-body-sm p-4" style={{ color: 'var(--muted-foreground)' }}>Loading whiteboard…</p>
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden" style={{ height: 420, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <Excalidraw
        key={`${sessionId}-${canEdit ? 'edit' : 'view'}`}
        excalidrawAPI={(api) => {
          apiRef.current = {
            updateScene: (scene) => {
              api.updateScene({ elements: scene.elements as never })
            },
          }
        }}
        initialData={{
          elements: (initial.elements ?? []) as never,
          appState: initial.appState ?? {},
        }}
        viewModeEnabled={!canEdit}
        onChange={(elements, appState) => {
          if (!canEdit) return
          persist({ elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } })
        }}
      />
    </div>
  )
}
