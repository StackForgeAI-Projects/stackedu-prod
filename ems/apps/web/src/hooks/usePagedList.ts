import { useEffect, useMemo, useState } from 'react'

export const LIST_PAGE_SIZES = [5, 10, 25, 50, 100]

export function usePagedList<T>(
  items: T[],
  options?: { defaultPageSize?: number; resetKey?: string | number },
) {
  const defaultPageSize = options?.defaultPageSize ?? 5
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  useEffect(() => {
    setPage(1)
  }, [items.length, pageSize, options?.resetKey])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize) || 1)
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )
  const from = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, items.length)

  return {
    pageItems,
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    total: items.length,
    totalPages,
    from,
    to,
  }
}
