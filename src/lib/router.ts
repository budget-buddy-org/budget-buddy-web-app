import { createRouter } from '@tanstack/react-router';
import { RouteLoader } from '@/components/layout/RouteLoader';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPendingComponent: RouteLoader,
  defaultPendingMs: 100,
  defaultPendingMinMs: 300,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  // Cross-fade route content via the View Transitions API where supported
  // (Chrome, Safari). Unsupported browsers (Firefox) fall through to an
  // instant swap. Reduced-motion is handled in src/index.css.
  defaultViewTransition: true,
});
