'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { projects } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { formatMoldovaPhone } from '@/lib/validation';
import { cn } from '@/lib/utils';

type Variant = 'lead' | 'contact';
type Tone = 'light' | 'dark';

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
  const [phone, setPhone] = useState('+373 ');
  const [method, setMethod] = useState<'phone' | 'whatsapp' | 'telegram'>('phone');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState(false);
  const [done, setDone] = useState(false);

  const onDark = tone === 'light';
  const labelCls = cn('mb-1.5 block text-sm font-medium', onDark ? 'text-white/70' : 'text-muted');
  const inputCls = cn(
    'w-full rounded-xl border px-4 py-3 text-[0.95rem] outline-none transition-colors',
    onDark
      ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-brand focus:bg-white/10'
      : 'border-line/15 bg-white text-ink placeholder:text-muted/60 focus:border-brand',
  );
  const errCls = 'border-red-500/70';

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
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-2xl border p-10 text-center',
          onDark ? 'border-white/15 bg-white/5' : 'border-line/15 bg-sand',
          className,
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-graphite-900">
          <Check className="h-7 w-7" />
        </span>
        <h3 className={cn('font-display text-2xl font-semibold', onDark ? 'text-white' : 'text-ink')}>
          {dict.form.successTitle}
        </h3>
        <p className={onDark ? 'text-white/65' : 'text-muted'}>{dict.form.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lf-name" className={labelCls}>
            {dict.form.name}
          </label>
          <input
            id="lf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={dict.form.namePlaceholder}
            className={cn(inputCls, errors.name && errCls)}
            aria-invalid={errors.name || undefined}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{dict.form.errors.name}</p>}
        </div>
        <div>
          <label htmlFor="lf-phone" className={labelCls}>
            {dict.form.phone}
          </label>
          <input
            id="lf-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(formatMoldovaPhone(e.target.value))}
            placeholder={dict.form.phonePlaceholder}
            className={cn(inputCls, errors.phone && errCls)}
            aria-invalid={errors.phone || undefined}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{dict.form.errors.phone}</p>}
        </div>
      </div>

      {variant === 'lead' ? (
        <>
          <div>
            <label htmlFor="lf-project" className={labelCls}>
              {dict.form.project}
            </label>
            <select
              id="lf-project"
              name="project"
              defaultValue={projectName}
              className={cn(inputCls, 'appearance-none')}
            >
              <option value="">{dict.form.projectAny}</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.name[locale]}>
                  {p.name[locale]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelCls}>{dict.form.contactMethod}</span>
            <div className="flex flex-wrap gap-2">
              {(['phone', 'whatsapp', 'telegram'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    method === m
                      ? 'border-brand bg-brand text-graphite-900'
                      : onDark
                        ? 'border-white/15 text-white/70 hover:border-white/40'
                        : 'border-line/20 text-muted hover:border-ink',
                  )}
                >
                  {dict.form.methods[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="lf-comment" className={labelCls}>
              {dict.form.comment}
            </label>
            <textarea
              id="lf-comment"
              name="comment"
              rows={3}
              placeholder={dict.form.commentPlaceholder}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="lf-email" className={labelCls}>
                {dict.form.emailOptional}
              </label>
              <input id="lf-email" name="email" type="email" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label htmlFor="lf-subject" className={labelCls}>
                {dict.form.subject}
              </label>
              <input id="lf-subject" name="subject" type="text" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="lf-message" className={labelCls}>
              {dict.form.message}
            </label>
            <textarea
              id="lf-message"
              name="message"
              rows={4}
              placeholder={dict.form.commentPlaceholder}
              className={cn(inputCls, 'resize-none')}
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

      <label className={cn('flex cursor-pointer items-start gap-3 text-sm', onDark ? 'text-white/60' : 'text-muted')}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
          aria-invalid={errors.consent || undefined}
        />
        <span className={errors.consent ? 'text-red-500' : undefined}>
          {dict.form.consent.split('политикой')[0]}
          <Link href={routes.privacy(locale)} className="underline hover:text-brand">
            {locale === 'ru' ? 'политикой конфиденциальности' : 'politica de confidențialitate'}
          </Link>
        </span>
      </label>

      {serverError && <p className="text-sm text-red-500">{dict.form.error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          'group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 text-[0.95rem] font-semibold text-graphite-900 transition-all duration-300 ease-premium hover:bg-brand-600 disabled:opacity-70 sm:w-auto',
        )}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting
          ? dict.form.submitting
          : variant === 'lead'
            ? dict.form.submit
            : dict.form.submitContact}
      </button>
    </form>
  );
}
