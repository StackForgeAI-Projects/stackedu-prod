import { useQuery } from '@tanstack/react-query'
import { getStudent } from '@/lib/api/students'

export function useStudentRecord(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: Boolean(studentId),
  })
}
