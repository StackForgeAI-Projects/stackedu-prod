import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, INTEGRATIONS, serviceStatusColors,
  type ServiceStatus,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/integration-detail')({
  component: IntegrationDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: String(search.id ?? ''),
  }),
})

// ── Masked API key input ──────────────────────────────────────────────────────

function MaskedInput({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      <div className="flex items-center gap-2 rounded-lg px-3"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none py-2.5"
          style={{ color: 'var(--foreground)', fontFamily: show ? undefined : 'var(--font-mono)' }}
        />
        <button onClick={() => setShow((s) => !s)} type="button"
          style={{ color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Payment: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  SMS:     { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Email:   { bg: '#EDE9FE',           color: '#7C3AED'        },
  Storage: { bg: 'var(--success-bg)', color: 'var(--success)' },
}

// ─────────────────────────────────────────────────────────────────────────────

function IntegrationDetailPage() {
  const { id }        = Route.useSearch()
  const integration   = INTEGRATIONS.find((i) => i.id === id)

  const [status, setStatus]   = useState<ServiceStatus>(integration?.status ?? 'Operational')
  const [testing, setTesting] = useState(false)
  const [form, setForm]       = useState({ apiKey: '', apiSecret: '', webhookUrl: '', environment: 'Production' })

  if (!integration) {
    return (
      <AppShell
        navItems={ICT_NAV}
        pageTitle="Integrations"
        userName={ICT_MANAGER.fullName}
        userRole={ICT_MANAGER.role}
        userInitials={ICT_MANAGER.initials}
        infoCardLabel="ICT MANAGER"
        infoCardValue={ICT_MANAGER.institution}
        infoCardSubtext={ICT_MANAGER.office}
      >
        <div className="p-8">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Integration not found.</p>
          <Link to="/ict/integrations" className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--success)' }}>
            ← Back to Integrations
          </Link>
        </div>
      </AppShell>
    )
  }

  const sc  = serviceStatusColors(status)
  const cat = CATEGORY_COLORS[integration.category]

  const handleSave = () => {
    toast.success(`Configuration saved for ${integration.name}.`)
  }

  const handleTest = async () => {
    setTesting(true)
    await new Promise((r) => setTimeout(r, 1200))
    setTesting(false)
    if (status === 'Operational') {
      toast.success(`Connection successful — ${integration.name} is responding normally.`)
    } else {
      toast.error(`Connection failed: ${integration.name} returned a degraded response.`)
    }
  }

  const handleDisconnect = () => {
    setStatus('Disconnected' as ServiceStatus)
    toast.success(`${integration.name} disconnected.`)
  }

  return (
    <AppShell
      navItems={ICT_NAV}
      pageTitle="Integrations"
      userName={ICT_MANAGER.fullName}
      userRole={ICT_MANAGER.role}
      userInitials={ICT_MANAGER.initials}
      unreadCount={3}
      infoCardLabel="ICT MANAGER"
      infoCardValue={ICT_MANAGER.institution}
      infoCardSubtext={ICT_MANAGER.office}
    >
      <div className="animate-fade-up" style={{ padding: '32px 32px 48px' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6">
          <Link to="/ict/dashboard" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            ICT Manager
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <Link to="/ict/integrations" className="t-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--success)' }}>
            Integrations
          </Link>
          <ChevronRight style={{ width: 12, height: 12, color: 'var(--muted-foreground)' }} />
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{integration.name}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 48, height: 48, backgroundColor: integration.color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>
              {integration.initials}
            </div>
            <div>
              <h1 className="t-h1 mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
                {integration.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: cat.bg, color: cat.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                  {integration.category}
                </span>
                <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>
                  {status}
                </span>
              </div>
            </div>
          </div>
          <Link to="/ict/integrations">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Integrations
            </button>
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>

          {/* ── Main (65%) — configuration form ────────────────────────────── */}
          <div className="flex flex-col gap-5" style={{ flex: '0 0 65%', minWidth: 0 }}>

            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
              <h2 className="t-h3 mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>API Configuration</h2>
              <div className="flex flex-col gap-5">
                <MaskedInput
                  label="API KEY"
                  placeholder="Enter API key…"
                  value={form.apiKey}
                  onChange={(v) => setForm((f) => ({ ...f, apiKey: v }))}
                />
                <MaskedInput
                  label="API SECRET"
                  placeholder="Enter API secret…"
                  value={form.apiSecret}
                  onChange={(v) => setForm((f) => ({ ...f, apiSecret: v }))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>WEBHOOK URL (OPTIONAL)</label>
                  <input
                    value={form.webhookUrl}
                    onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                    placeholder="https://sfu.ac.rw/webhooks/…"
                    style={{ width: '100%', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', outline: 'none' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="t-label" style={{ color: 'var(--muted-foreground)' }}>ENVIRONMENT</label>
                  <select
                    value={form.environment}
                    onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
                    style={{ fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}>
                    <option value="Production">Production</option>
                    <option value="Sandbox">Sandbox</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity duration-150"
                    style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
                    Save configuration
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{ border: '1px solid var(--error)', color: 'var(--error)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--error-bg)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Sidebar (35%) ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4" style={{ flex: '0 0 calc(35% - 24px)', minWidth: 0 }}>

            {/* Status card */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Connection Status</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>STATUS</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
                    {status}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>CATEGORY</p>
                  <span className="t-label px-2 py-0.5 inline-flex"
                    style={{ backgroundColor: cat.bg, color: cat.color, borderRadius: 'var(--radius-sm)' }}>
                    {integration.category}
                  </span>
                </div>
                <div>
                  <p className="t-label mb-1.5" style={{ color: 'var(--muted-foreground)' }}>LAST TESTED</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--foreground)' }}>{integration.lastTested}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>About</h3>
              <p className="t-body-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{integration.description}</p>
            </div>

            {/* Test connection */}
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', fontSize: '0.9375rem' }}>Diagnostics</h3>
              <button
                onClick={handleTest}
                disabled={testing}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!testing) e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                {testing
                  ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Testing…</>
                  : 'Test connection'
                }
              </button>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  )
}
