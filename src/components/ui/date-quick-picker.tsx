import { CalendarDays } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/cn';
import { browserLocale, formatDate, todayIso, toLocalIsoDate } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

interface DateQuickPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  id?: string;
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalIsoDate(d);
}

export function DateQuickPicker({ value, onChange, error, id }: DateQuickPickerProps) {
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const numberLocale = useUserPreferencesStore((s) => s.numberLocale ?? browserLocale());
  const pickerRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => todayIso(), []);
  const yesterday = useMemo(() => yesterdayIso(), []);

  const isToday = value === today;
  const isYesterday = value === yesterday;
  const isCustom = !isToday && !isYesterday;

  const select = (next: string) => {
    if (value !== next) haptic('tap');
    onChange(next);
  };

  const pickLabel = isCustom ? formatDate(value, numberLocale, 'short') : 'Pick';

  return (
    <div
      role="tablist"
      aria-label="Date"
      className={cn(
        'flex p-1 bg-muted rounded-pill',
        glassEffect && 'bg-muted/50 backdrop-blur-md',
        error && 'border border-destructive',
      )}
    >
      <ChipTab selected={isToday} glassEffect={glassEffect} onClick={() => select(today)}>
        Today
      </ChipTab>
      <ChipTab selected={isYesterday} glassEffect={glassEffect} onClick={() => select(yesterday)}>
        Yesterday
      </ChipTab>
      <ChipTab
        selected={isCustom}
        glassEffect={glassEffect}
        onClick={() => {
          requestAnimationFrame(() => pickerRef.current?.showPicker?.());
        }}
      >
        <CalendarDays className="size-4" />
        <span className="truncate">{pickLabel}</span>
      </ChipTab>

      <DatePicker
        id={id}
        ref={pickerRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        tabIndex={-1}
        className="sr-only"
      />
    </div>
  );
}

function ChipTab({
  selected,
  glassEffect,
  onClick,
  children,
}: {
  selected: boolean;
  glassEffect: boolean | undefined;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        selected
          ? cn(
              'bg-background text-foreground shadow-card',
              glassEffect && 'bg-background/80 backdrop-blur-sm',
            )
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
      )}
    >
      {children}
    </button>
  );
}
