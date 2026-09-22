import { Link } from '@tanstack/react-router'
import { Info, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const MODULE_HINT =
  'You need to create a module for this course first before adding a course material. If you have not created any, click here to create a module for this course.'

export function AddMaterialControl({
  offeringId,
  hasModules,
  onAdd,
  icon,
}: {
  offeringId: string
  hasModules: boolean
  onAdd: () => void
  icon?: 'plus' | 'upload'
}) {
  const Icon = icon === 'upload' ? Upload : Plus

  const button = (
    <Button
      type="button"
      disabled={!hasModules}
      onClick={() => { if (hasModules) onAdd() }}
      style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', gap: 6, opacity: hasModules ? 1 : 0.55 }}
    >
      <Icon style={{ width: 14, height: 14 }} /> Add material
    </Button>
  )

  if (hasModules) return button

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px] text-left">
            <NeedModuleHint offeringId={offeringId} />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: 'var(--info)', backgroundColor: 'var(--info-bg)', border: '1px solid var(--info)' }}
              aria-label={MODULE_HINT}
            >
              <Info style={{ width: 14, height: 14 }} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px] text-left">
            <NeedModuleHint offeringId={offeringId} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function NeedModuleHint({ offeringId }: { offeringId: string }) {
  return (
    <p className="text-xs font-medium leading-snug">
      You need to create a module for this course first before adding a course material. If you have not created any,{' '}
      <Link
        to="/lecturer/course-management"
        search={{ offeringId, addModule: true }}
        className="underline"
        style={{ color: 'inherit' }}
      >
        click here to create a module for this course
      </Link>
      .
    </p>
  )
}
