'use client';

import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Apartment } from '@/lib/inventory/types';
import { track } from '@/lib/analytics';
import { Arrow } from '@/components/ui/Button';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { CornerSide } from './geometry';
import { buildPlanSvg, downloadText, openPage, printablePage, type PlanSvgText } from './plan-svg';
import { fill } from './text';

export interface ActionLabels {
  lead: string;
  leadHint: string;
  calculate: string;
  calculateHint: string;
  download: string;
  /** What the download gives on a desktop («SVG · для печати»). */
  downloadHint: string;
  /** …and on a phone or tablet, where it opens a print-ready page. */
  downloadHintTouch: string;
}

/**
 * The apartment's actions, strongest first:
 *
 *   [ ОСТАВИТЬ ЗАЯВКУ                                   → ]   solid ink bar
 *     Рассчитать стоимость            паркинг, рассрочка →    hairline row
 *     Скачать планировку                 SVG · для печати ↓    hairline row
 *
 * The lead bar fills with the accent from the left on hover and on keyboard
 * focus alike (a slow wipe, not a flash); its text turns to on-accent with
 * it. `priceActions` is off for a sold apartment: the plan can still be
 * downloaded, nothing else is offered.
 *
 * «Скачать планировку» saves an SVG sheet on a desktop. On a touch device
 * — where a bare .svg opens as code or in a viewer that cannot print — it
 * opens the same sheet as a print-ready page instead (print, PDF, or save
 * the SVG from there); the hint under the label says which.
 */
export function ApartmentActions({
  apartment,
  locale,
  labels,
  priceActions,
  leadLabel,
  file,
  orientation,
  className,
}: {
  apartment: Apartment;
  locale: Locale;
  labels: ActionLabels;
  priceActions: boolean;
  /** Overrides the lead label (reserved: «Узнать о снятии брони»). */
  leadLabel?: string;
  file: {
    /** File name stem, e.g. «planirovka». */
    name: string;
    /** «Pamir Construct · Сформировано {date}» */
    footer: string;
    /** Buttons of the print-ready page (phones). */
    print: string;
    save: string;
    text: Omit<PlanSvgText, 'footer'>;
  };
  orientation: { northDeg: number; cornerSide: CornerSide };
  className?: string;
}) {
  const download = () => {
    const date = new Intl.DateTimeFormat(locale === 'ro' ? 'ro-MD' : 'ru-MD', { dateStyle: 'short' }).format(new Date());
    const svg = buildPlanSvg(apartment, locale, orientation, { ...file.text, footer: fill(file.footer, { date }) });
    const fileName = `${file.name}-${apartment.projectSlug}-${apartment.number}.svg`;
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const page = touch
      ? printablePage(svg, {
          lang: locale,
          title: `${file.text.title} — ${file.text.project}`,
          print: file.print,
          save: file.save,
          fileName,
        })
      : null;
    // A blocked pop-up falls back to the plain download.
    const format = page && openPage(page) ? 'print' : 'svg';
    if (format === 'svg') downloadText(svg, fileName);
    track('plan_download', { apartment: apartment.id, project: apartment.projectSlug, format });
  };

  const row =
    'group flex min-h-14 w-full items-center justify-between gap-4 border-b border-line/15 py-3 text-left transition-colors duration-500 ease-premium hover:text-ink';
  // Hover and keyboard focus are one state for the lead bar.
  const onAccent = 'group-hover:text-on-accent group-focus-visible:text-on-accent';
  const downloadHint = (
    <>
      <span className="hidden [@media(hover:hover)]:inline">{labels.downloadHint}</span>
      <span className="[@media(hover:hover)]:hidden">{labels.downloadHintTouch}</span>
    </>
  );

  return (
    <div className={className}>
      {priceActions && (
        <Link
          href="#lead"
          onClick={() => track('lead_open', { source: 'apartment_page', apartment: apartment.id, status: apartment.status })}
          className="group relative flex min-h-16 w-full items-center justify-between gap-6 overflow-hidden bg-ink px-6 py-4 text-canvas md:min-h-[4.5rem] md:px-7"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-left scale-x-0 bg-accent-strong transition-transform duration-700 ease-premium group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
          <span className="relative flex flex-col gap-1.5">
            <span className={cn('text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500', onAccent)}>
              {leadLabel ?? labels.lead}
            </span>
            <span
              className={cn(
                'text-pretty text-xs leading-snug text-canvas/60 transition-colors duration-500',
                'group-hover:text-on-accent/90 group-focus-visible:text-on-accent/90',
              )}
            >
              {typo(labels.leadHint)}
            </span>
          </span>
          <Arrow className={cn('relative w-8 transition-[transform,color] duration-500', onAccent)} />
        </Link>
      )}

      <div className={cn(priceActions && 'mt-2')}>
        {priceActions && (
          <Link href="#calculator" className={cn(row, 'text-ink')}>
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.14em]">{labels.calculate}</span>
            <span className="flex items-center gap-4 text-muted">
              <span className="hidden text-sm sm:inline">{labels.calculateHint}</span>
              <Arrow className="text-ink" />
            </span>
          </Link>
        )}
        <button type="button" onClick={download} className={cn(row, 'text-ink')}>
          <span className="flex flex-col gap-1">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.14em]">{labels.download}</span>
            {/* Phones: what the button gives, under the label (no room beside it). */}
            <span className="text-sm text-muted sm:hidden">{downloadHint}</span>
          </span>
          <span className="flex items-center gap-4 text-muted">
            <span className="hidden text-sm sm:inline">{downloadHint}</span>
            <DownGlyph />
          </span>
        </button>
      </div>
    </div>
  );
}

/** Thin down arrow onto a baseline — "save". */
function DownGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-ink transition-transform duration-500 ease-premium group-hover:translate-y-0.5"
    >
      <path d="M8 1v10M3.5 6.5 8 11l4.5-4.5M2 15h12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
