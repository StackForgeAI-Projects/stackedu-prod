import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useEffect, useRef, useState } from 'react'
import type { ClassroomJoin } from '@stackedu/shared'

type Scene = { elements?: readonly unknown[]; appState?: Record<string, unknown> }

export function ClassroomWhiteboard({
  sessionId,
  canEdit,
  collab,
  loadScene,
  saveScene,
}: {
  sessionId: string
  canEdit: boolean
  collab: ClassroomJoin['collab']
  loadScene: (id: string) => Promise<unknown>
  saveScene: (id: string, scene: unknown) => Promise<void>
}) {
  const [initial, setInitial] = useState<Scene | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const applyingRemote = useRef(false)
  const apiRef = useRef<{ updateScene: (scene: Scene) => void } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadScene(sessionId)
      .then((scene) => {
        if (!cancelled) setInitial((scene as Scene) ?? { elements: [] })
      })
      .catch(() => {
        if (!cancelled) setInitial({ elements: [] })
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, loadScene])

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
      if (!raw || !apiRef.current) return
      try {
        const parsed = JSON.parse(raw) as Scene
        applyingRemote.current = true
        apiRef.current.updateScene({ elements: parsed.elements ?? [] })
      } catch {
        // Ignore a partial live payload.
      } finally {
        applyingRemote.current = false
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
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveScene(sessionId, scene).catch(() => undefined)
    }, 800)
    if (!applyingRemote.current) {
      providerRef.current?.document.getMap<string>('scene').set('payload', JSON.stringify(scene))
    }
  }

  if (!initial) {
    return <p className="t-body-sm p-4" style={{ color: 'var(--muted-foreground)' }}>Loading whiteboard…</p>
  }

  return (
    <div className="w-full overflow-hidden" style={{ height: 420, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <Excalidraw
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
