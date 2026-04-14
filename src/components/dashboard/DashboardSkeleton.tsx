import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Skeleton className="col-span-2 h-24 md:col-span-1" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="hidden h-52 md:block" />
      <Skeleton className="h-64" />
    </div>
  )
}
