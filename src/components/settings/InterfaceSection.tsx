import { Layout } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/stores/theme.store';

export function InterfaceSection() {
  const showNavLabels = useThemeStore((s) => s.showNavLabels);
  const setShowNavLabels = useThemeStore((s) => s.setShowNavLabels);
  const showDescriptions = useThemeStore((s) => s.showDescriptions);
  const setShowDescriptions = useThemeStore((s) => s.setShowDescriptions);
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const setGlassEffect = useThemeStore((s) => s.setGlassEffect);

  return (
    <section className="space-y-3">
      <SectionHeader title="Interface" icon={Layout} />
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show labels</p>
            <p className="text-xs text-muted-foreground">
              Display text labels below nav icons on mobile.
            </p>
          </div>
          <Switch
            checked={showNavLabels}
            onCheckedChange={setShowNavLabels}
            aria-label="Show nav labels"
          />
        </div>
        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium">Show descriptions</p>
            <p className="text-xs text-muted-foreground">
              Display subtitles in page headers and dialogs.
            </p>
          </div>
          <Switch
            checked={showDescriptions}
            onCheckedChange={setShowDescriptions}
            aria-label="Show descriptions"
          />
        </div>
        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium">Glass effect</p>
            <p className="text-xs text-muted-foreground">
              Apply blur effects to headers and navigation.
            </p>
          </div>
          <Switch
            checked={glassEffect}
            onCheckedChange={setGlassEffect}
            aria-label="Glass effect"
          />
        </div>
      </Card>
    </section>
  );
}
