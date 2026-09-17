import { AlertCircle } from 'lucide-react'

export function TimetableClashBanner({
  clashes,
  uniqueCount,
  hint,
}: {
  clashes: Array<{ message: string }>
  uniqueCount: number
  hint: string
}) {
  if (clashes.length === 0) return null

  return (
    <div className="mb-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error)' }}>
      <div className="flex items-start gap-3">
        <AlertCircle className="shrink-0 mt-0.5" style={{ width: 16, height: 16, color: 'var(--error)' }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
            {uniqueCount === 1 ? 'A class is double-booked.' : `${uniqueCount} classes are double-booked.`}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {clashes.map((clash) => (
              <li key={clash.message} className="text-sm" style={{ color: 'var(--error)' }}>{clash.message}</li>
            ))}
          </ul>
          <p className="t-caption mt-2" style={{ color: 'var(--error)' }}>{hint}</p>
        </div>
      </div>
    </div>
  )
}
