import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconActionButton } from '@/components/IconActionButton'
import { LIST_PAGE_SIZES, usePagedList } from '@/hooks/usePagedList'

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = LIST_PAGE_SIZES,
  itemLabel = 'items',
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const singular: Record<string, string> = { classes: 'class', courses: 'course', items: 'item' }
  const noun = total === 1 ? (singular[itemLabel] ?? itemLabel.replace(/s$/, '')) : itemLabel

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Show</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-lg px-2 text-sm outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
          per page · {total} {noun}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
          {total === 0 ? `0 ${noun}` : `${from}-${to} of ${total}`}
        </span>
        <IconActionButton
          label="Previous page"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        />
        <IconActionButton
          label="Next page"
          icon={ChevronRight}
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        />
      </div>
    </div>
  )
}

export function PagedList<T>({
  items,
  getKey,
  renderItem,
  empty,
  defaultPageSize = 5,
  resetKey,
  itemLabel = 'items',
  gap = 12,
}: {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T, index: number) => ReactNode
  empty?: ReactNode
  defaultPageSize?: number
  resetKey?: string | number
  itemLabel?: string
  gap?: number
}) {
  const paged = usePagedList(items, { defaultPageSize, resetKey })
  if (items.length === 0) return <>{empty ?? null}</>
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {paged.pageItems.map((item, index) => (
          <div key={getKey(item)}>{renderItem(item, index)}</div>
        ))}
      </div>
      <ListPagination
        page={paged.page}
        pageSize={paged.pageSize}
        total={paged.total}
        onPageChange={paged.setPage}
        onPageSizeChange={paged.setPageSize}
        itemLabel={itemLabel}
      />
    </div>
  )
}
