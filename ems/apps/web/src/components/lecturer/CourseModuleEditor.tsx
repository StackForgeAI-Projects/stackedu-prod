import { useEffect, useState } from 'react'
import type { LecturerCourseModule } from '@stackedu/shared'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { FormInfoBox } from '@/components/FormInfoBox'
import { formInfo } from '@/lib/form-info-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/client'
import { createLecturerModule, updateLecturerModule } from '@/lib/api/lecturer'
import { toast } from 'sonner'

const NO_PREREQUISITE = 'none'

export function ModuleForm({
  offeringId,
  module,
  modules,
  onClose,
  onSuccess,
}: {
  offeringId: string
  module: LecturerCourseModule | null
  modules: LecturerCourseModule[]
  onClose: () => void
  onSuccess: () => Promise<void>
}) {
  const isEdit = module !== null
  const [title, setTitle] = useState(module?.title ?? '')
  const [summary, setSummary] = useState(module?.summary ?? '')
  const [prerequisiteModuleId, setPrerequisiteModuleId] = useState(module?.prerequisiteModuleId ?? NO_PREREQUISITE)
  const [publish, setPublish] = useState(module?.isPublished ?? true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(module?.title ?? '')
    setSummary(module?.summary ?? '')
    setPrerequisiteModuleId(module?.prerequisiteModuleId ?? NO_PREREQUISITE)
    setPublish(module?.isPublished ?? true)
  }, [module])

  const otherModules = modules.filter((row) => row.id !== module?.id)

  const save = async () => {
    if (title.trim().length < 2) return
    setSaving(true)
    try {
      const prerequisite = prerequisiteModuleId === NO_PREREQUISITE ? null : prerequisiteModuleId
      if (isEdit && module) {
        await updateLecturerModule(module.id, {
          title: title.trim(),
          summary: summary.trim() || undefined,
          prerequisiteModuleId: prerequisite,
          publish,
        })
        toast.success(`Module "${title.trim()}" updated.`)
      } else {
        await createLecturerModule({
          offeringId,
          title: title.trim(),
          summary: summary.trim() || undefined,
          prerequisiteModuleId: prerequisite,
          publish,
        })
        toast.success(`Module "${title.trim()}" saved.`)
      }
      await onSuccess()
    } catch (err) {
      toast.error(apiErrorMessage(err, isEdit ? 'Could not update that module.' : 'Could not add that module.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {isEdit ? 'Edit module' : 'Add module'}
        </h3>
        <FormInfoBox lines={isEdit ? formInfo.editModule : formInfo.addModule} />
      </div>
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Module title" />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Summary (optional)</label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What students will cover here…" rows={3} />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Prerequisite (optional)</label>
          <Select value={prerequisiteModuleId} onValueChange={setPrerequisiteModuleId}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PREREQUISITE}>None</SelectItem>
              {otherModules.map((row) => (
                <SelectItem key={row.id} value={row.id}>{row.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>Publish to students</span>
          <Switch checked={publish} onCheckedChange={setPublish} />
        </div>
      </div>
      <div style={{ padding: '0 24px 28px', display: 'flex', gap: 10 }}>
        <ConfirmAlertDialog
          trigger={
            <Button
              type="button"
              className="flex-1"
              disabled={title.trim().length < 2 || saving}
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save module' : 'Add module'}
            </Button>
          }
          title={isEdit ? 'Save this module?' : 'Add this module?'}
          tone="success"
          headlineLabel="Action"
          headline={isEdit ? 'Update module' : 'Add module'}
          summary={isEdit
            ? `Students will see the updated module "${title.trim() || module?.title}".`
            : `"${title.trim()}" will be added to this course.`}
          notices={[
            { icon: 'lock', label: publish ? 'Published modules appear in the student course feed.' : 'A draft stays hidden from students.' },
          ]}
          confirmLabel={isEdit ? 'Save module' : 'Add module'}
          confirmVariant="brand"
          loading={saving}
          onConfirm={() => void save()}
        />
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}
