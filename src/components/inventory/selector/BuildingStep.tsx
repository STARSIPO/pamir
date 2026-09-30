'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import type { AvailabilityStats, Building, ProjectInventory } from '@/lib/inventory/types';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { typo } from '@/lib/text';
import { Button } from '@/components/ui/Button';
import { formatEUR } from '../format';
import { ComplexScheme2D, type ComplexSchemeLabels } from './ComplexScheme2D';
import { ComplexLegend } from './ComplexDrawing';
import { FloorInfoBar } from './FloorInfoBar';
import { counted, fill } from './FloorFormat';

type Common = Dictionary['inventory']['common'];
type Strings = Dictionary['inventory']['selector'];
type Input = 'none' | 'mouse' | 'touch' | 'pen' | 'keyboard';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Step 1 of the selector: the complex scheme, an info panel for the building
 * in focus and the list of buildings (the accessible and phone alternative).
 *
 *  mouse     hover previews in the panel (and stays there), click opens floors
 *  keyboard  focus previews, Enter opens floors
 *  touch     first tap (on a volume or its name pin) selects it and fills the
 *            panel; below lg, where the panel sits under the scheme, a bar
 *            slides up with the numbers and «Выбрать этаж» (FloorInfoBar, as
 *            on the floor and plan steps). That button — or a second tap on
 *            the same building — opens floors.
 *
 * Preview (hover / focus) and selection are kept apart: only a real choice
 * presses a building (aria-pressed), and a tap is never read as a second tap
 * because focus previewed it first.
 *
 * The chosen building lives in component state only; the URL of the next
 * step carries the choice onward.
 */
export function BuildingStep({
  locale,
  projectSlug,
  projectName,
  inventory,
  buildingStats,
  totalStats,
  priceDemo,
  common,
  t,
}: {
  locale: Locale;
  projectSlug: string;
  projectName: string;
  /** Site and buildings; the apartment list is not needed at this step. */
  inventory: ProjectInventory;
  buildingStats: Record<string, AvailabilityStats>;
  totalStats: AvailabilityStats;
  priceDemo: boolean;
  common: Common;
  t: Strings;
}) {
  const router = useRouter();
  /** Under the mouse or keyboard focus right now. */
  const [hovered, setHovered] = useState<string | null>(null);
  /** Last building previewed: the panel keeps it while the mouse moves to its button. */
  const [peek, setPeek] = useState<string | null>(null);
  /** The building actually chosen (tap, list card): pressed on scheme and list. */
  const [selected, setSelected] = useState<string | null>(null);
  /** Touch: the building in the bottom bar (below lg); null when the bar is closed. */
  const [sheet, setSheet] = useState<string | null>(null);
  // The bar keeps its last building while it slides away.
  const [barId, setBarId] = useState<string | null>(null);
  if (sheet !== null && sheet !== barId) setBarId(sheet);
  // The bar belongs to the scheme: it steps aside while the scheme is scrolled away.
  const [schemeInView, setSchemeInView] = useState(true);
  const schemeRef = useRef<HTMLDivElement>(null);
  const lastInput = useRef<Input>('none');

  const buildings = inventory.buildings;
  const shownId = hovered ?? selected ?? peek;
  const shown = buildings.find((b) => b.id === shownId) ?? null;
  const bar = buildings.find((b) => b.id === barId) ?? null;

  useEffect(() => {
    track('selector_view', { project: projectSlug, step: 'building' });
  }, [projectSlug]);

  useEffect(() => {
    const el = schemeRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setSchemeInView(entry.intersectionRatio >= 0.15), {
      threshold: [0, 0.15, 0.5],
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const href = (id: string) => routes.building(locale, projectSlug, id);

  const priceFrom = (s: AvailabilityStats) => (s.priceFrom !== null ? `${common.from} ${formatEUR(s.priceFrom, locale)}` : null);
  const roomsText = (s: AvailabilityStats) => (s.rooms.length ? `${s.rooms.join(', ')} ${common.roomsShort}` : '—');

  const labels: ComplexSchemeLabels = useMemo(
    () => ({
      scheme: t.schemeLabel,
      north: t.north,
      features: t.features,
      street: inventory.site.street?.[locale],
      zones: Object.fromEntries(
        buildings.map((b) => {
          const s = buildingStats[b.id];
          const parts = [
            b.name[locale],
            `${common.floorsCount}: ${b.floorsCount}`,
            s.available > 0 ? `${t.availableLabel}: ${s.available} ${t.of} ${s.total}` : t.soldOut,
            s.priceFrom !== null ? `${t.priceLabel}: ${common.from} ${formatEUR(s.priceFrom, locale)}` : null,
          ];
          return [b.id, parts.filter(Boolean).join('. ')];
        }),
      ),
    }),
    [buildings, buildingStats, common, inventory.site.street, locale, t],
  );

  // Hover and keyboard focus preview; they never select.
  const preview = (id: string | null) => {
    setHovered(id);
    if (id) {
      setPeek(id);
      router.prefetch(href(id));
    }
  };

  const open = (id: string, via: string) => {
    track('building_select', { project: projectSlug, building: id, action: 'open', via });
    router.push(href(id));
  };

  const choose = (id: string, via: 'scheme' | 'list') => {
    const input = lastInput.current;
    if (via === 'list') {
      // The card carries its own «Выбрать этаж» right below: no bar.
      setSelected(id);
      setSheet(null);
      track('building_select', { project: projectSlug, building: id, action: 'select', via });
      return;
    }
    // Mouse and keyboard users have already seen the numbers (hover / focus
    // preview): the click is the decision. A tap (finger, pen) first selects;
    // a second tap on the same building opens it.
    if (input === 'mouse' || input === 'keyboard' || input === 'none' || selected === id) {
      open(id, via);
      return;
    }
    setSelected(id);
    setSheet(id);
    router.prefetch(href(id));
    track('building_select', { project: projectSlug, building: id, action: 'select', via });
  };

  const closeBar = () => {
    setSheet(null);
    setSelected(null);
  };

  return (
    <div
      onPointerDownCapture={(e) => {
        lastInput.current = e.pointerType as Input;
      }}
      onKeyDownCapture={() => {
        lastInput.current = 'keyboard';
      }}
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-gutter">
        {/* Scheme */}
        <figure className="lg:col-span-8">
          <div ref={schemeRef} className="border-y border-line/15 pb-6 pt-12 sm:pb-10 lg:pb-12">
            <ComplexScheme2D
              inventory={inventory}
              locale={locale}
              buildingStats={buildingStats}
              activeBuildingId={shownId}
              selectedBuildingId={selected}
              onHoverBuilding={preview}
              onSelectBuilding={(id) => choose(id, 'scheme')}
              labels={labels}
              className="mx-auto max-w-[62rem]"
            />
          </div>
          <figcaption className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <p className="max-w-md text-sm leading-relaxed text-muted">
              <span className="hidden [@media(hover:hover)]:inline">{typo(t.hintPointer)}</span>
              <span className="[@media(hover:hover)]:hidden">{typo(t.hintTouch)}</span>
            </p>
            <ComplexLegend
              title={t.legendTitle}
              labels={t.features}
              types={inventory.site.features.map((f) => f.type)}
              className="sm:hidden"
            />
          </figcaption>
        </figure>

        {/* Panel: the building in focus, or the whole complex. */}
        <aside className="lg:col-span-4">
          <div className="border-t border-line/15 pt-6 lg:sticky lg:top-[calc(var(--header-h-compact,4.5rem)+2rem)]">
            {shown ? (
              <div key={shown.id} className="cx-swap">
                <p className="label flex items-center justify-between gap-4 text-muted">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
                    {common.building}
                  </span>
                  <span className="tabular">
                    {pad(buildings.indexOf(shown) + 1)} / {pad(buildings.length)}
                  </span>
                </p>
                <h2 className="mt-5 font-display text-display-md font-light text-balance">{shown.name[locale]}</h2>
                <BuildingFacts building={shown} stats={buildingStats[shown.id]} common={common} t={t} roomsText={roomsText} />
                <StatusLine stats={buildingStats[shown.id]} common={common} />
                <Price value={priceFrom(buildingStats[shown.id])} label={t.priceLabel} note={priceDemo ? common.priceNote : null} soldOut={t.soldOut} />
                <Button
                  href={href(shown.id)}
                  size="lg"
                  arrow
                  className="mt-8 w-full"
                  onClick={() => track('building_select', { project: projectSlug, building: shown.id, action: 'open', via: 'panel' })}
                >
                  {t.chooseFloor}
                </Button>
              </div>
            ) : (
              <div className="cx-swap">
                <p className="label text-muted">{t.complex}</p>
                <h2 className="mt-5 font-display text-display-md font-light text-balance">{projectName}</h2>
                <dl className="mt-8 border-b border-line/15">
                  <Row label={t.buildingsCount} value={String(buildings.length)} />
                  <Row label={t.availableLabel} value={`${totalStats.available} ${t.of} ${totalStats.total}`} />
                  <Row label={t.roomsLabel} value={roomsText(totalStats)} />
                </dl>
                <StatusLine stats={totalStats} common={common} />
                <Price value={priceFrom(totalStats)} label={t.priceLabel} note={priceDemo ? common.priceNote : null} soldOut={t.soldOut} />
                <p className="mt-8 text-pretty text-sm leading-relaxed text-muted">{typo(t.summaryHint)}</p>
                <Button href="#recommend" variant="ghost" arrow className="mt-4">
                  {t.recommendCta}
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* The list: same numbers, one card per building. Selecting a card
          selects the building on the scheme. */}
      <div className="mt-16 md:mt-24">
        <div className="flex items-center gap-4">
          <h2 className="label shrink-0 text-muted">{t.listTitle}</h2>
          <span aria-hidden="true" className="h-px flex-1 bg-line/15" />
        </div>
        <ul className="mt-8 grid gap-12 md:grid-cols-2 md:gap-gutter">
          {buildings.map((b, i) => {
            const s = buildingStats[b.id];
            const on = selected === b.id;
            return (
              <li
                key={b.id}
                className={cn(
                  'border-t pt-6 transition-colors duration-500 ease-premium',
                  on ? 'border-accent' : 'border-line/15',
                )}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(b.id, 'list')}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setHovered(b.id);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') setHovered(null);
                  }}
                  className="group block w-full text-left"
                >
                  <span className="label flex items-center justify-between gap-4 text-muted">
                    <span className="tabular">{pad(i + 1)}</span>
                    <span className={cn('flex items-center gap-2.5 transition-opacity duration-300', on ? 'opacity-100' : 'opacity-0')}>
                      <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
                      {t.selected}
                    </span>
                  </span>
                  <span className="mt-4 block font-display text-display-md font-light transition-colors duration-300 group-hover:text-accent-strong">
                    {b.name[locale]}
                  </span>
                  <span className="mt-6 grid grid-cols-3 gap-4 border-t border-line/15 pt-4">
                    <Stat label={common.floorsCount} value={String(b.floorsCount)} />
                    <Stat label={common.available} value={`${s.available} / ${s.total}`} />
                    <Stat label={t.priceLabel} value={s.priceFrom !== null ? `${common.from} ${formatEUR(s.priceFrom, locale)}` : '—'} />
                  </span>
                </button>
                <Button
                  href={href(b.id)}
                  variant="ghost"
                  arrow
                  className="mt-6"
                  onClick={() => track('building_select', { project: projectSlug, building: b.id, action: 'open', via: 'list' })}
                >
                  {t.chooseFloor}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Touch below lg: the panel is under the scheme, off-screen after a
          tap, so the choice and its action come up from the bottom edge.
          From lg the sticky panel beside the scheme does this job. */}
      <div className="lg:hidden">
        <FloorInfoBar
          open={sheet !== null && schemeInView}
          label={bar ? `${t.bar.label}: ${bar.name[locale]}` : t.bar.label}
          closeLabel={t.bar.close}
          onClose={closeBar}
          action={
            bar && (
              <Button
                href={href(bar.id)}
                arrow
                onClick={() => track('building_select', { project: projectSlug, building: bar.id, action: 'open', via: 'bar' })}
              >
                {t.chooseFloor}
              </Button>
            )
          }
        >
          {bar && <BarSummary building={bar} stats={buildingStats[bar.id]} locale={locale} common={common} t={t} />}
        </FloorInfoBar>
      </div>
    </div>
  );
}

/** Bar content: "БЛОК 3 · 10 ЭТАЖЕЙ / Свободно 38 из 69 / от €64 700". */
function BarSummary({
  building,
  stats,
  locale,
  common,
  t,
}: {
  building: Building;
  stats: AvailabilityStats;
  locale: Locale;
  common: Common;
  t: Strings;
}) {
  return (
    <div key={building.id} className="cx-swap">
      <p className="label flex items-center gap-2.5 text-muted">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
        <span>
          {building.name[locale]} · <span className="tabular">{counted(t.bar.floors, building.floorsCount, locale)}</span>
        </span>
      </p>
      <p className="mt-2 font-display text-display-sm font-light tabular">
        {stats.available > 0 ? fill(t.bar.available, { available: stats.available, total: stats.total }) : t.soldOut}
      </p>
      {stats.priceFrom !== null && (
        <p className="mt-1 text-sm tabular text-muted">
          {common.from} {formatEUR(stats.priceFrom, locale)}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-line/15 py-3.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tabular text-right text-base text-ink md:text-[1.0625rem]">{value}</dd>
    </div>
  );
}

function BuildingFacts({
  building,
  stats,
  common,
  t,
  roomsText,
}: {
  building: Building;
  stats: AvailabilityStats;
  common: Common;
  t: Strings;
  roomsText: (s: AvailabilityStats) => string;
}) {
  return (
    <dl className="mt-8 border-b border-line/15">
      <Row label={common.floorsCount} value={String(building.floorsCount)} />
      <Row label={t.availableLabel} value={stats.available > 0 ? `${stats.available} ${t.of} ${stats.total}` : t.soldOut} />
      <Row label={t.roomsLabel} value={roomsText(stats)} />
    </dl>
  );
}

/** Available / reserved / sold as one thin proportional line and a quiet key. */
function StatusLine({ stats, common }: { stats: AvailabilityStats; common: Common }) {
  const parts = [
    { key: 'available', n: stats.available, bar: 'bg-accent', dot: 'bg-accent' },
    { key: 'reserved', n: stats.reserved, bar: 'bg-ink/35', dot: 'bg-ink/35' },
    { key: 'sold', n: stats.sold, bar: 'bg-ink/10', dot: 'bg-ink/15' },
  ] as const;
  return (
    <div className="mt-6">
      <div aria-hidden="true" className="flex h-[3px] w-full gap-px">
        {parts.map((p) =>
          p.n > 0 ? <span key={p.key} className={p.bar} style={{ flexGrow: p.n, flexBasis: 0 }} /> : null,
        )}
      </div>
      <ul className="label mt-3 flex flex-wrap gap-x-5 gap-y-2 text-muted">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={cn('h-1.5 w-1.5', p.dot)} />
            {common.statusPlural[p.key]} <span className="tabular text-ink">{p.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Price({ value, label, note, soldOut }: { value: string | null; label: string; note: string | null; soldOut: string }) {
  return (
    <div className="mt-8">
      <p className="label text-muted">{label}</p>
      <p className="mt-3 font-display text-display-md font-light tabular text-ink">{value ?? soldOut}</p>
      {note && value && <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{typo(note)}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="block min-w-0">
      <span className="label block text-muted">{label}</span>
      <span className="mt-2 block text-base tabular text-ink md:text-[1.0625rem]">{value}</span>
    </span>
  );
}
