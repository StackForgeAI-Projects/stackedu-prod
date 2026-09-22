import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Info } from 'lucide-react'
import { ApplyLayout, type ApplyStep } from '@/components/ApplyLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/form')({
  component: ApplyFormPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const FORM_STEPS: ApplyStep[] = [
  { id: 1, label: 'Personal Details'    },
  { id: 2, label: 'Academic History'    },
  { id: 3, label: 'Programme Selection' },
  { id: 4, label: 'Parent / Guardian'   },
  { id: 5, label: 'Additional Info'     },
  { id: 6, label: 'Documents'           },
  { id: 7, label: 'Application Fee'     },
]

const PROGRESS_MAP: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 }

// ─────────────────────────────────────────────────────────────────────────────

function ApplyFormPage() {
  const navigate = useNavigate()
  const [currentStep,    setCurrentStep]    = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const goNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((p) => [...p, currentStep])
    }
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1)
    } else {
      navigate({ to: '/apply/documents' })
    }
  }

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  return (
    <ApplyLayout
      steps={FORM_STEPS}
      currentStep={currentStep}
      completedSteps={completedSteps}
      progressPercent={PROGRESS_MAP[currentStep]}
      showBanner
    >
      {currentStep === 1 && <Step1 onNext={goNext} />}
      {currentStep === 2 && <Step2 onNext={goNext} onBack={goBack} />}
      {currentStep === 3 && <Step3 onNext={goNext} onBack={goBack} />}
      {currentStep === 4 && <Step4 onNext={goNext} onBack={goBack} />}
      {currentStep === 5 && <Step5 onNext={goNext} onBack={goBack} />}
    </ApplyLayout>
  )
}

// ── Shared layout helpers ─────────────────────────────────────────────────────

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius:    'var(--radius-xl)',
        boxShadow:       'var(--shadow-sm)',
        border:          '1px solid var(--border)',
        padding:         '2rem',
      }}
    >
      {children}
    </div>
  )
}

function SectionDivider({ title, alt }: { title: string; alt?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: alt ? 'var(--background)' : 'var(--card)',
        margin:          '1.5rem -2rem',
        padding:         '0.75rem 2rem',
        borderTop:       '1px solid var(--border)',
        borderBottom:    '1px solid var(--border)',
      }}
    >
      <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-1.5"
      style={full ? { gridColumn: '1 / -1' } : {}}
    >
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NavRow({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onBack?:      () => void
  onNext:       () => void
  nextLabel?:   string
  nextDisabled?: boolean
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>← Back</Button>
        ) : (
          <div />
        )}
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className="font-semibold transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
        >
          {nextLabel}
        </Button>
      </div>
      <div className="flex justify-center mt-3">
        <button
          type="button"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#0D7A28', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Save progress
        </button>
      </div>
    </div>
  )
}

// ── Country list (abbreviated for UI purposes) ────────────────────────────────

const COUNTRIES = [
  'Rwanda', 'Burundi', 'Democratic Republic of Congo', 'Kenya',
  'Tanzania', 'Uganda', 'Ethiopia', 'Nigeria', 'South Africa', 'Other',
]

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Personal Details
// ─────────────────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Personal Details
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Confirm your basic and contact information.
      </p>

      <SectionDivider title="BASIC INFORMATION" />
      <FieldGrid>
        <Field label="Full name">
          <Input defaultValue="Amina Uwase" readOnly style={{ backgroundColor: 'var(--muted)', cursor: 'default' }} />
        </Field>
        <Field label="Date of birth">
          <Input type="date" defaultValue="2002-04-15" />
        </Field>
        <Field label="Gender">
          <Select defaultValue="female">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="other">Other / Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nationality">
          <Select defaultValue="Rwanda">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="National ID / Passport number">
          <Input placeholder="1 1990 7 0000000 1 00" />
        </Field>
        <Field label="Country of birth">
          <Select defaultValue="Rwanda">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGrid>

      <SectionDivider title="CONTACT & RESIDENCE" alt />
      <FieldGrid>
        <Field label="Phone number">
          <Input defaultValue="+250 788 456 789" readOnly style={{ backgroundColor: 'var(--muted)', cursor: 'default' }} />
        </Field>
        <Field label="Email address">
          <Input defaultValue="amina.uwase@gmail.com" readOnly style={{ backgroundColor: 'var(--muted)', cursor: 'default' }} />
        </Field>
        <Field label="Country of residence">
          <Select defaultValue="Rwanda">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City of residence">
          <Input placeholder="e.g. Kigali" />
        </Field>
        <Field label="Physical address" full>
          <Textarea placeholder="Street, sector, district..." rows={3} />
        </Field>
      </FieldGrid>

      <NavRow onNext={onNext} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Academic History
// ─────────────────────────────────────────────────────────────────────────────

const YEARS = Array.from({ length: 20 }, (_, i) => String(2024 - i))
const QUALIFICATIONS = ["O-Level", "A-Level", "Diploma", "Bachelor's", "Other"]

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Academic History
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Tell us about your previous education.
      </p>

      <SectionDivider title="PREVIOUS EDUCATION" />
      <FieldGrid>
        <Field label="Previous institution name">
          <Input placeholder="e.g. Lycée de Kigali" />
        </Field>
        <Field label="Country of institution">
          <Select defaultValue="Rwanda">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Highest qualification">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
            <SelectContent>
              {QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Year of completion">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Overall grade / GPA">
          <Input placeholder="e.g. A, 3.8, 72%" />
        </Field>
        <Field label="Subjects studied" full>
          <Textarea placeholder="e.g. Mathematics, Physics, Chemistry, Biology..." rows={3} />
        </Field>
      </FieldGrid>

      <SectionDivider title="ACHIEVEMENTS (OPTIONAL)" alt />
      <div className="mt-4">
        <Field label="Academic awards or distinctions">
          <Textarea placeholder="Describe any awards, scholarships, or honours you have received..." rows={3} />
        </Field>
      </div>

      <NavRow onBack={onBack} onNext={onNext} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Programme Selection
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAMMES  = ['Computer Science', 'Information Technology', 'Mathematics', 'Business Administration']
const ENTRY_YEARS = ['2025/2026', '2026/2027']
const STUDY_MODES = ['Full-time', 'Part-time']
const HEAR_ABOUT  = ['University website', 'Social media', 'Friend or family', 'Education fair', 'Other']

function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [financialAid, setFinancialAid] = useState(false)

  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Programme Selection
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Confirm the programme you are applying for.
      </p>

      <SectionDivider title="PROGRAMME DETAILS" />
      <FieldGrid>
        <Field label="Programme of interest">
          <Select defaultValue="Computer Science">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROGRAMMES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Entry year">
          <Select defaultValue="2025/2026">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTRY_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Study mode">
          <Select defaultValue="Full-time">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STUDY_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGrid>

      <SectionDivider title="ADDITIONAL" alt />
      <div className="mt-4 flex flex-col gap-5">
        <Field label="How did you hear about us?">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>
              {HEAR_ABOUT.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center justify-between p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Financial aid interest
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Indicate if you would like to be considered for financial aid
            </p>
          </div>
          <Switch checked={financialAid} onCheckedChange={setFinancialAid} />
        </div>

        {financialAid && (
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{
              backgroundColor: 'var(--info-bg)',
              border:          '1px solid rgba(37,99,235,0.25)',
            }}
          >
            <Info size={15} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: 'var(--info)', lineHeight: 1.5 }}>
              Financial aid applications are reviewed after admission. Indicating interest does not affect your admission decision.
            </p>
          </div>
        )}
      </div>

      <NavRow onBack={onBack} onNext={onNext} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Parent / Guardian
// ─────────────────────────────────────────────────────────────────────────────

const GUARDIAN_TYPES = ['Father', 'Mother', 'Legal Guardian']

function Step4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Parent / Guardian
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Provide contact details for your parent or legal guardian.
      </p>

      <SectionDivider title="GUARDIAN INFORMATION" />
      <FieldGrid>
        <Field label="Guardian type">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {GUARDIAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Full name">
          <Input placeholder="Guardian's full name" />
        </Field>
        <Field label="Relationship">
          <Input placeholder="e.g. Father, Aunt, Legal Guardian" />
        </Field>
        <Field label="Phone number">
          <Input type="tel" placeholder="+250 7XX XXX XXX" />
        </Field>
        <Field label="Email address (optional)">
          <Input type="email" placeholder="guardian@email.com" />
        </Field>
        <Field label="Occupation">
          <Input placeholder="e.g. Teacher, Farmer, Business Owner" />
        </Field>
        <Field label="Employer (optional)">
          <Input placeholder="e.g. Ministry of Education" />
        </Field>
      </FieldGrid>

      <NavRow onBack={onBack} onNext={onNext} />
    </StepCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Additional Info
// ─────────────────────────────────────────────────────────────────────────────

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Friend', 'Colleague', 'Other']

function Step5({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [statement,      setStatement]      = useState('')
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false)
  const [specialDesc,    setSpecialDesc]    = useState('')
  const [declared,       setDeclared]       = useState(false)

  const wordCount = statement.trim().split(/\s+/).filter(Boolean).length
  const wordsMet  = wordCount >= 200

  return (
    <StepCard>
      <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
        Additional Information
      </h2>
      <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Complete your application with a personal statement and final declaration.
      </p>

      {/* Personal statement */}
      <SectionDivider title="PERSONAL STATEMENT" />
      <div className="mt-4">
        <Label>Personal statement</Label>
        <div className="relative mt-1.5">
          <Textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={8}
            placeholder="Tell us about yourself, your motivations, and why you are applying to this programme..."
            style={{ minHeight: 200, paddingBottom: 28 }}
          />
          <span
            className="absolute bottom-2 right-3 text-xs tabular-nums"
            style={{ color: wordsMet ? 'var(--success)' : 'var(--muted-foreground)' }}
          >
            {wordCount} / 200 words minimum
          </span>
        </div>
      </div>

      {/* Special needs */}
      <SectionDivider title="SPECIAL NEEDS" alt />
      <div className="mt-4 flex flex-col gap-4">
        <div
          className="flex items-center justify-between p-4 rounded-lg"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Do you have any disabilities or special needs requiring accommodation?
            </p>
          </div>
          <Switch checked={hasSpecialNeeds} onCheckedChange={setHasSpecialNeeds} />
        </div>
        <div
          style={{
            maxHeight:  hasSpecialNeeds ? 160 : 0,
            overflow:   'hidden',
            transition: 'max-height 250ms ease-out',
          }}
        >
          {hasSpecialNeeds && (
            <div className="flex flex-col gap-1.5">
              <Label>Please describe your requirements</Label>
              <Textarea
                value={specialDesc}
                onChange={(e) => setSpecialDesc(e.target.value)}
                rows={3}
                placeholder="Describe any accommodations you may need..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Emergency contact */}
      <SectionDivider title="EMERGENCY CONTACT" />
      <FieldGrid>
        <Field label="Full name">
          <Input placeholder="Emergency contact name" />
        </Field>
        <Field label="Phone number">
          <Input type="tel" placeholder="+250 7XX XXX XXX" />
        </Field>
        <Field label="Relationship">
          <Select>
            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGrid>

      {/* Declaration */}
      <SectionDivider title="DECLARATION" alt />
      <div className="mt-4 flex items-start gap-3 p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
        <Checkbox
          id="declaration"
          checked={declared}
          onCheckedChange={(v) => setDeclared(v as boolean)}
          className="mt-0.5"
        />
        <Label htmlFor="declaration" className="cursor-pointer font-normal text-sm leading-relaxed">
          I confirm that all information provided is accurate and complete. I understand that providing false
          information may result in disqualification.
        </Label>
      </div>

      <NavRow
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to documents"
        nextDisabled={!declared}
      />
    </StepCard>
  )
}
