import { Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeStore } from '@/stores/theme.store';

export function PrimaryColorSection() {
  const primaryHue = useThemeStore((s) => s.primaryHue);
  const setPrimaryHue = useThemeStore((s) => s.setPrimaryHue);

  return (
    <section className="space-y-3">
      <SectionHeader title="Primary Color" icon={Palette} />
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="size-10 rounded-pill border shadow-card"
            style={{ backgroundColor: `hsl(${primaryHue} 70% 50%)` }}
          />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Hue: {primaryHue}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={primaryHue}
              onChange={(e) => setPrimaryHue(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-pill appearance-none cursor-pointer accent-primary"
              aria-label="Primary color hue"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust the hue of the primary color used throughout the app.
        </p>
      </Card>
    </section>
  );
}
