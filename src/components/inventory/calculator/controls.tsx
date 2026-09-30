'use client';

import { useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { parseNumber } from './format';

/* --------------------------------------------------------------------------
   Calculator controls. Drawn like the site's spec tables, not like a form:
   a row per parameter on a hairline, a small tracked label on the left, the
   control on the right; choices are square toggles, ranges a 1px rule with a
   small square handle. Every control is native underneath (radio, range,
   text input), so keyboard and screen readers work as they do everywhere.
   -------------------------------------------------------------------------- */

/** One parameter row: index + label on the left, control on the right (stacked on phones). */
export function FieldRow({
  index,
  label,
  labelId,
  htmlFor,
  children,
  className,
}: {
  index?: string;
  label: string;
  labelId?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div
      className={cn(
        'grid gap-4 border-t border-line/15 py-6 md:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] md:gap-x-gutter md:py-8',
        className,
      )}
    >
      <div className="flex items-baseline gap-3 md:pt-[0.95rem]">
        {index && (
          <span aria-hidden="true" className="label tabular text-muted/70">
            {index}
          </span>
        )}
        <Label id={labelId} htmlFor={htmlFor} className="label text-muted">
          {label}
        </Label>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Second, quieter line (a price, a unit). */
  hint?: ReactNode;
  /** Accessible name when the visible label is terse ("3" → "3 комнаты"). */
  ariaLabel?: string;
}

/**
 * A row of square toggles over native radios. `grid` lays them out in equal
 * columns (≤ 5 options); otherwise they wrap. `numeric` sets the labels in
 * the display face (room counts, months) instead of the tracked caption.
 */
export function ChoiceGroup<T extends string | number>({
  name,
  labelledBy,
  value,
  options,
  onChange,
  grid = true,
  numeric = false,
  className,
}: {
  name: string;
  labelledBy: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  grid?: boolean;
  numeric?: boolean;
  className?: string;
}) {
  const uid = useId();
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn(grid ? 'grid gap-2' : 'flex flex-wrap gap-2', className)}
      style={grid ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label key={String(o.value)} className="relative flex min-w-0 cursor-pointer">
            <input
              type="radio"
              name={`${name}-${uid}`}
              value={String(o.value)}
              checked={checked}
              onChange={() => onChange(o.value)}
              aria-label={o.ariaLabel}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-11 w-full flex-col items-center justify-center gap-1 border px-3 py-2 text-center',
                'transition-[background-color,border-color,color] duration-500 ease-premium',
                'border-line/25 text-ink/80 hover:border-line/60 hover:text-ink',
                'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas',
                'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent-strong',
                numeric ? 'min-h-12 font-display text-[1.0625rem] font-light tabular' : 'label',
                !grid && 'px-4',
              )}
            >
              <span className="text-balance">{o.label}</span>
              {o.hint && (
                <span className="text-[0.75rem] font-normal normal-case tracking-normal tabular opacity-70">{o.hint}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Thumb size in px — the fill line is offset by half of it at each end. */
const THUMB = 16;
const thumbPos = (pct: number) => `calc(${pct}% + ${((0.5 - pct / 100) * THUMB).toFixed(2)}px)`;

/**
 * A range on a hairline: the travelled part of the rule is drawn in ink, the
 * handle is a small ink square. The whole 44px strip is the touch target.
 * Arrow keys move by `keyStep` (not the fine drag step), PageUp/PageDown by
 * ten of those, Home/End to the ends.
 */
export function RangeSlider({
  id,
  value,
  min,
  max,
  step,
  keyStep = step,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  valueText,
  ticks,
}: {
  id?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  keyStep?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  valueText?: string;
  /** Draw a tick at every integer (floors). */
  ticks?: boolean;
}) {
  const span = max - min;
  const clamped = Math.min(Math.max(value, min), max);
  const pct = span > 0 ? ((clamped - min) / span) * 100 : 0;
  const decimals = (String(step).split('.')[1] ?? '').length;
  const snap = (v: number) => Number(Math.min(Math.max(v, min), max).toFixed(decimals));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamped + keyStep;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamped - keyStep;
    else if (e.key === 'PageUp') next = clamped + keyStep * 10;
    else if (e.key === 'PageDown') next = clamped - keyStep * 10;
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    // Whole key steps land on round values (84.3 → 85, not 85.3).
    const rounded = e.key === 'Home' || e.key === 'End' ? next : Math.round(next / keyStep) * keyStep;
    onChange(snap(rounded));
  };

  return (
    <div className="relative h-11">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-line/20" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 h-px bg-ink"
        style={{ width: thumbPos(pct) }}
      />
      {ticks &&
        span > 0 &&
        span <= 30 &&
        Array.from({ length: span + 1 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 mt-2 h-1.5 w-px -translate-x-1/2',
              min + i <= clamped ? 'bg-ink/50' : 'bg-line/25',
            )}
            style={{ left: thumbPos((i / span) * 100) }}
          />
        ))}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(snap(Number(e.target.value)))}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-valuetext={valueText}
        className={cn(
          // The ring hugs the 44px strip, clear of the min / max captions under it.
          'relative block h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-offset-0',
          '[&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:bg-transparent',
          '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-ink',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:ease-premium hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-125',
          '[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink',
        )}
      />
    </div>
  );
}

/**
 * A typed number that commits as you type (when valid and in range) and
 * clamps on blur / Enter. Up/Down step by `step` (Shift ×10). Shown in the
 * display face; `prefix` / `suffix` sit beside it in the muted caption tone.
 */
export function NumberField({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  format,
  ariaLabel,
  prefix,
  suffix,
  widthCh = 6,
  className,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
  format: (value: number) => string;
  ariaLabel: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  widthCh?: number;
  className?: string;
}) {
  // null while not editing: the field shows the formatted value.
  const [draft, setDraft] = useState<string | null>(null);
  const round = (n: number) => Number(n.toFixed(decimals));
  const clamp = (n: number) => Math.min(Math.max(round(n), min), max);

  const commit = () => {
    if (draft !== null) {
      const n = parseNumber(draft, decimals > 0);
      if (n !== null) onChange(clamp(n));
    }
    setDraft(null);
  };

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      {prefix && <span className="font-display text-display-sm font-light text-muted">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        value={draft ?? format(value)}
        onFocus={(e) => {
          setDraft(format(value));
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseNumber(e.target.value, decimals > 0);
          if (n !== null && n >= min && n <= max) onChange(round(n));
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const base = parseNumber(draft ?? '', decimals > 0) ?? value;
            const next = clamp(base + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
            onChange(next);
            setDraft(format(next));
          }
        }}
        style={{ width: `${widthCh}ch` }}
        className={cn(
          // A 44px touch target without moving the figure: the extra height
          // is top padding cancelled by an equal negative margin, so the
          // field reaches up into the space above it while the text and its
          // rule stay where the row's baseline puts them.
          'min-h-11 min-w-[2.75rem] -mt-3.5 rounded-none border-0 border-b border-line/30 bg-transparent px-0 pb-1 pt-3.5',
          'font-display text-display-sm font-light tabular text-ink outline-none',
          // Focus draws the rule in ink at 2px, as the lead form's fields do.
          'transition-[border-color,box-shadow] duration-500 ease-premium hover:border-line/60',
          'focus:border-ink focus:shadow-[0_1px_0_0_rgb(var(--ink))] focus-visible:outline-none',
        )}
      />
      {suffix && <span className="label text-muted">{suffix}</span>}
    </div>
  );
}
