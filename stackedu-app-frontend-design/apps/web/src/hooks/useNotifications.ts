import { useQuery } from '@tanstack/react-query'

// TODO: connect to notifications API endpoint
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => [] as unknown[],
  })
}
