'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { ApartmentType, OutdoorType } from '@/lib/inventory/types';
import { estimate, formatArea, formatEUR, installment, pricing, type ParkingOption } from '@/lib/pricing/engine';
import {
  areaRange,
  calculatorLimits,
  convertDownPayment,
  defaultInstallment,
  downPaymentBounds,
  floorRange,
  outdoorAreaRange,
  reconcileState,
  sameState,
  toEstimateInput,
  type CalculatorProjectSetup,
  type CalculatorState,
  type DownPaymentMode,
} from '@/lib/pricing/calculator';
import { clearLeadCalculation, publishLeadCalculation, type LeadCalculation } from '@/lib/pricing/lead-calculation';
import { track } from '@/lib/analytics';
import { getLenis } from '@/lib/smooth-scroll';
import { NBSP, typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Arrow, Button } from '@/components/ui/Button';
import { AnimatedAmount } from './AnimatedAmount';
import { ChoiceGroup, FieldRow, NumberField, RangeSlider } from './controls';
import { areaShort, areaText, fill, formatInteger, formatPercent, plusEUR } from './format';
import { useDebouncedValue, useInView, useIsClient, useSettledEffect } from './hooks';

type Strings = Dictionary['inventory']['calculator'];
type Common = Dictionary['inventory']['common'];
export type CalculatorMode = 'price' | 'installment';

export interface CalculatorProjectOption {
  slug: string;
  name: string;
  setup: CalculatorProjectSetup;
  /** Building id → localized name ("Блок 3"). */
  buildingNames: Record<string, string>;
}

/** The apartment a preset came from ("По квартире №34 · Блок 3 · Этаж 7"). */
export interface CalculatorApartmentContext {
  id: string;
  number: string;
  building?: string;
  floor: number;
}

const MODES: CalculatorMode[] = ['price', 'installment'];
/** The LeadSection every project / apartment page closes with. */
const LEAD_ID = 'lead';
const pad = (n: number) => String(n).padStart(2, '0');
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Glide to an element, clear of the compact header (Lenis when it drives the page). */
function scrollToElement(el: HTMLElement | null, gap = 24) {
  if (!el) return;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || 68;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: -(header + gap) });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: window.scrollY + el.getBoundingClientRect().top - header - gap,
    behavior: reduce ? 'auto' : 'smooth',
  });
}

/**
 * The interactive part of the cost calculator (see CostCalculator for the
 * server-side setup). Two modes behind one segmented switch:
 *
 *   price        parameters on the left, «Ваш расчёт» on a dark plate on the
 *                right (sticky from lg): the lines, a large «Итого», the
 *                installment teaser and the lead button.
 *   installment  price (prefilled from the estimate, editable), down payment
 *                in % or €, term → down payment, remainder, «≈ €X / мес».
 *
 * Every figure comes from the pricing engine (config/pricing.json). On phones
 * the parameters stack and the plate follows them; while the parameters are
 * on screen a slim bar at the bottom keeps the running total in view.
 */
export function CalculatorClient({
  id,
  locale,
  t,
  c,
  projects,
  initial,
  context,
  defaultMode,
  apartmentId,
}: {
  id: string;
  locale: Locale;
  t: Strings;
  c: Common;
  projects: CalculatorProjectOption[];
  initial: CalculatorState;
  context: CalculatorApartmentContext | null;
  defaultMode: CalculatorMode;
  apartmentId?: string;
}) {
  const uid = useId();
  const tabId = (m: CalculatorMode) => `${uid}-tab-${m}`;
  const panelId = (m: CalculatorMode) => `${uid}-panel-${m}`;

  const [mode, setMode] = useState<CalculatorMode>(defaultMode);
  // Panels animate in only after the buyer switched — never on page load.
  const [switched, setSwitched] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  /* ---------------- price ---------------- */
  const [state, setState] = useState<CalculatorState>(initial);
  const project = projects.find((p) => p.slug === state.projectSlug) ?? projects[0];
  const setup = project.setup;
  const est = estimate(toEstimateInput(state));

  // Whether the buyer has changed anything yet: analytics and the live
  // region stay silent until then (the plate already reads the figure).
  const [touched, setTouched] = useState({ price: false, installment: false });
  const touch = (key: 'price' | 'installment') => {
    if (!touched[key]) setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const trackPrice = useSettledEffect(() => {
    track('calculator_change', {
      project: state.projectSlug,
      building: state.buildingId ?? null,
      rooms: state.rooms,
      area: state.area,
      floor: state.floor,
      type: state.type,
      outdoor: state.outdoor,
      parking: state.parking,
      total: est.total,
      apartment: apartmentId ?? null,
    });
  }, [state]);
  const armPrice = () => {
    trackPrice();
    touch('price');
  };

  const update = (patch: Partial<CalculatorState>) => {
    armPrice();
    setState((s) => ({ ...s, ...patch }));
  };

  const selectProject = (slug: string) => {
    const next = projects.find((p) => p.slug === slug);
    if (!next) return;
    armPrice();
    setState((s) => reconcileState(next.setup, { ...s, projectSlug: slug }));
  };

  const selectBuilding = (buildingId: string) => {
    armPrice();
    setState((s) => reconcileState(setup, { ...s, buildingId }));
  };

  const presetIntact = !!context && sameState(state, initial);

  /* ---------------- installment ---------------- */
  const cfg = pricing.installment;
  const limits = calculatorLimits();
  // The price follows the estimate until the buyer types their own.
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const price = manualPrice ?? est.total;
  const [down, setDown] = useState<{ mode: DownPaymentMode; value: number }>({
    mode: 'percent',
    value: cfg.defaultDownPaymentPercent,
  });
  const [term, setTerm] = useState(cfg.defaultTerm);
  const bounds = downPaymentBounds(price);
  const downValue =
    down.mode === 'percent'
      ? clamp(down.value, bounds.minPercent, bounds.maxPercent)
      : clamp(down.value, bounds.minAmount, bounds.maxAmount);
  // The engine is a handful of multiplications: computed on every render.
  const plan = installment({ price, downPayment: { mode: down.mode, value: downValue }, termMonths: term });
  const teaser = defaultInstallment(est.total);

  const trackInstallment = useSettledEffect(() => {
    track('installment_change', {
      price,
      down_mode: down.mode,
      down_percent: plan.downPaymentPercent,
      term,
      monthly: plan.monthly,
      apartment: apartmentId ?? null,
    });
  }, [price, down.mode, downValue, term]);
  const armInstallment = () => {
    trackInstallment();
    touch('installment');
  };

  const setDownMode = (m: DownPaymentMode) => {
    if (m === down.mode) return;
    armInstallment();
    setDown({ mode: m, value: convertDownPayment(downValue, down.mode, price) });
  };

  /* ---------------- modes ---------------- */
  const selectMode = (next: CalculatorMode, source: 'tab' | 'result') => {
    if (next === mode) return;
    setMode(next);
    setSwitched(true);
    if (next === 'installment') track('installment_change', { action: 'open', source, price });
  };

  // «Рассчитать рассрочку →»: carry the total over and bring the switch into view.
  const openInstallment = () => {
    setManualPrice(null);
    selectMode('installment', 'result');
    requestAnimationFrame(() => {
      document.getElementById(tabId('installment'))?.focus({ preventScroll: true });
      const tabs = tabsRef.current;
      if (tabs && tabs.getBoundingClientRect().top < 0) scrollToElement(tabs);
    });
  };

  const backToPrice = () => {
    selectMode('price', 'result');
    requestAnimationFrame(() => {
      document.getElementById(tabId('price'))?.focus({ preventScroll: true });
      const tabs = tabsRef.current;
      if (tabs && tabs.getBoundingClientRect().top < 0) scrollToElement(tabs);
    });
  };

  /* ---------------- shared bits ---------------- */
  const demo = pricing.demo;
  const sqm = c.sqm;
  const area = (v: number) => areaText(v, locale, sqm);
  const areaEnd = (v: number) => areaShort(v, locale, sqm);

  /* ---------------- lead hand-off ---------------- */
  // «Оставить заявку» carries what the buyer calculated to the lead form as
  // one readable line (lib/pricing/lead-calculation.ts), e.g. «Расчёт: Блок 3 ·
  // 2 комн. · 63,7 м² · этаж 7 · подземный паркинг — итого €101 200».
  const lower = (s: string) => s.toLocaleLowerCase(locale);
  const configLine = [
    // The page's own project is already preselected in the form.
    state.projectSlug !== initial.projectSlug ? project.name : null,
    state.buildingId ? project.buildingNames[state.buildingId] : null,
    `${state.rooms}${NBSP}${c.roomsShort}`,
    area(state.area),
    `${lower(c.floor)}${NBSP}${state.floor}`,
    state.type !== 'standard' ? lower(c.type[state.type]) : null,
    state.outdoor !== 'none' ? `${lower(c.outdoor[state.outdoor])} ${area(state.outdoorArea)}` : null,
    state.parking !== 'none' ? t.lead.parking[state.parking] : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const priceLine = fill(t.lead.price, { v: configLine, t: formatEUR(est.total, locale) });
  const planVars = {
    d: formatPercent(plan.downPaymentPercent, locale),
    a: formatEUR(plan.downPaymentAmount, locale),
    n: term,
    m: formatEUR(plan.monthly, locale),
  };
  // A price typed into the installment replaces the configuration it no longer matches.
  const leadSummary =
    mode === 'price'
      ? priceLine
      : `${manualPrice === null ? priceLine : fill(t.lead.manualPrice, { p: formatEUR(price, locale) })}; ${fill(t.lead.installment, planVars)}`;
  const leadCalculation: LeadCalculation = {
    summary: leadSummary,
    mode,
    projectSlug: state.projectSlug,
    buildingId: state.buildingId,
    apartmentId,
    total: est.total,
    installment:
      mode === 'installment'
        ? {
            price,
            downPayment: plan.downPaymentAmount,
            downPaymentPercent: plan.downPaymentPercent,
            termMonths: term,
            monthly: plan.monthly,
          }
        : undefined,
  };

  // Once handed over, the lead follows later (settled) changes, so the
  // manager receives what the buyer last saw; forgotten when the page goes.
  const leadRef = useRef(leadCalculation);
  useEffect(() => {
    leadRef.current = leadCalculation;
  });
  const [handedOver, setHandedOver] = useState(false);
  const settledSummary = useDebouncedValue(leadSummary, 600);
  useEffect(() => {
    if (handedOver) publishLeadCalculation(leadRef.current, LEAD_ID);
  }, [handedOver, settledSummary]);
  useEffect(() => clearLeadCalculation, []);

  const onLead = () => {
    track('lead_open', {
      source: 'calculator',
      mode,
      total: est.total,
      monthly: mode === 'installment' ? plan.monthly : null,
      apartment: apartmentId ?? null,
    });
    publishLeadCalculation(leadCalculation, LEAD_ID);
    setHandedOver(true);
  };

  const priceInputsRef = useRef<HTMLDivElement>(null);
  const priceResultRef = useRef<HTMLDivElement>(null);
  const instInputsRef = useRef<HTMLDivElement>(null);
  const instResultRef = useRef<HTMLDivElement>(null);

  // Screen readers hear the result once a change has settled, not per frame.
  const announcePrice = useDebouncedValue(fill(t.announce.total, { v: formatEUR(est.total, locale) }), 900);
  const announceMonthly = useDebouncedValue(fill(t.announce.monthly, { v: formatEUR(plan.monthly, locale) }), 900);

  /* ---------------- price rows ---------------- */
  const floors = floorRange(setup, state.buildingId);
  const areaR = areaRange(setup, state.rooms, state.area);
  const outdoorR = outdoorAreaRange(setup, state.outdoor, state.outdoor === 'none' ? undefined : state.outdoorArea);
  const showBuildings = setup.buildings.length > 1;
  let row = 0;
  const nextIndex = () => pad(++row);

  const ids = {
    project: `${uid}-project`,
    building: `${uid}-building`,
    rooms: `${uid}-rooms`,
    area: `${uid}-area`,
    floor: `${uid}-floor`,
    type: `${uid}-type`,
    outdoor: `${uid}-outdoor`,
    outdoorArea: `${uid}-outdoor-area`,
    parking: `${uid}-parking`,
    price: `${uid}-price`,
    down: `${uid}-down`,
    downMode: `${uid}-down-mode`,
    term: `${uid}-term`,
  };

  const priceRows = (
    <div className="border-b border-line/15">
      <FieldRow index={nextIndex()} label={t.fields.project} labelId={ids.project}>
        <ChoiceGroup
          name="project"
          labelledBy={ids.project}
          value={state.projectSlug}
          grid={false}
          options={projects.map((p) => ({ value: p.slug, label: p.name }))}
          onChange={selectProject}
        />
      </FieldRow>

      {showBuildings && (
        <FieldRow index={nextIndex()} label={t.fields.building} labelId={ids.building}>
          <ChoiceGroup
            name="building"
            labelledBy={ids.building}
            value={state.buildingId ?? ''}
            options={setup.buildings.map((b) => ({ value: b.id, label: project.buildingNames[b.id] ?? b.id }))}
            onChange={selectBuilding}
          />
        </FieldRow>
      )}

      <FieldRow index={nextIndex()} label={t.fields.rooms} labelId={ids.rooms}>
        <ChoiceGroup
          name="rooms"
          labelledBy={ids.rooms}
          value={state.rooms}
          numeric
          options={setup.rooms.map((n) => ({ value: n, label: n, ariaLabel: c.rooms[n] ?? String(n) }))}
          onChange={(rooms) => update({ rooms, area: areaRange(setup, rooms).default })}
        />
      </FieldRow>

      <FieldRow index={nextIndex()} label={t.fields.area} htmlFor={ids.area}>
        <NumberField
          id={ids.area}
          value={state.area}
          min={areaR.min}
          max={areaR.max}
          step={1}
          decimals={1}
          widthCh={4.6}
          format={(v) => formatArea(v, locale)}
          onChange={(v) => update({ area: v })}
          ariaLabel={t.inputs.area}
          suffix={sqm}
        />
        <div className="mt-3">
          <RangeSlider
            value={state.area}
            min={areaR.min}
            max={areaR.max}
            step={limits.areaStep}
            keyStep={1}
            onChange={(v) => update({ area: v })}
            ariaLabel={t.inputs.area}
            valueText={area(state.area)}
          />
          <RangeEnds min={areaEnd(areaR.min)} max={areaEnd(areaR.max)} />
        </div>
      </FieldRow>

      <FieldRow index={nextIndex()} label={t.fields.floor} htmlFor={ids.floor}>
        <NumberField
          id={ids.floor}
          value={state.floor}
          min={floors.min}
          max={floors.max}
          step={1}
          widthCh={2.4}
          format={(v) => String(v)}
          onChange={(v) => update({ floor: v })}
          ariaLabel={t.inputs.floor}
          suffix={fill(t.floorOf, { n: floors.max })}
        />
        <div className="mt-3">
          <RangeSlider
            value={state.floor}
            min={floors.min}
            max={floors.max}
            step={1}
            ticks
            onChange={(v) => update({ floor: v })}
            ariaLabel={t.inputs.floor}
            valueText={`${c.floor} ${state.floor}`}
          />
          <RangeEnds min={String(floors.min)} max={String(floors.max)} />
        </div>
      </FieldRow>

      <FieldRow index={nextIndex()} label={t.fields.type} labelId={ids.type}>
        <ChoiceGroup<ApartmentType>
          name="type"
          labelledBy={ids.type}
          value={state.type}
          options={setup.types.map((ty) => ({ value: ty, label: c.type[ty] }))}
          onChange={(type) => update({ type })}
        />
      </FieldRow>

      <FieldRow index={nextIndex()} label={t.fields.outdoor} labelId={ids.outdoor}>
        <ChoiceGroup<OutdoorType>
          name="outdoor"
          labelledBy={ids.outdoor}
          value={state.outdoor}
          options={setup.outdoor.map((o) => ({ value: o, label: c.outdoor[o] }))}
          onChange={(outdoor) =>
            update({
              outdoor,
              outdoorArea:
                outdoor === 'none'
                  ? 0
                  : outdoor === state.outdoor
                    ? state.outdoorArea
                    : outdoorAreaRange(setup, outdoor).default,
            })
          }
        />
        {/* The area opens under the choice; collapsed, it is inert. */}
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-600 ease-premium',
            state.outdoor === 'none' ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
          )}
          inert={state.outdoor === 'none'}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="pt-6">
              <label htmlFor={ids.outdoorArea} className="label text-muted">
                {state.outdoor === 'terrace' ? t.fields.outdoorArea.terrace : t.fields.outdoorArea.balcony}
              </label>
              <NumberField
                id={ids.outdoorArea}
                className="mt-3"
                value={state.outdoorArea}
                min={outdoorR.min}
                max={outdoorR.max}
                step={1}
                decimals={1}
                widthCh={4.6}
                format={(v) => formatArea(v, locale)}
                onChange={(v) => update({ outdoorArea: v })}
                ariaLabel={t.inputs.outdoorArea}
                suffix={sqm}
              />
              <div className="mt-3">
                <RangeSlider
                  value={state.outdoorArea}
                  min={outdoorR.min}
                  max={outdoorR.max}
                  step={limits.areaStep}
                  keyStep={1}
                  onChange={(v) => update({ outdoorArea: v })}
                  ariaLabel={t.inputs.outdoorArea}
                  valueText={area(state.outdoorArea)}
                />
                <RangeEnds min={areaEnd(outdoorR.min)} max={areaEnd(outdoorR.max)} />
              </div>
            </div>
          </div>
        </div>
      </FieldRow>

      <FieldRow index={nextIndex()} label={t.fields.parking} labelId={ids.parking}>
        <ChoiceGroup<ParkingOption>
          name="parking"
          labelledBy={ids.parking}
          value={state.parking}
          options={setup.parking.map((p) => ({
            value: p.option,
            label: t.parking[p.option],
            hint: p.price > 0 ? plusEUR(p.price, locale) : undefined,
          }))}
          onChange={(parking) => update({ parking })}
        />
      </FieldRow>
    </div>
  );

  /* ---------------- price result ---------------- */
  const outdoorSharePct = Math.round((setup.outdoorShare[state.outdoor] ?? 0) * 100);
  const priceResult = (
    <ResultPlate
      plateRef={priceResultRef}
      title={t.result.title}
      demoBadge={demo ? c.demoBadge : undefined}
      context={
        context ? (
          <ContextLine
            context={context}
            intact={presetIntact}
            t={t}
            c={c}
            onReset={() => {
              armPrice();
              setState(initial);
            }}
          />
        ) : null
      }
      lines={
        <dl className="border-b border-band-fg/15">
          <ResultRow label={t.result.area} value={area(state.area)} />
          <ResultRow label={t.result.pricePerSqm} value={formatEUR(est.pricePerSqm, locale)} />
          {/* What the balcony / terrace adds, in €, like every other line;
              the rule behind it is the sub-label. */}
          {state.outdoor !== 'none' && (
            <ResultRow
              label={`${c.outdoor[state.outdoor]} ${area(state.outdoorArea)}`}
              sub={fill(t.result.outdoorShare, { p: outdoorSharePct })}
              value={plusEUR(est.outdoorPrice, locale)}
            />
          )}
          <ResultRow label={t.result.apartmentPrice} value={formatEUR(est.apartmentPrice, locale)} />
          {state.parking !== 'none' && (
            <ResultRow label={t.result.parking} value={plusEUR(est.parkingPrice, locale)} />
          )}
        </dl>
      }
    >
      <div>
        <p className="label text-band-muted">{t.result.total}</p>
        <p className="mt-3 font-display text-display-lg font-light leading-none text-band-fg">
          <AnimatedAmount value={est.total} locale={locale} />
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {touched.price ? announcePrice : ''}
      </p>

      <div className="mt-8 border-t border-band-fg/15 pt-5">
        <p className="text-sm leading-relaxed text-band-muted">
          <span className="text-band-fg">
            {typo(fill(t.result.installmentTeaser, { m: formatEUR(teaser.monthly, locale) }))}
          </span>
          <span className="block tabular">
            {fill(t.result.installmentTeaserHint, { d: cfg.defaultDownPaymentPercent, t: cfg.defaultTerm })}
          </span>
        </p>
        <button
          type="button"
          onClick={openInstallment}
          className="group mt-3 inline-flex min-h-11 items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-band-fg"
        >
          <span className="link-rule pb-1">{t.result.toInstallment}</span>
          <Arrow />
        </button>
      </div>

      <Button href={`#${LEAD_ID}`} variant="inverse" size="lg" arrow onClick={onLead} className="mt-8 w-full">
        {t.result.lead}
      </Button>

      <p className="mt-6 text-pretty text-xs leading-relaxed text-band-muted">{typo(c.priceNote)}</p>
    </ResultPlate>
  );

  /* ---------------- installment rows ---------------- */
  const priceBounds = limits.installmentPrice;
  const pctText = (v: number) => `${formatPercent(v, locale)}%`;
  const installmentRows = (
    <div className="border-b border-line/15">
      <FieldRow index="01" label={t.installment.price} htmlFor={ids.price}>
        <NumberField
          id={ids.price}
          value={price}
          min={priceBounds.min}
          max={priceBounds.max}
          step={1000}
          widthCh={7.5}
          format={(v) => formatInteger(v, locale)}
          onChange={(v) => {
            armInstallment();
            setManualPrice(v === est.total ? null : v);
          }}
          ariaLabel={t.inputs.price}
          prefix="€"
        />
        <div className="mt-4 flex min-h-11 items-center">
          {manualPrice === null ? (
            <span className="label text-muted">{t.installment.fromEstimate}</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                armInstallment();
                setManualPrice(null);
              }}
              className="group label inline-flex min-h-11 items-center gap-2 text-ink"
            >
              <span className="link-rule pb-1 tabular">
                {fill(t.installment.resetPrice, { v: formatEUR(est.total, locale) })}
              </span>
            </button>
          )}
        </div>
      </FieldRow>

      <FieldRow index="02" label={t.installment.downPayment} htmlFor={ids.down}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          {down.mode === 'percent' ? (
            <NumberField
              key="percent"
              id={ids.down}
              value={downValue}
              min={bounds.minPercent}
              max={bounds.maxPercent}
              step={1}
              widthCh={2.6}
              format={(v) => String(v)}
              onChange={(v) => {
                armInstallment();
                setDown({ mode: 'percent', value: v });
              }}
              ariaLabel={t.inputs.downPercent}
              suffix="%"
            />
          ) : (
            <NumberField
              key="amount"
              id={ids.down}
              value={downValue}
              min={bounds.minAmount}
              max={bounds.maxAmount}
              step={bounds.amountStep}
              widthCh={7.5}
              format={(v) => formatInteger(v, locale)}
              onChange={(v) => {
                armInstallment();
                setDown({ mode: 'amount', value: v });
              }}
              ariaLabel={t.inputs.downAmount}
              prefix="€"
            />
          )}
          <div className="flex items-center gap-4">
            <span id={ids.downMode} className="sr-only">
              {t.installment.downModeLabel}
            </span>
            <span className="text-sm tabular text-muted">
              {down.mode === 'percent'
                ? `= ${formatEUR(plan.downPaymentAmount, locale)}`
                : `= ${pctText(plan.downPaymentPercent)}`}
            </span>
            <ChoiceGroup<DownPaymentMode>
              name="down-mode"
              labelledBy={ids.downMode}
              value={down.mode}
              className="w-[6.5rem]"
              options={[
                { value: 'percent', label: t.installment.downModes.percent },
                { value: 'amount', label: t.installment.downModes.amount },
              ]}
              onChange={setDownMode}
            />
          </div>
        </div>
        <div className="mt-3">
          {down.mode === 'percent' ? (
            <>
              <RangeSlider
                value={downValue}
                min={bounds.minPercent}
                max={bounds.maxPercent}
                step={1}
                onChange={(v) => {
                  armInstallment();
                  setDown({ mode: 'percent', value: v });
                }}
                ariaLabel={t.inputs.downPercent}
                valueText={`${pctText(downValue)} — ${formatEUR(plan.downPaymentAmount, locale)}`}
              />
              <RangeEnds min={pctText(bounds.minPercent)} max={pctText(bounds.maxPercent)} />
            </>
          ) : (
            <>
              <RangeSlider
                value={downValue}
                min={bounds.minAmount}
                max={bounds.maxAmount}
                step={bounds.amountStep}
                keyStep={bounds.amountStep * 2}
                onChange={(v) => {
                  armInstallment();
                  setDown({ mode: 'amount', value: v });
                }}
                ariaLabel={t.inputs.downAmount}
                valueText={`${formatEUR(downValue, locale)} — ${pctText(plan.downPaymentPercent)}`}
              />
              <RangeEnds min={formatEUR(bounds.minAmount, locale)} max={formatEUR(bounds.maxAmount, locale)} />
            </>
          )}
        </div>
      </FieldRow>

      <FieldRow index="03" label={t.installment.term} labelId={ids.term}>
        <ChoiceGroup<number>
          name="term"
          labelledBy={ids.term}
          value={term}
          numeric
          options={cfg.terms.map((m) => ({
            value: m,
            label: m,
            hint: t.installment.months,
            ariaLabel: `${m} ${t.installment.months}`,
          }))}
          onChange={(m) => {
            armInstallment();
            setTerm(m);
          }}
        />
      </FieldRow>
    </div>
  );

  /* ---------------- installment result ---------------- */
  const rate = cfg.annualInterestRate;
  const installmentResult = (
    <ResultPlate
      plateRef={instResultRef}
      title={t.installmentResult.title}
      demoBadge={demo ? c.demoBadge : undefined}
      context={
        context && presetIntact && manualPrice === null ? (
          <p className="mt-3 text-sm text-band-muted">
            {[fill(t.context, { n: context.number }), context.building, `${c.floor} ${context.floor}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null
      }
      lines={
        <dl className="border-b border-band-fg/15">
          <ResultRow label={t.installment.price} value={formatEUR(price, locale)} />
          <ResultRow
            label={t.installmentResult.down}
            value={
              <>
                <span className="mr-2 text-band-muted">{pctText(plan.downPaymentPercent)}</span>
                {formatEUR(plan.downPaymentAmount, locale)}
              </>
            }
          />
          <ResultRow label={t.installmentResult.remainder} value={formatEUR(plan.remainder, locale)} />
          <ResultRow label={t.installmentResult.term} value={`${term}${NBSP}${t.installment.months}`} />
          {rate > 0 && (
            <>
              <ResultRow label={t.installmentResult.totalPaid} value={formatEUR(plan.totalPaid, locale)} />
              <ResultRow
                label={t.installmentResult.overpay}
                value={formatEUR(Math.max(0, plan.totalPaid - price), locale)}
                quiet
              />
            </>
          )}
        </dl>
      }
    >
      <div>
        <p className="label text-band-muted">{t.installmentResult.monthly}</p>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 font-display text-display-lg font-light leading-none text-band-fg">
          <span className="text-band-muted">≈</span>
          <AnimatedAmount value={plan.monthly} locale={locale} />
          <span className="font-sans text-base tracking-normal text-band-muted">{t.installmentResult.perMonth}</span>
        </p>
        <p className="mt-4 text-sm text-band-muted">
          {typo(rate > 0 ? fill(t.installmentResult.rate, { r: rate }) : t.installmentResult.interestFree)}
        </p>
      </div>
      <p aria-live="polite" className="sr-only">
        {touched.installment ? announceMonthly : ''}
      </p>

      <Button href={`#${LEAD_ID}`} variant="inverse" size="lg" arrow onClick={onLead} className="mt-8 w-full">
        {t.result.lead}
      </Button>
      <button
        type="button"
        onClick={backToPrice}
        className="group mt-3 inline-flex min-h-11 items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-band-fg"
      >
        <Arrow className="rotate-180 group-hover:-translate-x-1" />
        <span className="link-rule pb-1">{t.installment.back}</span>
      </button>

      <p className="mt-6 border-t border-band-fg/15 pt-5 text-pretty text-sm leading-relaxed text-band-fg">
        {typo(t.installmentNote)}
      </p>
    </ResultPlate>
  );

  /* ---------------- layout ---------------- */
  const panel = (m: CalculatorMode, inputs: ReactNode, result: ReactNode, inputsRef: RefObject<HTMLDivElement | null>) => (
    <div
      role="tabpanel"
      id={panelId(m)}
      aria-labelledby={tabId(m)}
      hidden={mode !== m}
      className={cn(switched && 'motion-safe:animate-fade-up')}
    >
      <div className="grid gap-12 md:gap-16 lg:grid-cols-12 lg:gap-x-gutter lg:gap-y-0">
        <div ref={inputsRef} className="min-w-0 lg:col-span-7">
          {inputs}
        </div>
        {/* The grid item itself is sticky (a wrapper around the plate would
            be exactly as tall as the plate and could not move). */}
        <Reveal
          delay={0.1}
          className="min-w-0 lg:sticky lg:top-[calc(var(--header-h-compact)+2rem)] lg:col-span-5 lg:col-start-8 lg:self-start xl:col-span-4 xl:col-start-9"
        >
          {result}
        </Reveal>
      </div>
    </div>
  );

  return (
    <div id={id} className="scroll-mt-[calc(var(--header-h-compact)+1rem)]">
      <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" />

      <div ref={tabsRef} className="mt-12 md:mt-16">
        <ModeSwitch
          mode={mode}
          label={t.modesLabel}
          labels={t.modes}
          tabId={tabId}
          panelId={panelId}
          onSelect={(m) => selectMode(m, 'tab')}
        />
      </div>

      <div className="mt-8 md:mt-10">
        {panel('price', priceRows, priceResult, priceInputsRef)}
        {panel('installment', installmentRows, installmentResult, instInputsRef)}
      </div>

      <MobileSummary
        active={mode === 'price'}
        areaRef={priceInputsRef}
        targetRef={priceResultRef}
        label={t.sticky.total}
        value={est.total}
        locale={locale}
        details={t.sticky.details}
      />
      <MobileSummary
        active={mode === 'installment'}
        areaRef={instInputsRef}
        targetRef={instResultRef}
        label={t.sticky.monthly}
        value={plan.monthly}
        suffix={t.installmentResult.perMonth}
        locale={locale}
        details={t.sticky.details}
      />
    </div>
  );
}

/* ========================================================================== */

/** Min / max captions under a slider. */
function RangeEnds({ min, max }: { min: string; max: string }) {
  return (
    <div aria-hidden="true" className="mt-1 flex justify-between gap-4 text-xs tabular text-muted">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  );
}

/**
 * «Стоимость | Рассрочка». A hairline frame with an ink block that slides
 * under the active label; tabs in the ARIA sense (arrows, Home/End move and
 * select, roving tabindex).
 */
function ModeSwitch({
  mode,
  label,
  labels,
  tabId,
  panelId,
  onSelect,
}: {
  mode: CalculatorMode;
  label: string;
  labels: Record<CalculatorMode, string>;
  tabId: (m: CalculatorMode) => string;
  panelId: (m: CalculatorMode) => string;
  onSelect: (m: CalculatorMode) => void;
}) {
  const index = MODES.indexOf(mode);
  const go = (i: number) => {
    const next = MODES[(i + MODES.length) % MODES.length];
    onSelect(next);
    document.getElementById(tabId(next))?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className="relative grid w-full grid-cols-2 border border-line/25 sm:w-[24rem]"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        else if (e.key === 'ArrowLeft') go(index - 1);
        else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(MODES.length - 1);
        else return;
        e.preventDefault();
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-ink transition-transform duration-600 ease-premium"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {MODES.map((m) => {
        const selected = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            id={tabId(m)}
            aria-selected={selected}
            aria-controls={panelId(m)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(m)}
            className={cn(
              'label relative z-[1] h-12 px-4 transition-colors duration-500 ease-premium focus-visible:outline-offset-[-6px]',
              selected ? 'text-canvas focus-visible:outline-canvas' : 'text-muted hover:text-ink',
            )}
          >
            {labels[m]}
          </button>
        );
      })}
    </div>
  );
}

/** The dark plate that carries the result — the calculator's focal point. */
function ResultPlate({
  plateRef,
  title,
  demoBadge,
  context,
  lines,
  children,
}: {
  plateRef: RefObject<HTMLDivElement | null>;
  title: string;
  demoBadge?: string;
  context?: ReactNode;
  /** The itemised lines (a <dl>). */
  lines: ReactNode;
  /** The figure and the actions. Beside the lines on tablets, under them elsewhere. */
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section
      ref={plateRef}
      aria-labelledby={titleId}
      className="scroll-mt-[calc(var(--header-h-compact)+1.5rem)] bg-band p-6 text-band-fg sm:p-8 xl:p-10"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={titleId} className="label text-band-muted">
          {title}
        </h3>
        {demoBadge && <span className="label shrink-0 text-accent">{demoBadge}</span>}
      </div>
      {context}
      <div className="mt-8 md:grid md:grid-cols-2 md:gap-x-10 lg:block">
        <div className="min-w-0">{lines}</div>
        <div className="mt-8 min-w-0 md:mt-0 lg:mt-8">{children}</div>
      </div>
    </section>
  );
}

function ResultRow({
  label,
  sub,
  value,
  quiet = false,
}: {
  label: string;
  /** A second, smaller line under the label (how the value is derived). */
  sub?: string;
  value: ReactNode;
  quiet?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-band-fg/15 py-3.5">
      <dt className="text-sm text-band-muted">
        {label}
        {sub && <span className="mt-1 block text-xs tabular">{sub}</span>}
      </dt>
      <dd className={cn('text-right tabular', quiet ? 'text-sm text-band-muted' : 'text-base text-band-fg')}>{value}</dd>
    </div>
  );
}

/** «По квартире №34 · Блок 3 · Этаж 7», or a way back to it once the parameters changed. */
function ContextLine({
  context,
  intact,
  t,
  c,
  onReset,
}: {
  context: CalculatorApartmentContext;
  intact: boolean;
  t: Strings;
  c: Common;
  onReset: () => void;
}) {
  if (intact) {
    return (
      <p className="mt-3 text-sm text-band-fg">
        {[fill(t.context, { n: context.number }), context.building, `${c.floor} ${context.floor}`]
          .filter(Boolean)
          .join(' · ')}
      </p>
    );
  }
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-band-muted">
      <span>{t.contextChanged}</span>
      <button
        type="button"
        onClick={onReset}
        className="group inline-flex min-h-11 items-center text-band-fg"
      >
        <span className="link-rule pb-0.5">{fill(t.contextReset, { n: context.number })}</span>
      </button>
    </p>
  );
}

/**
 * Phones: while the parameters are on screen and the result plate is not, a
 * slim bar at the bottom keeps the running figure in view; «Подробнее» glides
 * to the plate. Portalled to <body> so no transformed ancestor (reveals, the
 * panel's entry) can turn `fixed` into `absolute`. A visual convenience only:
 * the plate carries the same figures for assistive tech.
 */
function MobileSummary({
  active,
  areaRef,
  targetRef,
  label,
  value,
  suffix,
  locale,
  details,
}: {
  active: boolean;
  areaRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
  label: string;
  value: number;
  suffix?: string;
  locale: string;
  details: string;
}) {
  const client = useIsClient();
  const areaIn = useInView(areaRef);
  const targetIn = useInView(targetRef);
  const show = active && areaIn && !targetIn;
  if (!client) return null;
  return createPortal(
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 transition-[opacity,transform] duration-500 ease-premium lg:hidden',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
    >
      <div className="flex items-center justify-between gap-4 border-t border-band-fg/15 bg-band px-[var(--gutter)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-band-fg">
        <div className="min-w-0">
          <p className="label text-band-muted">{label}</p>
          <p className="mt-1 flex items-baseline gap-2 font-display text-display-sm font-light">
            <AnimatedAmount value={value} locale={locale} />
            {suffix && <span className="font-sans text-sm text-band-muted">{suffix}</span>}
          </p>
        </div>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => scrollToElement(targetRef.current)}
          className="group label inline-flex min-h-11 shrink-0 items-center gap-3 text-band-fg"
        >
          <span className="link-rule pb-1">{details}</span>
          <Arrow className="w-4 rotate-90 group-hover:translate-x-0" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
