import { createLazyFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/components/auth/RegisterPage'

export const Route = createLazyFileRoute('/_auth/register')({
  component: RegisterPage,
})
