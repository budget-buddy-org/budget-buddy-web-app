import { createLazyFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings/SettingsPage'

export const Route = createLazyFileRoute('/_app/settings')({
  component: SettingsPage,
})
