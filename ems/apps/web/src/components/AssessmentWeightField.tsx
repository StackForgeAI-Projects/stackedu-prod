import { Input } from '@/components/ui/input'

export function AssessmentWeightField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>
        Share of the final mark (%)
      </label>
      <Input type="number" min={0} max={100} value={value} onChange={(event) => onChange(event.target.value)} />
      <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
        How much this piece counts toward the student's overall mark in the course.
      </p>
    </div>
  )
}
