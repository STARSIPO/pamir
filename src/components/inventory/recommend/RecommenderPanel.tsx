'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import type {
  FloorPreference,
  MatchReason,
  MatchTradeoff,
  Recommendation,
  RecommendationBounds,
  RecommendationCriteria,
} from '@/lib/recommend/types';
import { track } from '@/lib/analytics';
import { getLenis } from '@/lib/smooth-scroll';
import { usePrefersReducedMotion } from '@/lib/useReducedMotion';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import { Arrow, ArrowLabel, Button } from '@/components/ui/Button';
import { floorLabel, formatArea, formatEUR } from '../format';
import { PlanThumb } from './PlanThumb';

type T = Dictionary['inventory']['recommend'];
type Common = Dictionary['inventory']['common'];

/** Names the cards need, resolved on the server (no inventory in this bundle). */
export interface RecommenderLabels {
  /** `${projectSlug}/${buildingId}` → "Блок 3". */
  buildings: Record<string, string>;
  /** projectSlug → "Botanic Star 2 — блоки 3 и 4". */
  projects: Record<string, string>;
  /** Name the project on each card (the pool spans several projects). */
  showProject: boolean;
}

interface FormState {
  budget: number;
  rooms: number | null;
  /** m², 0 = any. */
  area: number;
  floor: FloorPreference;
}

const LIMIT = 5;
const FLOORS: FloorPreference[] = ['any', 'low', 'middle', 'high'];
/** A beat of loading state, so the answer reads as considered, not as a flicker. */
const MIN_LOADING_MS = 420;
/** Must match the thumb size in `rangeCls`. */
const THUMB = 15;

const keyOf = (s: FormState) => `${s.budget}|${s.rooms ?? 'any'}|${s.area}|${s.floor}`;
const pad = (n: number) => String(n).padStart(2, '0');

// A native range input, restyled: a 1px rule, a square ink thumb. The visible
// rule and its accent fill are separate spans under it (see BudgetField), so
// the thumb centre and the fill end always meet.
const rangeCls = cn(
  'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none',
  '[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-transparent',
  '[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:ease-premium',
  '[&:hover::-webkit-slider-thumb]:scale-110 [&:active::-webkit-slider-thumb]:scale-125',
  '[&:focus-visible::-webkit-slider-thumb]:outline [&:focus-visible::-webkit-slider-thumb]:outline-2 [&:focus-visible::-webkit-slider-thumb]:outline-offset-4 [&:focus-visible::-webkit-slider-thumb]:outline-[rgb(var(--focus,var(--accent-strong)))]',
  '[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-transparent',
  '[&::-moz-range-thumb]:h-[15px] [&::-moz-range-thumb]:w-[15px] [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink',
  '[&:focus-visible::-moz-range-thumb]:outline [&:focus-visible::-moz-range-thumb]:outline-2 [&:focus-visible::-moz-range-thumb]:outline-offset-4 [&:focus-visible::-moz-range-thumb]:outline-[rgb(var(--focus,var(--accent-strong)))]',
);

// Underlined field, as in the lead form: the rule darkens on hover and draws
// at full ink, 2px, on focus.
const fieldRule =
  'flex items-baseline gap-2 border-b border-line/50 transition-[border-color,box-shadow] duration-500 ease-premium hover:border-line/75 focus-within:border-ink focus-within:shadow-[0_1px_0_0_rgb(var(--ink))]';

/**
 * The interactive part of «Поможем подобрать квартиру»: the criteria form on
 * the left, the answer on the right (stacked on phones).
 *
 *   БЮДЖЕТ, ДО                        ВАШ ПОДБОР ───────────────────── 05
 *   €95 000                           ЛУЧШЕЕ СОВПАДЕНИЕ — 96%
 *   ────────■──────────────           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░
 *   КОМНАТЫ  [ЛЮБОЕ] [1] [2] [3] [4]  [plan]  Квартира №42
 *   ПЛОЩАДЬ ОТ ______ м²                      2 комнаты · 71,0 м² · Этаж 6
 *   ЭТАЖИ [ЛЮБЫЕ] [НИЖНИЕ] …                  €103 000
 *   [ ПОДОБРАТЬ КВАРТИРУ → ]          02  Квартира №18 …         €86 100
 *
 * The provider is loaded on the first request (dynamic import), so the page
 * does not ship the inventory until someone asks. Results arrive with a short
 * staggered rise; while a new request runs the previous answer stays in place,
 * dimmed, so nothing jumps.
 */
export function RecommenderPanel({
  locale,
  t,
  common,
  bounds,
  projectSlug,
  labels,
  priceNote,
  leadHref = '#lead',
}: {
  locale: Locale;
  t: T;
  common: Common;
  bounds: RecommendationBounds;
  projectSlug?: string;
  labels: RecommenderLabels;
  /** Shown under the results while prices are indicative. */
  priceNote?: string;
  /** Lead form anchor. When it is a hash that is not on the page, the
   *  project page's lead form is opened instead. */
  leadHref?: string;
}) {
  const uid = useId();
  const reduce = usePrefersReducedMotion();
  const pathname = usePathname();
  const router = useRouter();

  const [budget, setBudget] = useState(bounds.budgetDefault);
  // Raw digits while the budget field is being typed in; null otherwise.
  const [budgetText, setBudgetText] = useState<string | null>(null);
  const [rooms, setRooms] = useState<number | null>(null);
  const [areaText, setAreaText] = useState('');
  const [floor, setFloor] = useState<FloorPreference>('any');

  const [data, setData] = useState<{ form: FormState; results: Recommendation[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // Bumped on every answer: re-keys the result list so it rises in again.
  const [run, setRun] = useState(0);
  const request = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const clampBudget = (n: number) => Math.min(bounds.budgetMax, Math.max(bounds.budgetMin, n));
  const parseBudget = (text: string | null) => {
    if (text === null) return budget;
    const n = parseInt(text, 10);
    return Number.isFinite(n) && n > 0 ? clampBudget(Math.round(n / 100) * 100) : budget;
  };
  const parseArea = (text: string) => {
    const n = parseInt(text, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, bounds.areaMax) : 0;
  };

  const current: FormState = { budget: parseBudget(budgetText), rooms, area: parseArea(areaText), floor };
  const stale = !!data && !busy && keyOf(current) !== keyOf(data.form);

  async function recommend(form: FormState) {
    const id = ++request.current;
    setBusy(true);
    setError(false);
    const started = Date.now();
    const criteria: RecommendationCriteria = {
      projectSlug,
      budget: form.budget,
      rooms: form.rooms ?? undefined,
      minArea: form.area > 0 ? form.area : undefined,
      floor: form.floor,
    };
    try {
      const lib = await import('@/lib/recommend');
      const provider = lib.getRecommendationProvider();
      const results = await provider.recommend(criteria, lib.recommendationPool(projectSlug), LIMIT);
      const wait = reduce ? 0 : MIN_LOADING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (id !== request.current) return;
      setData({ form, results });
      setRun((n) => n + 1);
      setBusy(false);
      track('recommend_submit', {
        provider: provider.id,
        project: projectSlug ?? 'all',
        budget: form.budget,
        rooms: form.rooms ?? 'any',
        minArea: form.area || null,
        floor: form.floor,
        results: results.length,
        top: results[0]?.apartment.id ?? null,
        topScore: results[0] ? Math.round(results[0].score * 100) : null,
      });
    } catch {
      if (id !== request.current) return;
      setBusy(false);
      setError(true);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBudget(current.budget);
    setBudgetText(null);
    void recommend(current);
  }

  /** Empty answer → open everything but the budget, and give it 15% more room. */
  function relax() {
    const next: FormState = {
      budget: clampBudget(Math.ceil((current.budget * 1.15) / 5000) * 5000),
      rooms: null,
      area: 0,
      floor: 'any',
    };
    setBudget(next.budget);
    setBudgetText(null);
    setRooms(null);
    setAreaText('');
    setFloor('any');
    void recommend(next);
  }

  // Bring the answer into view when it lands off screen: below the form on
  // phones, or above the fold after a long form on desktop.
  useEffect(() => {
    if (!run) return;
    const el = resultsRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const header =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || 68;
    if (rect.top >= header && rect.top <= window.innerHeight * 0.55) return;
    const offset = -(header + 24);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(el, { offset });
      return;
    }
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + rect.top + offset, behavior: smooth ? 'smooth' : 'auto' });
  }, [run]);

  const plural = new Intl.PluralRules(locale === 'ro' ? 'ro' : 'ru').select(bounds.count);
  const poolText = (t.how.pool[plural as keyof T['how']['pool']] ?? t.how.pool.other).replace(
    '{n}',
    String(bounds.count),
  );
  const selectorHref =
    projectSlug && !pathname?.includes('/select') ? routes.selector(locale, projectSlug) : undefined;

  const announce = busy
    ? t.results.loading
    : error
      ? t.error
      : data
        ? data.results.length
          ? t.results.announce.replace('{n}', String(data.results.length))
          : t.empty.title
        : '';

  return (
    <div className="mt-14 grid gap-16 md:mt-20 lg:grid-cols-12 lg:gap-x-gutter">
      {/* On tall desktop screens the criteria stay beside the answer while
          it is scrolled; below 820px of height the form would not fit. */}
      <form
        onSubmit={onSubmit}
        aria-label={t.form.label}
        noValidate
        className="lg:col-span-5 lg:self-start xl:col-span-4 lg:[@media(min-height:820px)]:sticky lg:[@media(min-height:820px)]:top-[calc(var(--header-h-compact)+2rem)]"
      >
        <div className="space-y-10 md:space-y-12">
          <BudgetField
            id={`${uid}-budget`}
            locale={locale}
            t={t}
            bounds={bounds}
            budget={budget}
            text={budgetText}
            onText={setBudgetText}
            onCommit={() => {
              setBudget(parseBudget(budgetText));
              setBudgetText(null);
            }}
            onSlide={(n) => {
              setBudget(n);
              setBudgetText(null);
            }}
          />

          <fieldset>
            <legend className="label text-muted">{t.form.rooms}</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              <Choice name={`${uid}-rooms`} checked={rooms === null} onChange={() => setRooms(null)}>
                {t.form.roomsAny}
              </Choice>
              {bounds.rooms.map((n) => (
                <Choice
                  key={n}
                  name={`${uid}-rooms`}
                  checked={rooms === n}
                  onChange={() => setRooms(n)}
                  srLabel={common.rooms[n] ?? String(n)}
                >
                  <span className="tabular">{n}</span>
                </Choice>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`${uid}-area`} className="label block text-muted">
              {t.form.minArea}
            </label>
            <div className={cn('mt-2', fieldRule)}>
              <input
                id={`${uid}-area`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                placeholder={t.form.minAreaPlaceholder}
                value={areaText}
                onChange={(e) => setAreaText(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full min-w-0 bg-transparent py-3 text-lead tabular text-ink outline-none placeholder:text-muted focus-visible:outline-none"
              />
              <span aria-hidden="true" className="text-muted">
                {common.sqm}
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="label text-muted">{t.form.floor}</legend>
            {/* Four words do not fit one row on a phone: a tidy 2 × 2 there. */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {FLOORS.map((f) => (
                <Choice key={f} name={`${uid}-floor`} checked={floor === f} onChange={() => setFloor(f)} fill>
                  {t.form.floorOptions[f]}
                </Choice>
              ))}
            </div>
          </fieldset>
        </div>

        <Button type="submit" size="lg" arrow aria-busy={busy} className="mt-12 w-full md:mt-14">
          {busy ? t.form.submitting : t.form.submit}
        </Button>
        {/* Under the button, which stays in view (sticky on desktop), rather
            than above answers that may be scrolled away. */}
        {stale && <p className="mt-4 text-pretty text-sm leading-relaxed text-muted">{typo(t.results.stale)}</p>}
      </form>

      <div
        ref={resultsRef}
        aria-busy={busy}
        className="min-w-0 lg:col-span-7 lg:col-start-6 xl:col-span-7 xl:col-start-6"
      >
        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>

        <div className="flex items-center gap-4">
          <h3 className="label shrink-0 text-muted">{data ? t.results.label : t.how.label}</h3>
          <span aria-hidden="true" className="relative h-px flex-1 overflow-hidden bg-line/15">
            {busy && <span className="absolute inset-0 origin-left animate-line-in bg-accent" />}
          </span>
          {data && data.results.length > 0 && (
            <span className="label shrink-0 tabular text-muted">{pad(data.results.length)}</span>
          )}
        </div>

        {error && !busy && (
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-sm text-danger">{t.error}</p>
            <Button type="button" variant="ghost" onClick={() => void recommend(current)}>
              {t.retry}
            </Button>
          </div>
        )}

        <div
          className={cn('transition-opacity duration-500 ease-premium', busy ? 'opacity-40' : stale && 'opacity-50')}
        >
          {!data ? (
            <HowItWorks t={t} poolText={poolText} />
          ) : data.results.length === 0 ? (
            <Appear key={run} reduce={reduce} className="mt-10">
              <p className="font-display text-display-md font-light text-balance text-ink">{t.empty.title}</p>
              <p className="mt-5 max-w-[52ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                {typo(t.empty.text)}
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
                <Button type="button" variant="outline" onClick={relax}>
                  {t.empty.relax}
                </Button>
                <Button
                  href={leadHref}
                  variant="ghost"
                  arrow
                  onClick={(e) => {
                    track('lead_open', { source: 'recommend' });
                    const onPage = !leadHref.startsWith('#') || document.getElementById(leadHref.slice(1));
                    if (!onPage && projectSlug) {
                      e.preventDefault();
                      router.push(`${routes.project(locale, projectSlug)}${leadHref}`);
                    }
                  }}
                >
                  {t.empty.lead}
                </Button>
              </div>
            </Appear>
          ) : (
            <div key={run}>
              <Appear reduce={reduce} className="mt-10">
                <BestMatch
                  r={data.results[0]}
                  budget={data.form.budget}
                  locale={locale}
                  t={t}
                  common={common}
                  labels={labels}
                />
              </Appear>
              {data.results.length > 1 && (
                <ol className="mt-14 border-b border-line/15 md:mt-16">
                  {data.results.slice(1).map((r, i) => (
                    <Appear as="li" key={r.apartment.id} index={i + 1} reduce={reduce}>
                      <MatchRow
                        r={r}
                        rank={i + 2}
                        budget={data.form.budget}
                        locale={locale}
                        t={t}
                        common={common}
                        labels={labels}
                      />
                    </Appear>
                  ))}
                </ol>
              )}
              <Appear index={data.results.length} reduce={reduce} className="mt-8">
                <p className="max-w-[60ch] text-pretty text-sm leading-relaxed text-muted">
                  {typo(t.results.scoreNote)}
                  {priceNote && <> {typo(priceNote)}</>}
                </p>
                {selectorHref && (
                  <Button href={selectorHref} variant="ghost" arrow className="mt-6">
                    {common.cta}
                  </Button>
                )}
              </Appear>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function BudgetField({
  id,
  locale,
  t,
  bounds,
  budget,
  text,
  onText,
  onCommit,
  onSlide,
}: {
  id: string;
  locale: Locale;
  t: T;
  bounds: RecommendationBounds;
  budget: number;
  text: string | null;
  onText: (v: string) => void;
  onCommit: () => void;
  onSlide: (n: number) => void;
}) {
  const span = bounds.budgetMax - bounds.budgetMin || 1;
  const p = Math.min(1, Math.max(0, (budget - bounds.budgetMin) / span));
  const grouped = formatEUR(budget, locale).replace('€', '');
  return (
    <div>
      <label htmlFor={id} className="label block text-muted">
        {t.form.budget}
      </label>
      {/* The € sits tight to the number, as formatEUR writes every other
          price on the site ("€95 000"), so no gap here. */}
      <div className={cn('mt-2', fieldRule, 'gap-0')}>
        <span aria-hidden="true" className="font-display text-display-md font-light text-muted">
          €
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text ?? grouped}
          onFocus={(e) => {
            onText(String(budget));
            const input = e.currentTarget;
            requestAnimationFrame(() => input.select());
          }}
          onChange={(e) => onText(e.target.value.replace(/\D/g, '').slice(0, 7))}
          onBlur={onCommit}
          className="w-full min-w-0 bg-transparent py-2 font-display text-display-md font-light tabular text-ink outline-none focus-visible:outline-none"
        />
      </div>
      <div className="relative mt-3 h-11">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line/25" />
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-px bg-accent"
          style={{ width: `calc(${p} * (100% - ${THUMB}px) + ${THUMB / 2}px)` }}
        />
        <input
          type="range"
          min={bounds.budgetMin}
          max={bounds.budgetMax}
          step={bounds.budgetStep}
          value={budget}
          onChange={(e) => onSlide(Number(e.target.value))}
          aria-label={t.form.budgetSlider}
          aria-valuetext={formatEUR(budget, locale)}
          className={rangeCls}
        />
      </div>
      <div aria-hidden="true" className="label mt-1 flex justify-between tabular text-muted">
        <span>{formatEUR(bounds.budgetMin, locale)}</span>
        <span>{formatEUR(bounds.budgetMax, locale)}</span>
      </div>
    </div>
  );
}

/** A single-choice chip: a real radio (arrow keys, form semantics) drawn as a square toggle. */
function Choice({
  name,
  checked,
  onChange,
  srLabel,
  fill = false,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  /** Full accessible name when the visible text is terse ("2" → "2 комнаты"). */
  srLabel?: string;
  /** Stretch to the grid cell (phones). */
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cn('relative cursor-pointer', fill ? 'flex sm:inline-flex' : 'inline-flex')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          'label inline-flex h-11 min-w-11 items-center justify-center whitespace-nowrap border px-4 transition-colors duration-500 ease-premium',
          fill && 'w-full sm:w-auto',
          'border-line/20 text-muted hover:border-ink hover:text-ink',
          'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[rgb(var(--focus,var(--accent-strong)))]',
        )}
      >
        {srLabel ? (
          <>
            <span aria-hidden="true">{children}</span>
            <span className="sr-only">{srLabel}</span>
          </>
        ) : (
          children
        )}
      </span>
    </label>
  );
}

/** Idle state: what the percentage means, so the column is never empty. */
function HowItWorks({ t, poolText }: { t: T; poolText: string }) {
  return (
    <div className="mt-10">
      <p className="max-w-[30ch] font-display text-display-sm font-light text-pretty text-ink">{typo(t.how.lead)}</p>
      <p className="label mt-5 text-muted">{poolText}</p>
      <ol className="mt-10 border-b border-line/15">
        {t.how.factors.map((f, i) => (
          <li
            key={f.title}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-t border-line/15 py-5 sm:grid-cols-[2.5rem_8.5rem_minmax(0,1fr)] sm:gap-x-6"
          >
            <span className="label tabular pt-1 text-muted">{pad(i + 1)}</span>
            <span className="text-base text-ink">{f.title}</span>
            <span className="col-start-2 mt-1 text-pretty text-sm leading-relaxed text-muted sm:col-start-3 sm:mt-0 sm:pt-0.5">
              {typo(f.text)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Result cards                                                             */
/* ------------------------------------------------------------------------ */

interface CardProps {
  r: Recommendation;
  /** The budget the answer was computed for ("На 4% выше бюджета"). */
  budget: number;
  locale: Locale;
  t: T;
  common: Common;
  labels: RecommenderLabels;
}

/** "Квартира №42" / "Apartamentul nr. 42". */
function apartmentTitle(common: Common, number: string) {
  return `${common.apartmentNo}${common.apartmentNo.endsWith('.') ? ' ' : ''}${number}`;
}

function describe({ r, locale, common, labels }: Omit<CardProps, 't' | 'budget'>) {
  const a = r.apartment;
  const building = labels.buildings[`${a.projectSlug}/${a.buildingId}`] ?? a.buildingId;
  const parts = [
    common.rooms[a.rooms] ?? `${a.rooms} ${common.roomsShort}`,
    `${formatArea(a.area, locale)} ${common.sqm}`,
    floorLabel(common.floor, a.floor),
  ];
  const place = labels.showProject ? `${building} · ${labels.projects[a.projectSlug] ?? a.projectSlug}` : building;
  return {
    title: apartmentTitle(common, a.number),
    meta: parts.join(' · '),
    place,
    price: formatEUR(a.totalPrice, locale),
    perSqm: `${formatEUR(a.pricePerSqm, locale)} ${common.perSqm}`,
    percent: Math.round(r.score * 100),
    href: routes.apartment(locale, a.projectSlug, a.id),
  };
}

function reasonLabel(key: MatchReason, r: Recommendation, t: T, common: Common): string {
  if (key === 'outdoor') return r.apartment.outdoor === 'terrace' ? common.features.terrace : t.reasons.balcony;
  if (key === 'corner') return common.features.corner;
  return t.reasons[key];
}

function tradeoffLabel(key: MatchTradeoff, r: Recommendation, budget: number, t: T): string {
  if (key === 'over-budget') {
    const p = Math.max(1, Math.round((r.apartment.totalPrice / budget - 1) * 100));
    return t.tradeoffs['over-budget'].replace('{p}', String(p));
  }
  return t.tradeoffs[key];
}

/**
 * Reasons (accent square), then compromises (hollow square, dashed, muted).
 * With `max`, the compromises keep their places and the reasons fill the
 * rest: a shortened list never hides what does not fit.
 */
function Chips({
  r,
  budget,
  t,
  common,
  max,
  className,
}: {
  r: Recommendation;
  budget: number;
  t: T;
  common: Common;
  max?: number;
  className?: string;
}) {
  const tradeoffs = r.tradeoffs ?? [];
  const reasons = max === undefined ? r.reasons : r.reasons.slice(0, Math.max(0, max - tradeoffs.length));
  if (!reasons.length && !tradeoffs.length) return null;
  const chip = 'inline-flex items-center gap-2 border px-2.5 py-1.5 text-[0.8125rem] leading-none';
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {reasons.map((k) => (
        <li key={k} className={cn(chip, 'border-line/15 text-ink/80')}>
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
          {reasonLabel(k, r, t, common)}
        </li>
      ))}
      {tradeoffs.map((k) => (
        <li key={k} className={cn(chip, 'border-dashed border-line/30 text-muted')}>
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 border border-current" />
          {tradeoffLabel(k, r, budget, t)}
        </li>
      ))}
    </ul>
  );
}

/**
 * The first answer, given room: the score as a label and a drawn hairline,
 * the plan, the number, the price large.
 */
function BestMatch(props: CardProps) {
  const { r, budget, t, common } = props;
  const d = describe(props);
  return (
    <Link
      href={d.href}
      onClick={() => track('apartment_open', { id: r.apartment.id, source: 'recommend', rank: 1 })}
      aria-label={`${t.results.best} — ${d.percent}%. ${d.title}, ${d.meta}, ${d.place}. ${d.price}`}
      className="group block"
    >
      <span className="label flex items-baseline justify-between gap-4 text-ink">
        <span>
          {t.results.best} — <span className="tabular">{d.percent}%</span>
        </span>
      </span>
      <span aria-hidden="true" className="relative mt-4 block h-px bg-line/15">
        <span
          style={{ '--score': r.score } as CSSProperties}
          className="absolute inset-0 origin-left scale-x-[var(--score)] bg-accent transition-transform delay-300 duration-900 ease-premium group-data-[shown=false]/appear:scale-x-0"
        />
      </span>

      <span className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-gutter">
        <span className="relative block aspect-[16/10] border border-line/15 bg-surface p-5 text-ink/60 sm:aspect-[4/3] transition-colors duration-500 ease-premium group-hover:border-line/40 group-hover:text-ink/80 md:p-7">
          <PlanThumb plan={r.apartment.plan2D} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-display-md font-light text-ink">{d.title}</span>
          <span className="mt-3 block text-base text-muted">{d.meta}</span>
          <span className="label mt-2 block text-muted">{d.place}</span>
          <span className="mt-7 block font-display text-display-md font-light tabular text-ink">{d.price}</span>
          <span className="mt-1 block text-sm tabular text-muted">{d.perSqm}</span>
          <Chips r={r} budget={budget} t={t} common={common} className="mt-6" />
          <ArrowLabel className="mt-8 text-ink">{t.results.view}</ArrowLabel>
        </span>
      </span>
    </Link>
  );
}

/** Answers 2…5: one hairline row each, the plan small beside the text from md. */
function MatchRow(props: CardProps & { rank: number }) {
  const { r, rank, budget, t, common } = props;
  const d = describe(props);
  return (
    <Link
      href={d.href}
      onClick={() => track('apartment_open', { id: r.apartment.id, source: 'recommend', rank })}
      aria-label={`${d.title}, ${d.meta}, ${d.place}. ${d.price}. ${t.results.match} ${d.percent}%`}
      className="group grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-x-4 border-t border-line/15 py-6 transition-colors duration-500 ease-premium hover:border-line/40 sm:gap-x-6 md:grid-cols-[1.75rem_5.5rem_minmax(0,1fr)_auto]"
    >
      <span className="label tabular pt-2 text-muted">{pad(rank)}</span>
      <span className="hidden aspect-square border border-line/15 bg-surface p-2 text-ink/55 transition-colors duration-500 ease-premium group-hover:border-line/40 group-hover:text-ink/80 md:block">
        <PlanThumb plan={r.apartment.plan2D} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-display-sm font-light text-ink">{d.title}</span>
        <span className="mt-1.5 block text-sm leading-relaxed text-muted">
          {d.meta} · {d.place}
        </span>
        <Chips r={r} budget={budget} t={t} common={common} max={3} className="mt-4" />
      </span>
      <span className="flex flex-col items-end text-right">
        <span className="font-display text-display-sm font-light tabular text-ink">{d.price}</span>
        <span className="label mt-2 tabular text-muted">
          <span className="max-sm:sr-only">{t.results.match} </span>
          {d.percent}%
        </span>
        <Arrow className="mt-4 text-muted transition-colors duration-500 group-hover:text-ink" />
      </span>
    </Link>
  );
}

/**
 * Soft rise for content that appears after an interaction (Reveal is for
 * scroll). Starts hidden, flips `data-shown` two frames after mount so the
 * transition runs; `index` staggers siblings by 90 ms. Reduced motion: the
 * global rule zeroes the duration and there is no delay.
 */
function Appear({
  as: Tag = 'div',
  index = 0,
  reduce,
  className,
  children,
}: {
  as?: ElementType;
  index?: number;
  reduce: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        el.dataset.shown = 'true';
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Tag
      ref={ref}
      data-shown="false"
      style={reduce ? undefined : { transitionDelay: `${index * 90}ms` }}
      className={cn(
        'group/appear transition-[opacity,transform] duration-700 ease-premium data-[shown=false]:translate-y-3 data-[shown=false]:opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
