import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, Copy, Mail, Clock, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { ApplyTopBar } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/confirmation')({
  component: ApplyConfirmationPage,
})

const APP_ID = 'APP-2025-04872'

// ─────────────────────────────────────────────────────────────────────────────

function ApplyConfirmationPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(APP_ID).catch(() => {})
    setCopied(true)
    toast.success('Application ID copied.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <ApplyTopBar progressPercent={100} />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[600px] text-center animate-fade-up">

          {/* Success icon with glow */}
          <div
            className="inline-flex items-center justify-center rounded-full mb-6"
            style={{
              width:     72,
              height:    72,
              boxShadow: '0 0 40px rgba(13, 122, 40, 0.25)',
            }}
          >
            <CheckCircle2
              size={72}
              style={{ color: 'var(--success)' }}
              strokeWidth={1.5}
            />
          </div>

          {/* Heading */}
          <h1
            className="t-h1 mb-3"
            style={{
              fontFamily:    'var(--font-display)',
              color:         'var(--foreground)',
              letterSpacing: '-0.015em',
            }}
          >
            Application Submitted!
          </h1>
          <p className="t-body-lg mb-8" style={{ color: 'var(--muted-foreground)' }}>
            Your application has been received and is under review.
          </p>

          {/* Application ID card */}
          <div
            className="mx-auto mb-8 px-6 py-5 rounded-xl"
            style={{
              backgroundColor: 'var(--ink)',
              maxWidth:        400,
            }}
          >
            <p className="t-label mb-2" style={{ color: 'var(--ink-muted)' }}>
              YOUR APPLICATION ID
            </p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span
                style={{
                  fontFamily:  'var(--font-mono)',
                  fontSize:    '1.5rem',
                  fontWeight:  700,
                  color:       '#FFFFFF',
                  letterSpacing: '0.02em',
                }}
              >
                {APP_ID}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{
                  width:           32,
                  height:          32,
                  backgroundColor: copied ? 'rgba(32,244,78,0.15)' : 'rgba(255,255,255,0.08)',
                  border:          'none',
                  cursor:          'pointer',
                  color:           copied ? 'var(--brand)' : 'var(--ink-muted)',
                  flexShrink:      0,
                }}
                aria-label="Copy application ID"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              Save this ID. You will need it to track your application.
            </p>
          </div>

          {/* What happens next */}
          <h3
            className="text-sm font-semibold mb-4 uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            What happens next
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            {[
              {
                icon:  Mail,
                bg:    'var(--info-bg)',
                color: 'var(--info)',
                title: 'Check your email',
                desc:  'A confirmation receipt has been sent to your email address',
              },
              {
                icon:  Clock,
                bg:    'var(--warning-bg)',
                color: 'var(--warning)',
                title: 'Application review',
                desc:  'Our admissions team will review your application within 5–7 business days',
              },
              {
                icon:  Bell,
                bg:    'rgba(13,122,40,0.1)',
                color: '#0D7A28',
                title: 'Get notified',
                desc:  'You will be notified by email and SMS when a decision is made',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 36, height: 36, backgroundColor: item.bg }}
                  >
                    <Icon size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/apply/track">
              <Button className="font-semibold px-6 transition-transform duration-150 hover:-translate-y-px active:translate-y-0">
                Track my application
              </Button>
            </Link>
            <Button
              variant="outline"
              className="px-6"
              onClick={() => window.open('#', '_blank')}
            >
              Return to university website
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
