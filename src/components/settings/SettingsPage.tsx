import { Monitor, Moon, Navigation, Palette, RefreshCw, Sun, Type } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/stores/theme.store';

export function SettingsPage() {
  const {
    theme,
    setTheme,
    primaryHue,
    setPrimaryHue,
    fontSize,
    setFontSize,
    showNavLabels,
    setShowNavLabels,
    glassEffect,
    setGlassEffect,
  } = useThemeStore();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your application appearance and preferences." />

      <div className="grid gap-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Theme</h2>
          </div>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map((t) => (
                <Button
                  key={t.value}
                  variant={theme === t.value ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 cursor-pointer flex-col h-auto py-3 px-1 sm:flex-row sm:h-10 sm:py-0"
                  onClick={() => setTheme(t.value as 'light' | 'dark' | 'system')}
                >
                  <t.icon className="size-4" />
                  <span className="text-xs sm:text-sm">{t.label}</span>
                </Button>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Primary Color</h2>
          </div>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-full border shadow-sm"
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
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the hue of the primary color used throughout the app.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Font Size</h2>
          </div>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  disabled={fontSize <= 12}
                >
                  -
                </Button>
                <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  disabled={fontSize >= 24}
                >
                  +
                </Button>
              </div>
              <div className="text-sm border rounded px-2 py-1 bg-muted">Sample Text</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Increase or decrease the base font size for better readability.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Navigation</h2>
          </div>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Show labels</p>
                <p className="text-xs text-muted-foreground">
                  Display text labels below nav icons on mobile.
                </p>
              </div>
              <Switch checked={showNavLabels} onCheckedChange={setShowNavLabels} />
            </div>
            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Glass effect</p>
                <p className="text-xs text-muted-foreground">
                  Apply blur effects to headers and navigation.
                </p>
              </div>
              <Switch checked={glassEffect} onCheckedChange={setGlassEffect} />
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Version & Updates</h2>
          </div>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Version</p>
                <p className="text-xs text-muted-foreground">v{__APP_VERSION__}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="size-4" />
                Reload App
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Manually reload the application to ensure you're using the latest version.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
