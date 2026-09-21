import { createFileRoute } from '@tanstack/react-router'
import { GraduationCap, BookOpen, CreditCard, ClipboardList, Library, ShieldCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/demo')({
  component: DemoSwitcherPage,
})

// ─────────────────────────────────────────────────────────────────────────────

interface RoleCard {
  name: string
  description: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  destination: string
}

const ROLES: RoleCard[] = [
  {
    name:        'Student',
    description: 'View courses, results, fees and e-library',
    icon:        GraduationCap,
    iconBg:      '#20F44E',
    iconColor:   '#05131D',
    destination: '/student/dashboard',
  },
  {
    name:        'Lecturer',
    description: 'Manage courses, attendance and results',
    icon:        BookOpen,
    iconBg:      '#2563EB',
    iconColor:   '#FFFFFF',
    destination: '/lecturer/dashboard',
  },
  {
    name:        'Bursar',
    description: 'Manage fees, payments and financial reports',
    icon:        CreditCard,
    iconBg:      '#CA8A04',
    iconColor:   '#FFFFFF',
    destination: '/bursar/dashboard',
  },
  {
    name:        'Academic Admin',
    description: 'Manage admissions, students and programmes',
    icon:        ClipboardList,
    iconBg:      '#7C3AED',
    iconColor:   '#FFFFFF',
    destination: '/academic/dashboard',
  },
  {
    name:        'Librarian',
    description: 'Manage e-library resources, collections and requests',
    icon:        Library,
    iconBg:      '#B91C1C',
    iconColor:   '#FFFFFF',
    destination: '/librarian/dashboard',
  },
  {
    name:        'ICT Manager',
    description: 'Manage users, system settings and integrations',
    icon:        ShieldCheck,
    iconBg:      '#05131D',
    iconColor:   '#20F44E',
    destination: '/ict/dashboard',
  },
  {
    name:        'Apply Portal',
    description: 'Prospective student application flow',
    icon:        ExternalLink,
    iconBg:      '#0D9488',
    iconColor:   '#FFFFFF',
    destination: '/apply',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

function RoleCardItem({ role }: { role: RoleCard }) {
  const Icon = role.icon

  return (
    <div
      className="role-card"
      style={{
        backgroundColor: 'var(--card)',
        borderRadius:    'var(--radius-xl)',
        padding:         '1.5rem',
        boxShadow:       'var(--shadow-sm)',
        border:          '1px solid var(--border)',
        display:         'flex',
        flexDirection:   'column',
        gap:             '1rem',
        transition:      'box-shadow 150ms ease-out, transform 150ms ease-out',
        cursor:          'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform  = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform  = 'translateY(0)'
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width:           56,
          height:          56,
          borderRadius:    '50%',
          backgroundColor: role.iconBg,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}
      >
        <Icon size={24} color={role.iconColor} strokeWidth={1.75} />
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '1.125rem',
            fontWeight:    500,
            lineHeight:    1.4,
            color:         'var(--foreground)',
            marginBottom:  '0.375rem',
          }}
        >
          {role.name}
        </h3>
        <p
          style={{
            fontSize:   '0.75rem',
            lineHeight: 1.4,
            color:      'var(--muted-foreground)',
          }}
        >
          {role.description}
        </p>
      </div>

      {/* CTA */}
      <Button
        variant="outline"
        className="w-full"
        style={{
          borderColor: '#0D7A28',
          color:       '#0D7A28',
          fontWeight:  500,
          fontSize:    '0.875rem',
        }}
        onClick={() => window.open(role.destination, '_blank')}
      >
        {role.name === 'Apply Portal' ? 'Open Apply Portal' : `Enter as ${role.name}`}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function DemoSwitcherPage() {
  return (
    <div
      style={{
        minHeight:       '100vh',
        backgroundColor: 'var(--background)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '3rem 1.5rem',
      }}
    >
      {/* Logo */}
      <img
        src="/stackedu-logo.png"
        alt="StackEDU"
        style={{ height: 48, marginBottom: '1.5rem', objectFit: 'contain' }}
      />

      {/* Heading */}
      <h1
        style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '2rem',
          fontWeight:    600,
          lineHeight:    1.2,
          letterSpacing: '-0.015em',
          color:         'var(--foreground)',
          textAlign:     'center',
          marginBottom:  '0.5rem',
        }}
      >
        StackEDU Demo
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize:     '0.875rem',
          lineHeight:   1.5,
          color:        'var(--muted-foreground)',
          textAlign:    'center',
          marginBottom: '2.5rem',
        }}
      >
        Select a role to preview
      </p>

      {/* Role grid */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 '1.5rem',
          width:               '100%',
          maxWidth:            900,
        }}
        className="demo-grid"
      >
        {ROLES.map((role) => (
          <RoleCardItem key={role.name} role={role} />
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop:  '2.5rem',
          fontSize:   '0.75rem',
          lineHeight: 1.4,
          color:      'var(--muted-foreground)',
          textAlign:  'center',
        }}
      >
        StackEDU by StackForgeAI
      </p>
    </div>
  )
}
