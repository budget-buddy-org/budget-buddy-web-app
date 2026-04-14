import { createRootRoute } from '@tanstack/react-router'
import { RootComponent } from '@/components/layout/RootComponent'
import { RootErrorComponent } from '@/components/layout/RootErrorComponent'
import { NotFoundComponent } from '@/components/layout/NotFoundComponent'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
})
