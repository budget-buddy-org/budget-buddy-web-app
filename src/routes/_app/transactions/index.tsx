import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/transactions/')({
  validateSearch: (search: Record<string, unknown>) => ({
    add: (search.add as string) || undefined,
    edit: (search.edit as string) || undefined,
  }),
})
