import { useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Globe,
  LogOut,
  Moon,
  Navigation,
  Palette,
  RefreshCw,
  Sun,
  SunMoon,
  Type,
  User,
} from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { cn } from '@/lib/cn';
import { getConfig } from '@/lib/config';
import {
  browserLocale,
  currencyLabel,
  formatCurrency,
  formatDate,
  ISO_CURRENCIES,
  localeCurrency,
} from '@/lib/formatters';
import { useThemeStore } from '@/stores/theme.store';
import type { DateFormatStyle } from '@/stores/user-preferences.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

const NUMBER_LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en-US', label: 'English (US) — 1,234.56' },
  { value: 'en-GB', label: 'English (EU) — 1,234.56' },
  { value: 'de-DE', label: 'German — 1.234,56' },
  { value: 'fr-FR', label: 'French — 1 234,56' },
  { value: 'de-CH', label: "Swiss — 1'234.56" },
  { value: 'hi-IN', label: 'Indian — 1,23,456' },
  { value: 'ja-JP', label: 'Japanese — 1,234' },
];

export function SettingsPage() {
  const { user, signoutRedirect } = useAuth();
  const queryClient = useQueryClient();
  const { canInstall, promptInstall } = useInstallPrompt();
  const config = getConfig();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const primaryHue = useThemeStore((s) => s.primaryHue);
  const setPrimaryHue = useThemeStore((s) => s.setPrimaryHue);
  const fontSize = useThemeStore((s) => s.fontSize);
  const setFontSize = useThemeStore((s) => s.setFontSize);
  const showNavLabels = useThemeStore((s) => s.showNavLabels);
  const setShowNavLabels = useThemeStore((s) => s.setShowNavLabels);
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const setGlassEffect = useThemeStore((s) => s.setGlassEffect);

  const prefCurrency = useUserPreferencesStore((s) => s.currency);
  const prefDateFormat = useUserPreferencesStore((s) => s.dateFormat);
  const prefNumberLocale = useUserPreferencesStore((s) => s.numberLocale);
  const setPrefCurrency = useUserPreferencesStore((s) => s.setCurrency);
  const setPrefDateFormat = useUserPreferencesStore((s) => s.setDateFormat);
  const setPrefNumberLocale = useUserPreferencesStore((s) => s.setNumberLocale);
  const resolvedNumberLocale = prefNumberLocale ?? browserLocale();

  const profileUrl = user?.profile?.profile || config.VITE_OIDC_USER_MANAGEMENT_URL;

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your application appearance and preferences." />

      <div className="grid gap-6">
        <section className="space-y-3">
          <SectionHeader title="Account" icon={User} />
          <Card className="p-4 space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {user?.profile.name || user?.profile.preferred_username || 'Authenticated User'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {profileUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                    <User className="size-4" />
                    Manage Profile
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 cursor-pointer w-full sm:w-auto text-destructive hover:text-destructive"
                onClick={() => {
                  queryClient.clear();
                  void signoutRedirect();
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
            {profileUrl ? (
              <p className="text-xs text-muted-foreground mt-2">
                You will be redirected to your identity provider to manage your account.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                External profile management is not provided by your identity provider.
              </p>
            )}
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Preferences" icon={Globe} />
          <Card className="p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Default Currency</p>
              <p className="text-xs text-muted-foreground">
                Pre-selected currency when creating new transactions.
              </p>
              <Select
                value={prefCurrency ?? ''}
                onChange={(e) => setPrefCurrency(e.target.value || null)}
              >
                <option value="">Auto — {localeCurrency()} (from browser locale)</option>
                {ISO_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {currencyLabel(c)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="border-t pt-4 space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Date Format</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate('2024-01-15', resolvedNumberLocale, prefDateFormat)}
                  </p>
                </div>
                <div
                  role="tablist"
                  aria-label="Date format"
                  className="flex h-9 shrink-0 p-1 bg-muted rounded-pill"
                >
                  {(['short', 'medium', 'long'] as DateFormatStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      role="tab"
                      aria-selected={prefDateFormat === style}
                      onClick={() => setPrefDateFormat(style)}
                      className={cn(
                        'px-3 rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        prefDateFormat === style
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                      )}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-1.5">
              <p className="text-sm font-medium">Number Format</p>
              <p className="text-xs text-muted-foreground">
                Preview:{' '}
                {formatCurrency(123456, prefCurrency ?? localeCurrency(), resolvedNumberLocale)}
              </p>
              <Select
                value={prefNumberLocale ?? ''}
                onChange={(e) => setPrefNumberLocale(e.target.value || null)}
              >
                <option value="">Auto (from browser locale)</option>
                {NUMBER_LOCALE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Theme" icon={Sun} />
          <Card className="p-4">
            <div
              role="tablist"
              aria-label="Theme"
              className={cn(
                'flex h-10 p-1 bg-muted rounded-pill transition-colors',
                glassEffect && 'bg-muted/50 backdrop-blur-md',
              )}
            >
              {(
                [
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: SunMoon, label: 'System' },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={theme === t.value}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    theme === t.value
                      ? cn(
                          'bg-background text-foreground shadow-sm',
                          glassEffect && 'bg-background/80 backdrop-blur-sm',
                        )
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
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

        <section className="space-y-3">
          <SectionHeader title="Primary Color" icon={Palette} />
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-pill border shadow-sm"
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
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the hue of the primary color used throughout the app.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Font Size" icon={Type} />
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
              <div className="text-sm border rounded-md px-2 py-1 bg-muted">Sample Text</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Increase or decrease the base font size for better readability.
            </p>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Navigation" icon={Navigation} />
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
          <SectionHeader title="Version & Updates" icon={RefreshCw} />
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
          </Card>
        </section>
      </div>
    </PageContainer>
  );
}
