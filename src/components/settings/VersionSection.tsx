import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function VersionSection() {
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <Section title="Version & Updates" icon={RefreshCw}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Current Version</p>
          <p className="text-xs text-muted-foreground">v{__APP_VERSION__}</p>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => globalThis.location.reload()}
        >
          <RefreshCw className="size-4" />
          Reload App
        </Button>
      </div>
      {canInstall && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-sm font-medium">Install App</p>
            <p className="text-xs text-muted-foreground">
              Add Budget Buddy to your home screen for a native app experience.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer"
            onClick={() => void promptInstall()}
          >
            <Download className="size-4" />
            Install
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Manually reload the application to ensure you're using the latest version.
      </p>
    </Section>
  );
}
