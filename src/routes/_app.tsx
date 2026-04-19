import { createFileRoute } from '@tanstack/react-router';
import { AppErrorComponent } from '@/components/layout/AppErrorComponent';
import { ProtectedAppLayout } from '@/components/layout/ProtectedAppLayout';

export const Route = createFileRoute('/_app')({
  component: ProtectedAppLayout,
  errorComponent: AppErrorComponent,
});
