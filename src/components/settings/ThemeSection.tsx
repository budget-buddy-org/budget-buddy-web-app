import { Moon, Sun, SunMoon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: SunMoon, label: 'System' },
] as const;

export function ThemeSection() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const glassEffect = useThemeStore((s) => s.glassEffect);

  return (
    <section className="space-y-3">
      <SectionHeader title="Theme" icon={Sun} />
      <Card className="p-4">
        <div
          role="tablist"
          aria-label="Theme"
          className={cn(
            'flex p-1 bg-muted rounded-pill transition-colors',
            glassEffect && 'bg-muted/50 backdrop-blur-md',
          )}
        >
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={theme === t.value}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                theme === t.value
                  ? cn(
                      'bg-background text-foreground shadow-card',
                      glassEffect && 'bg-background/80 backdrop-blur-sm',
                    )
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
              )}
              onClick={() => setTheme(t.value)}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
