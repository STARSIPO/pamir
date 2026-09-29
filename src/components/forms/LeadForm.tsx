'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { formatMoldovaPhone } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type Variant = 'lead' | 'contact';
type Tone = 'light' | 'dark';
type Method = 'phone' | 'whatsapp' | 'telegram';

const METHODS: Method[] = ['phone', 'whatsapp', 'telegram'];

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
 * tracked captions, focus turns the rule to the accent and thickens it. The
 * contact method is a row of square toggles; consent is a square checkbox.
 *
 * `tone="light"` — on the dark band (light text); `tone="dark"` — on canvas.
 */
export function LeadForm({
  locale,
  dict,
  variant = 'lead',
  tone = 'dark',
  projectName = '',
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  variant?: Variant;
  tone?: Tone;
  projectName?: string;
  className?: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [phone, setPhone] = useState('+373 ');
  const [method, setMethod] = useState<Method>('phone');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState(false);
  const [done, setDone] = useState(false);

  const onBand = tone === 'light';
  const fid = (name: string) => `${uid}-${name}`;

  const fg = onBand ? 'text-band-fg' : 'text-ink';
  const muted = onBand ? 'text-band-muted' : 'text-muted';
  const labelCls = cn('label block', muted);
  const fieldCls = cn(
    'block w-full rounded-none border-0 border-b bg-transparent px-0 py-4 text-base outline-none',
    'transition-[border-color,box-shadow] duration-500 ease-premium',
    'focus:border-accent focus:shadow-[0_1px_0_0_rgb(var(--accent))] focus-visible:outline-none',
    onBand
      ? 'border-band-fg/25 text-band-fg placeholder:text-band-muted/70 hover:border-band-fg/50'
      : 'border-line/25 text-ink placeholder:text-muted/70 hover:border-line/50',
  );
  const errField = 'border-red-500 hover:border-red-500 focus:border-red-500 focus:shadow-[0_1px_0_0_theme(colors.red.500)]';
  // Restrained red, readable on either ground (the band is dark in every
  // theme; the canvas is dark only in the dark theme).
  const errText = onBand ? 'text-red-400' : 'text-red-700 [[data-theme=dark]_&]:text-red-400';
  const optionCls = onBand ? 'bg-band text-band-fg' : 'bg-surface text-ink';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(false);
    const fd = new FormData(e.currentTarget);

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
    const nextErrors: Record<string, boolean> = {};
    if (payload.name.trim().length < 2) nextErrors.name = true;
    if (!/^\+373\d{8}$/.test(payload.phone.replace(/[^\d+]/g, ''))) nextErrors.phone = true;
    if (!consent) nextErrors.consent = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

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
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center border border-accent text-accent">
          <svg viewBox="0 0 16 12" fill="none" className="h-3 w-4">
            <path d="M1 6.5 5.5 11 15 1" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </span>
        <h3 className={cn('mt-10 font-display text-display-md font-light text-balance', fg)}>{dict.form.successTitle}</h3>
        <p className={cn('mt-5 max-w-md text-pretty text-base leading-relaxed md:text-[1.0625rem]', muted)}>
          {dict.form.success}
        </p>
      </div>
    );
  }

  const error = (key: string, message: string) =>
    errors[key] ? (
      <p id={fid(`${key}-error`)} className={cn('mt-3 flex items-start gap-2.5 text-sm leading-snug', errText)}>
        <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 bg-current" />
        {message}
      </p>
    ) : null;

  const consentParts = splitConsent(dict.form.consent, dict.footer.privacy);
  const policyLink = (text: string) => (
    <Link
      href={routes.privacy(locale)}
      className={cn('underline decoration-1 underline-offset-4 transition-colors duration-500 hover:text-accent', fg)}
    >
      {text}
    </Link>
  );

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-9', className)} noValidate>
      <div className="grid gap-9 sm:grid-cols-2 sm:gap-x-gutter">
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
            onChange={(e) => setPhone(formatMoldovaPhone(e.target.value))}
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
                      'peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent',
                      onBand
                        ? 'border-band-fg/25 text-band-fg/80 hover:border-band-fg/60 hover:text-band-fg peer-checked:border-band-fg peer-checked:bg-band-fg peer-checked:text-band'
                        : 'border-line/25 text-ink/80 hover:border-line/60 hover:text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas',
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
          <div className="grid gap-9 sm:grid-cols-2 sm:gap-x-gutter">
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
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className={cn(
                'peer h-5 w-5 cursor-pointer appearance-none rounded-none border bg-transparent',
                'transition-[background-color,border-color] duration-500 ease-premium',
                'checked:border-accent checked:bg-accent focus-visible:outline-offset-2',
                errors.consent ? 'border-red-500' : onBand ? 'border-band-fg/40 hover:border-band-fg' : 'border-line/40 hover:border-ink',
              )}
              aria-invalid={errors.consent || undefined}
              aria-describedby={errors.consent ? fid('consent-error') : undefined}
            />
            <svg
              viewBox="0 0 16 12"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-auto h-2.5 w-3 text-on-accent opacity-0 transition-opacity duration-300 peer-checked:opacity-100"
            >
              <path d="M1 6.5 5.5 11 15 1" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          </span>
          <span className="text-pretty">
            {consentParts ? (
              <>
                {consentParts[0]}
                {policyLink(consentParts[1])}
              </>
            ) : (
              <>
                {dict.form.consent} {policyLink(dict.footer.privacy)}
              </>
            )}
          </span>
        </label>
        {error('consent', dict.form.errors.consent)}
      </div>

      {serverError && (
        <p role="alert" className={cn('flex items-start gap-2.5 text-sm leading-relaxed', errText)}>
          <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 bg-current" />
          {dict.form.error}
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
