import { Minus, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { useThemeStore } from '@/stores/theme.store';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;

export function FontSizeSection() {
  const fontSize = useThemeStore((s) => s.fontSize);
  const setFontSize = useThemeStore((s) => s.setFontSize);

  return (
    <Section title="Font Size" icon={Type}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer"
            onClick={() => setFontSize(Math.max(MIN_FONT_SIZE, fontSize - 1))}
            disabled={fontSize <= MIN_FONT_SIZE}
            aria-label="Decrease font size"
          >
            <Minus className="size-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
          <Button
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer"
            onClick={() => setFontSize(Math.min(MAX_FONT_SIZE, fontSize + 1))}
            disabled={fontSize >= MAX_FONT_SIZE}
            aria-label="Increase font size"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="text-sm border rounded-md px-2 py-1 bg-muted">Sample Text</div>
      </div>
      <p className="text-xs text-muted-foreground">
        Increase or decrease the base font size for better readability.
      </p>
    </Section>
  );
}
