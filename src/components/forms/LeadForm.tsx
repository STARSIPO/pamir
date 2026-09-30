'use client';

import { useId, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { formatMoldovaPhone } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { NBSP, typo } from '@/lib/text';
import { getLenis } from '@/lib/smooth-scroll';
import { Button } from '@/components/ui/Button';

type Variant = 'lead' | 'contact';
type Tone = 'light' | 'dark';
type Method = 'phone' | 'whatsapp' | 'telegram';
type Field = 'name' | 'phone' | 'consent';

const METHODS: Method[] = ['phone', 'whatsapp', 'telegram'];
/** Validated controls, in DOM order — the first failing one takes focus. */
const FIELDS: Field[] = ['name', 'phone', 'consent'];

const validName = (v: string) => v.trim().length >= 2;
const validPhone = (v: string) => /^\+373\d{8}$/.test(v.replace(/[^\d+]/g, ''));

/**
 * Field pairs (name/phone, email/subject) sit side by side only when the FORM
 * is wide enough for two readable fields — measured on the form itself (it is
 * an inline-size container), not on the viewport, because the same form lives
 * in a full-width band, a 5-of-12 column and a narrow card.
 */
const pairCls =
  'grid gap-9 [@container_(min-width:28rem)]:grid-cols-2 [@container_(min-width:28rem)]:gap-x-gutter';

/**
 * Bring a control the user has to fix into view: focus it without the
 * browser's jump, then glide it to a third of the viewport (clear of the
 * compact header, label above and error below in view). Skipped when it is
 * already comfortably on screen.
 */
function revealControl(el: HTMLElement) {
  el.focus({ preventScroll: true });
  const rect = el.getBoundingClientRect();
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || 68;
  const margin = 72;
  if (rect.top >= header + margin && rect.bottom <= window.innerHeight - margin) return;
  const offset = -Math.max(header + margin, Math.round(window.innerHeight * 0.3));
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: window.scrollY + rect.top + offset, behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * Split the consent sentence so its closing privacy-policy phrase can be the
 * link ("…и политикой конфиденциальности" / "…și politica de
 * confidențialitate"). The phrase is found by the stem of the policy's own
 * title, so no language-specific text lives here. Null → render the sentence
 * whole and link the policy title after it.
 */
function splitConsent(consent: string, policyTitle: string): [string, string] | null {
  const stem = policyTitle.trim().split(/\s+/)[0]?.slice(0, 5).toLowerCase();
  if (!stem) return null;
  const at = consent.toLowerCase().lastIndexOf(stem);
  if (at <= 0) return null;
  return [consent.slice(0, at), consent.slice(at)];
}

/**
 * Lead / contact form.
 *
 * Architectural and quiet: fields are single rules (no boxes), labels are small
 * tracked captions, focus draws the rule at full ink and doubles its weight.
 * The contact method is a row of square toggles; consent is a square checkbox.
 *
 * A failed submit moves focus to the first field to fix (scrolling it into
 * view) and announces every error in a polite live region; each error clears
 * as soon as its field becomes valid.
 *
 * `tone="light"` — on the dark band (light text); `tone="dark"` — on canvas.
 * On the band every state is drawn in band-fg, never the accent: the band is
 * near-black in all themes and the stone accent would vanish on it.
 */
export function LeadForm({
  locale,
  dict,
  variant = 'lead',
  tone = 'dark',
  projectName = '',
  apartment = '',
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  variant?: Variant;
  tone?: Tone;
  projectName?: string;
  /** Apartment the lead is about; sent with the request (wired in the integration step). */
  apartment?: string;
  className?: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [phone, setPhone] = useState('+373 ');
  const [method, setMethod] = useState<Method>('phone');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  // Error summary for the live region, re-keyed on every failed attempt so a
  // repeated failure is announced again.
  const [announce, setAnnounce] = useState({ attempt: 0, text: '' });
  const [serverError, setServerError] = useState(false);
  const [done, setDone] = useState(false);

  const onBand = tone === 'light';
  const fid = (name: string) => `${uid}-${name}`;
  const clearError = (key: Field) => setErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));

  const fg = onBand ? 'text-band-fg' : 'text-ink';
  const muted = onBand ? 'text-band-muted' : 'text-muted';
  const labelCls = cn('label block', muted);
  // Resting rules and placeholders hold ≥3:1 on their ground; hover darkens
  // the rule, focus draws it at full strength and 2px.
  const fieldCls = cn(
    'block w-full rounded-none border-0 border-b bg-transparent px-0 py-4 text-base outline-none',
    'transition-[border-color,box-shadow] duration-500 ease-premium focus-visible:outline-none',
    onBand
      ? 'border-band-fg/40 text-band-fg placeholder:text-band-muted hover:border-band-fg/70 focus:border-band-fg focus:shadow-[0_1px_0_0_rgb(var(--band-fg))]'
      : 'border-line/50 text-ink placeholder:text-muted hover:border-line/75 focus:border-ink focus:shadow-[0_1px_0_0_rgb(var(--ink))]',
  );
  // Errors use the theme's danger tokens: `danger` is tuned to each theme's
  // canvas and surface, `danger-band` to the dark band (dark in every theme).
  const errField = onBand
    ? 'border-danger-band hover:border-danger-band focus:border-danger-band focus:shadow-[0_1px_0_0_rgb(var(--danger-on-band))]'
    : 'border-danger hover:border-danger focus:border-danger focus:shadow-[0_1px_0_0_rgb(var(--danger))]';
  const errText = onBand ? 'text-danger-band' : 'text-danger';
  const optionCls = onBand ? 'bg-band text-band-fg' : 'bg-surface text-ink';
  const errorMessages: Record<Field, string> = {
    name: dict.form.errors.name,
    phone: dict.form.errors.phone,
    consent: dict.form.errors.consent,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(false);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: String(fd.get('name') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      project: String(fd.get('project') ?? ''),
      subject: String(fd.get('subject') ?? ''),
      comment: String(fd.get('comment') ?? fd.get('message') ?? ''),
      method: variant === 'lead' ? method : undefined,
      consent,
      locale,
      variant,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      company: String(fd.get('company') ?? ''), // honeypot
    };

    // Lightweight client checks (server re-validates).
    const nextErrors: Partial<Record<Field, boolean>> = {};
    if (!validName(payload.name)) nextErrors.name = true;
    if (!validPhone(payload.phone)) nextErrors.phone = true;
    if (!consent) nextErrors.consent = true;
    const failed = FIELDS.filter((k) => nextErrors[k]);

    // Commit synchronously so aria-invalid / aria-describedby are in the DOM
    // before focus lands: the screen reader then reads the field's error.
    flushSync(() => {
      setErrors(nextErrors);
      setAnnounce((prev) => ({
        attempt: failed.length ? prev.attempt + 1 : prev.attempt,
        text: failed.length ? `${failed.map((k) => errorMessages[k]).join('. ')}.` : '',
      }));
    });
    if (failed.length) {
      const first = document.getElementById(fid(failed[0]));
      if (first) revealControl(first);
      return;
    }

    setSubmitting(true);

    // Static demo build (GitHub Pages) has no /api backend — succeed gracefully.
    if (process.env.NEXT_PUBLIC_STATIC === '1') {
      if (variant === 'lead') router.push(routes.thankyou(locale));
      else setDone(true);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');
      if (variant === 'lead') {
        router.push(routes.thankyou(locale));
      } else {
        setDone(true);
      }
    } catch {
      setServerError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className={cn('border-t pt-10', onBand ? 'border-band-fg/15' : 'border-line/15', className)}>
        <span
          aria-hidden="true"
          className={cn(
            'flex h-11 w-11 items-center justify-center border',
            onBand ? 'border-band-fg text-band-fg' : 'border-accent text-accent',
          )}
        >
          <svg viewBox="0 0 16 12" fill="none" className="h-3 w-4">
            <path d="M1 6.5 5.5 11 15 1" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </span>
        <h3 className={cn('mt-10 font-display text-display-md font-light text-balance', fg)}>{typo(dict.form.successTitle)}</h3>
        <p className={cn('mt-5 max-w-md text-pretty text-base leading-relaxed md:text-[1.0625rem]', muted)}>
          {typo(dict.form.success)}
        </p>
      </div>
    );
  }

  const error = (key: Field, message: string) =>
    errors[key] ? (
      <p id={fid(`${key}-error`)} className={cn('mt-3 flex items-start gap-2.5 text-sm leading-snug', errText)}>
        <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 bg-current" />
        {typo(message)}
      </p>
    ) : null;

  const consentParts = splitConsent(dict.form.consent, dict.footer.privacy);
  const policyLink = (text: string) => (
    <Link
      href={routes.privacy(locale)}
      className={cn(
        'underline decoration-1 underline-offset-4 transition-colors duration-500',
        // Hover in accent-strong, not the accent: this is small text.
        onBand ? 'hover:text-band-muted focus-visible:outline-band-fg' : 'hover:text-accent-strong',
        fg,
      )}
    >
      {text}
    </Link>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-9 [container-type:inline-size]', className)}
      noValidate
    >
      <div className={pairCls}>
        <div>
          <label htmlFor={fid('name')} className={labelCls}>
            {dict.form.name}
          </label>
          <input
            id={fid('name')}
            name="name"
            type="text"
            autoComplete="name"
            placeholder={dict.form.namePlaceholder}
            onChange={(e) => validName(e.target.value) && clearError('name')}
            className={cn(fieldCls, errors.name && errField)}
            aria-required="true"
            aria-invalid={errors.name || undefined}
            aria-describedby={errors.name ? fid('name-error') : undefined}
          />
          {error('name', dict.form.errors.name)}
        </div>
        <div>
          <label htmlFor={fid('phone')} className={labelCls}>
            {dict.form.phone}
          </label>
          <input
            id={fid('phone')}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              const next = formatMoldovaPhone(e.target.value);
              setPhone(next);
              if (validPhone(next)) clearError('phone');
            }}
            placeholder={dict.form.phonePlaceholder}
            className={cn(fieldCls, 'tabular', errors.phone && errField)}
            aria-required="true"
            aria-invalid={errors.phone || undefined}
            aria-describedby={errors.phone ? fid('phone-error') : undefined}
          />
          {error('phone', dict.form.errors.phone)}
        </div>
      </div>

      {variant === 'lead' ? (
        <>
          <div>
            <label htmlFor={fid('project')} className={labelCls}>
              {dict.form.project}
            </label>
            <div className="relative">
              <select
                id={fid('project')}
                name="project"
                defaultValue={projectName}
                className={cn(fieldCls, 'cursor-pointer appearance-none pr-10')}
              >
                <option value="" className={optionCls}>
                  {dict.form.projectAny}
                </option>
                {projects.map((p) => (
                  <option key={p.slug} value={p.name[locale]} className={optionCls}>
                    {p.name[locale]}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 14 8"
                fill="none"
                aria-hidden="true"
                className={cn('pointer-events-none absolute right-0 top-1/2 h-2 w-3.5 -translate-y-1/2', muted)}
              >
                <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          <fieldset>
            <legend className={labelCls}>{dict.form.contactMethod}</legend>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <label key={m} className="relative min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'label flex h-11 items-center justify-center border px-2',
                      'transition-[background-color,border-color,color] duration-500 ease-premium',
                      'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4',
                      onBand
                        ? 'peer-focus-visible:outline-band-fg border-band-fg/25 text-band-fg/80 hover:border-band-fg/60 hover:text-band-fg peer-checked:border-band-fg peer-checked:bg-band-fg peer-checked:text-band'
                        : 'peer-focus-visible:outline-accent border-line/25 text-ink/80 hover:border-line/60 hover:text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas',
                    )}
                  >
                    {dict.form.methods[m]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={fid('comment')} className={labelCls}>
              {dict.form.comment}
            </label>
            <textarea
              id={fid('comment')}
              name="comment"
              rows={3}
              placeholder={dict.form.commentPlaceholder}
              className={cn(fieldCls, 'resize-none leading-relaxed')}
            />
          </div>
        </>
      ) : (
        <>
          <div className={pairCls}>
            <div>
              <label htmlFor={fid('email')} className={labelCls}>
                {dict.form.emailOptional}
              </label>
              <input id={fid('email')} name="email" type="email" autoComplete="email" className={fieldCls} />
            </div>
            <div>
              <label htmlFor={fid('subject')} className={labelCls}>
                {dict.form.subject}
              </label>
              <input id={fid('subject')} name="subject" type="text" className={fieldCls} />
            </div>
          </div>
          <div>
            <label htmlFor={fid('message')} className={labelCls}>
              {dict.form.message}
            </label>
            <textarea
              id={fid('message')}
              name="message"
              rows={4}
              placeholder={dict.form.commentPlaceholder}
              className={cn(fieldCls, 'resize-none leading-relaxed')}
            />
          </div>
        </>
      )}

      {/* Honeypot (hidden from users & AT) */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div>
        <label className={cn('flex cursor-pointer items-start gap-4 text-sm leading-relaxed', muted)}>
          <span className="relative mt-px flex h-5 w-5 shrink-0">
            <input
              id={fid('consent')}
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) clearError('consent');
              }}
              className={cn(
                'peer h-5 w-5 cursor-pointer appearance-none rounded-none border bg-transparent',
                'transition-[background-color,border-color] duration-500 ease-premium focus-visible:outline-offset-2',
                onBand
                  ? 'checked:border-band-fg checked:bg-band-fg focus-visible:outline-band-fg'
                  : 'checked:border-accent checked:bg-accent',
                errors.consent
                  ? onBand
                    ? 'border-danger-band'
                    : 'border-danger'
                  : onBand ? 'border-band-fg/50 hover:border-band-fg' : 'border-line/60 hover:border-ink',
              )}
              aria-invalid={errors.consent || undefined}
              aria-describedby={errors.consent ? fid('consent-error') : undefined}
            />
            <svg
              viewBox="0 0 16 12"
              fill="none"
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-0 m-auto h-2.5 w-3 opacity-0 transition-opacity duration-300 peer-checked:opacity-100',
                onBand ? 'text-band' : 'text-on-accent',
              )}
            >
              <path d="M1 6.5 5.5 11 15 1" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </span>
          <span className="text-pretty">
            {/* The word before the link travels with it, so the sentence
                never ends a line on "и" / "și" with the policy below. */}
            {consentParts ? (
              <>
                {typo(consentParts[0]).replace(/\s+$/, NBSP)}
                {policyLink(typo(consentParts[1]))}
              </>
            ) : (
              <>
                {typo(dict.form.consent)} {policyLink(typo(dict.footer.privacy))}
              </>
            )}
          </span>
        </label>
        {error('consent', dict.form.errors.consent)}
      </div>

      {/* What went wrong, for screen readers; focus is already on the first
          field to fix. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announce.text && <p key={announce.attempt}>{announce.text}</p>}
      </div>

      {serverError && (
        <p role="alert" className={cn('flex items-start gap-2.5 text-sm leading-relaxed', errText)}>
          <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 bg-current" />
          {typo(dict.form.error)}
        </p>
      )}

      <Button
        type="submit"
        variant={onBand ? 'inverse' : 'primary'}
        size="lg"
        arrow={!submitting}
        disabled={submitting}
        aria-busy={submitting || undefined}
        className="w-full"
      >
        {submitting ? dict.form.submitting : variant === 'lead' ? dict.form.submit : dict.form.submitContact}
      </Button>
    </form>
  );
}
