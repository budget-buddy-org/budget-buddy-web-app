import { createLazyFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/components/auth/LoginPage'

export const Route = createLazyFileRoute('/_auth/login')({
  component: LoginPage,
})
