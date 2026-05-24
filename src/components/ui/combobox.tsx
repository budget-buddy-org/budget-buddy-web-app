import { Check, Plus } from 'lucide-react';
import type * as React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Input } from './input';

export interface ComboboxItem {
  value: string;
  label: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  onCreate?: (name: string) => Promise<void> | void;
  placeholder?: string;
  createLabel?: (typed: string) => string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  emptyLabel?: string;
  ref?: React.Ref<HTMLInputElement>;
  renderLeading?: (selectedItem: ComboboxItem | undefined) => React.ReactNode;
}

export function Combobox({
  items,
  value,
  onChange,
  onCreate,
  placeholder = 'Search…',
  createLabel = (typed) => `Create "${typed}"`,
  disabled,
  error,
  id,
  emptyLabel = 'No matches',
  ref,
  renderLeading,
}: ComboboxProps) {
  const reactId = useId();
  const listId = `${id ?? reactId}-list`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(() => items.find((i) => i.value === value), [items, value]);

  const [query, setQuery] = useState(selectedItem?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openUpward, setOpenUpward] = useState(false);

  // Resync the input text when the selected value changes from outside
  // (parent updates `value`, e.g. after inline-create). Use the
  // setState-during-render pattern instead of an effect.
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(selectedItem?.label ?? '');
  }

  const trimmed = query.trim();
  const lowerQuery = trimmed.toLowerCase();
  const filtered = useMemo(() => {
    if (!lowerQuery || lowerQuery === selectedItem?.label.toLowerCase()) return items;
    return items.filter((i) => i.label.toLowerCase().includes(lowerQuery));
  }, [items, lowerQuery, selectedItem]);

  const exactMatch = items.some((i) => i.label.toLowerCase() === lowerQuery);
  const canCreate = !!onCreate && trimmed.length > 0 && !exactMatch;
  const totalOptions = filtered.length + (canCreate ? 1 : 0);
  const createIndex = canCreate ? filtered.length : -1;
  const safeActiveIndex = Math.min(Math.max(0, activeIndex), Math.max(0, totalOptions - 1));

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedItem?.label ?? '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, selectedItem]);

  // Flip dropdown direction when the input sits in the lower portion of the
  // viewport — keeps the list from colliding with the bottom edge of bottom-
  // sheet dialogs (where the rounded corners and the dropdown clash visually).
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const DROPDOWN_MAX = 240; // matches max-h-60
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < DROPDOWN_MAX && spaceAbove > spaceBelow);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const commitItem = (item: ComboboxItem) => {
    onChange(item.value);
    setQuery(item.label);
    setOpen(false);
  };

  const commitCreate = async () => {
    if (!onCreate || !trimmed) return;
    setOpen(false);
    await onCreate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex(Math.min(safeActiveIndex + 1, Math.max(0, totalOptions - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(Math.max(0, safeActiveIndex - 1));
    } else if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      if (safeActiveIndex === createIndex) {
        void commitCreate();
      } else if (filtered[safeActiveIndex]) {
        commitItem(filtered[safeActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setQuery(selectedItem?.label ?? '');
      }
    }
  };

  const leading = renderLeading?.(selectedItem);

  return (
    <div ref={containerRef} className="relative">
      {leading && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
          {leading}
        </div>
      )}
      <Input
        id={id}
        ref={ref ?? inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${safeActiveIndex}` : undefined}
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        value={query}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
          if (!e.target.value) onChange('');
        }}
        onKeyDown={handleKeyDown}
        className={cn(leading && 'pl-8')}
      />

      {open && (filtered.length > 0 || canCreate || trimmed.length > 0) && (
        <div
          id={listId}
          role="listbox"
          aria-label={placeholder}
          className={cn(
            'absolute z-overlay w-full max-h-60 overflow-auto rounded-md border bg-popover shadow-overlay',
            'animate-fade-in',
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {filtered.map((item, idx) => {
            const isActive = idx === safeActiveIndex;
            const isSelected = item.value === value;
            return (
              <div
                key={item.value}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitItem(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer',
                  isActive && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-muted-foreground" />}
              </div>
            );
          })}

          {filtered.length === 0 && !canCreate && (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</div>
          )}

          {canCreate && (
            <div
              id={`${listId}-${createIndex}`}
              role="option"
              aria-selected={false}
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                void commitCreate();
              }}
              onMouseEnter={() => setActiveIndex(createIndex)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer border-t',
                safeActiveIndex === createIndex && 'bg-accent text-accent-foreground',
              )}
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">{createLabel(trimmed)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
