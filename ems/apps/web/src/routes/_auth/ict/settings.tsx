import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { IctShell } from '@/components/IctShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  getIctSettings,
  ictProfileQueryKey,
  ictSettingsQueryKey,
  updateIctSettings,
  uploadIctLogo,
} from '@/lib/api/ict'
import { institutionBrandingQueryKey } from '@/hooks/useInstitutionBranding'
import { accountProfileQueryKey } from '@/lib/api/account'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/ict/settings')({
  component: SystemSettingsPage,
})

function SystemSettingsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data, isPending, error } = useQuery({ queryKey: ictSettingsQueryKey, queryFn: getIctSettings })
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    contactEmail: '',
    timezone: '',
    locale: 'en' as 'en' | 'fr' | 'rw',
    website: '',
    location: '',
    allowEditAfterSubmit: true,
    editWindowMinutes: 60,
    applicationFullOnly: true,
    tuitionFullOnly: false,
    levyFullOnly: false,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        shortName: data.shortName,
        contactEmail: data.contactEmail,
        timezone: data.timezone,
        locale: data.locale,
        website: data.website ?? '',
        location: data.location ?? '',
        allowEditAfterSubmit: data.attendancePolicy.allowEditAfterSubmit,
        editWindowMinutes: data.attendancePolicy.editWindowMinutes,
        applicationFullOnly: data.paymentPolicy.rules.find((rule) => rule.feeKind === 'ApplicationFee')?.mode === 'FullOnly',
        tuitionFullOnly: data.paymentPolicy.rules.find((rule) => rule.feeKind === 'TuitionFee')?.mode === 'FullOnly',
        levyFullOnly: data.paymentPolicy.rules.find((rule) => rule.feeKind === 'Levy')?.mode === 'FullOnly',
      })
      setLogoPreview(data.logoUrl)
    }
  }, [data])

  const invalidateBranding = async () => {
    await queryClient.invalidateQueries({ queryKey: ictSettingsQueryKey })
    await queryClient.invalidateQueries({ queryKey: ictProfileQueryKey })
    await queryClient.invalidateQueries({ queryKey: institutionBrandingQueryKey })
    await queryClient.invalidateQueries({ queryKey: accountProfileQueryKey })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (logoFile) await uploadIctLogo(logoFile)
      return updateIctSettings({
        name: form.name,
        shortName: form.shortName,
        contactEmail: form.contactEmail,
        timezone: form.timezone,
        locale: form.locale,
        website: form.website.trim() || null,
        location: form.location.trim() || null,
        attendancePolicy: {
          allowEditAfterSubmit: form.allowEditAfterSubmit,
          editWindowMinutes: form.editWindowMinutes,
        },
        paymentPolicy: {
          rules: [
            { feeKind: 'ApplicationFee', mode: form.applicationFullOnly ? 'FullOnly' : 'PartialAllowed' },
            { feeKind: 'TuitionFee', mode: form.tuitionFullOnly ? 'FullOnly' : 'PartialAllowed' },
            { feeKind: 'Levy', mode: form.levyFullOnly ? 'FullOnly' : 'PartialAllowed' },
            { feeKind: 'Other', mode: 'PartialAllowed' },
          ],
        },
      })
    },
    onSuccess: async (settings) => {
      setLogoFile(null)
      setLogoPreview(settings.logoUrl)
      toast.success('Institution settings saved.')
      await invalidateBranding()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save settings.')),
  })

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose a PNG, JPEG, WebP or SVG image.')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  return (
    <IctShell
      pageTitle="Settings"
      guide="Change the institution name, contact email, website, location, logo, timezone and language. Faculties, programmes and semester activation are Academic Admin screens, not settings."
    >
      <div className="animate-fade-up mx-auto w-full max-w-[760px]" style={{ padding: '32px 0 48px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Institution settings</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading settings…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load settings.')}</p>
        ) : (
          <form
            className="flex flex-col gap-4 p-5"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}
            onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}
          >
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>The institution short code cannot be changed here.</p>

            <div>
              <Label htmlFor="name">Institution name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="short">Short name</Label>
              <Input id="short" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Contact email</Label>
              <Input id="email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="website">University website URL</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.example.ac.rw"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Kigali, Rwanda"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <Label>School logo</Label>
              <div
                className="mt-2 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
              >
                <div
                  className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Institution logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>No logo</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                    Used on apply, sign-in and verification screens. PNG, JPEG, WebP or SVG up to 2 MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    {logoPreview ? 'Replace logo' : 'Upload logo'}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </div>
            <div>
              <Label>Locale</Label>
              <select className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)' }} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as 'en' | 'fr' | 'rw' })}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>

            <div
              className="rounded-xl p-4 flex flex-col gap-4"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  Attendance editing
                </p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Control whether lecturers can change attendance after it has been submitted.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="allow-edit">Allow editing after submit</Label>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    When off, submitted attendance is locked immediately.
                  </p>
                </div>
                <Switch
                  id="allow-edit"
                  checked={form.allowEditAfterSubmit}
                  onCheckedChange={(checked) => setForm({ ...form, allowEditAfterSubmit: checked })}
                />
              </div>
              {form.allowEditAfterSubmit ? (
                <div>
                  <Label htmlFor="edit-window">Edit window (minutes)</Label>
                  <Input
                    id="edit-window"
                    type="number"
                    min={0}
                    max={10080}
                    value={form.editWindowMinutes}
                    onChange={(e) => setForm({
                      ...form,
                      editWindowMinutes: Math.max(0, Math.min(10_080, Number(e.target.value) || 0)),
                    })}
                  />
                  <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    How long after submission a lecturer may still edit. Use 0 for no time limit.
                  </p>
                </div>
              ) : null}
            </div>

            <div
              className="rounded-xl p-4 flex flex-col gap-4"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  Payment collection
                </p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Control whether applicants and students must pay certain fees in full or may pay in instalments.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="application-full">Application fee — full payment only</Label>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Applicants must pay the entire application fee at once.
                  </p>
                </div>
                <Switch
                  id="application-full"
                  checked={form.applicationFullOnly}
                  onCheckedChange={(checked) => setForm({ ...form, applicationFullOnly: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="tuition-full">Tuition fees — full payment only</Label>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    When off, students may pay tuition in part payments (instalments).
                  </p>
                </div>
                <Switch
                  id="tuition-full"
                  checked={form.tuitionFullOnly}
                  onCheckedChange={(checked) => setForm({ ...form, tuitionFullOnly: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="levy-full">Levies — full payment only</Label>
                  <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Library, administrative and other levies.
                  </p>
                </div>
                <Switch
                  id="levy-full"
                  checked={form.levyFullOnly}
                  onCheckedChange={(checked) => setForm({ ...form, levyFullOnly: checked })}
                />
              </div>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save settings'}
            </Button>
          </form>
        )}
      </div>
    </IctShell>
  )
}
