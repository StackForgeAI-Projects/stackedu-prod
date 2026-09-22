import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import {
  ICT_MANAGER, ICT_NAV, INTEGRATIONS, serviceStatusColors,
} from '@/data/ict'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/ict/integrations')({
  component: IntegrationsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Payment: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  SMS:     { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  Email:   { bg: '#EDE9FE',           color: '#7C3AED'        },
  Storage: { bg: 'var(--success-bg)', color: 'var(--success)' },
}

function IntegrationsPage() {
  const [testing, setTesting] = useState<string | null>(null)

  const handleTest = async (id: string) => {
    setTesting(id)
    await new Promise((r) => setTimeout(r, 1200))
    setTesting(null)
    const intg = INTEGRATIONS.find((i) => i.id === id)
    if (intg?.status === 'Operational') {
      toast.success(`Connection successful — ${intg.name} is responding normally.`)
    } else {
      toast.error(`Connection failed: ${intg?.name} returned a degraded response.`)
    }
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

        {/* Section header */}
        <div className="mb-6">
          <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Integrations</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Manage API connections to external services.</p>
        </div>

        {/* Integration cards — 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {INTEGRATIONS.map((intg) => {
            const sc  = serviceStatusColors(intg.status)
            const cat = CATEGORY_COLORS[intg.category]
            const isTest = testing === intg.id
            return (
              <div key={intg.id} style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 24 }}>
                <div className="flex items-start gap-4">
                  {/* Logo placeholder */}
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 48, height: 48, backgroundColor: intg.color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>
                    {intg.initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}>{intg.name}</h3>
                      <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: cat.bg, color: cat.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{intg.category}</span>
                    </div>
                    <p className="t-body-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>{intg.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="t-label px-1.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)', fontSize: 10 }}>{intg.status}</span>
                      <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Last tested: {intg.lastTested}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <Link to="/ict/integration-detail" search={{ id: intg.id }} className="flex-1">
                    <button
                      className="w-full py-2 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                      Configure
                    </button>
                  </Link>
                  <button onClick={() => handleTest(intg.id)} disabled={isTest}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', cursor: isTest ? 'not-allowed' : 'pointer', opacity: isTest ? 0.7 : 1 }}
                    onMouseEnter={(e) => { if (!isTest) e.currentTarget.style.backgroundColor = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}>
                    {isTest ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Testing…</> : 'Test connection'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </AppShell>
  )
}
