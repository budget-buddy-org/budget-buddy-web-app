import { createLazyFileRoute } from '@tanstack/react-router'
import { CategoriesPage } from '@/components/categories/CategoriesPage'

export const Route = createLazyFileRoute('/_app/categories/')({
  component: CategoriesPage,
})
