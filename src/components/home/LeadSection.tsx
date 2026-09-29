import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { LeadForm } from '@/components/forms/LeadForm';
import { ContactInfo } from '@/components/shared/ContactInfo';
import { contact } from '@/content/site';
import { telHref } from '@/lib/utils';
import { splitWords } from '@/lib/text';

/**
 * 06 — Contact. The closing chapter, on the contrast band.
 *
 *   06 — СВЯЗАТЬСЯ ────────────────────────────────────────────────────
 *
 *   Подберём квартиру
 *   под ваши требования
 *
 *   subtitle                                  ИМЯ           ТЕЛЕФОН
 *                                             ───────────   ───────────
 *   ОТДЕЛ ПРОДАЖ                              ИНТЕРЕСУЮЩИЙ ПРОЕКТ
 *   +373 76 007 007                           ─────────────────────────
 *                                             [ЗВОНОК] [WHATSAPP] [TG]
 *   ─────────────  ─────────────              КОММЕНТАРИЙ
 *   АДМИНИСТРАЦИЯ  БУХГАЛТЕРИЯ                ─────────────────────────
 *   ─────────────  ─────────────              □ consent
 *   ОФИС           ГРАФИК · EMAIL             [ ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ → ]
 *
 * The heading spans the grid; below it the lead-in, the sales number and the
 * remaining details face the form, the details bottom-aligned with it. On
 * phones the order is heading → lead-in → number → form → details. On the
 * homepage the footer (also band) follows directly, so the section ends on
 * its padding with no closing rule.
 * `projectName` preselects the project in the form (project detail page).
 * `index` is the homepage chapter number; it is omitted by default when the
 * section closes a project page, where "06" would mean nothing.
 */
export function LeadSection({
  locale,
  dict,
  projectName,
  id = 'lead',
  index = projectName ? undefined : '06',
}: {
  locale: Locale;
  dict: Dictionary;
  projectName?: string;
  id?: string;
  index?: string;
}) {
  const titleId = `${id}-title`;
  const sales = contact.phones.find((p) => p.number === contact.primaryPhone);

  return (
    <Section id={id} tone="band" aria-labelledby={titleId} className="scroll-mt-[var(--header-h-compact)]">
      <div className="flex items-center gap-4">
        <Reveal className="label flex shrink-0 items-center gap-3 text-band-muted">
          {index && (
            <>
              <span className="tabular">{index}</span>
              <span aria-hidden="true">—</span>
            </>
          )}
          <span>{dict.design.contactEyebrow}</span>
        </Reveal>
        <span aria-hidden="true" className="rule-draw h-px flex-1 bg-band-fg/15" />
      </div>

      <div className="mt-10 grid md:mt-14 lg:grid-cols-12 lg:gap-x-gutter">
        <Reveal stagger className="lg:col-span-9 lg:row-start-1">
          <h2 id={titleId} className="font-display text-display-xl font-light text-balance text-band-fg">
            {splitWords(dict.lead.title)}
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 md:mt-10 lg:col-span-6 lg:row-start-2 lg:mt-20">
          <p className="max-w-md text-pretty text-base leading-relaxed text-band-muted md:text-[1.0625rem]">
            {dict.lead.subtitle}
          </p>
          <div className="mt-12 md:mt-14">
            {sales && <p className="label text-band-muted">{sales.label[locale]}</p>}
            <a
              href={telHref(contact.primaryPhone)}
              className="link-line mt-4 inline-block font-display text-display-md font-light tabular text-band-fg"
            >
              {contact.primaryPhone}
            </a>
          </div>
        </Reveal>

        <Reveal
          delay={0.12}
          className="mt-16 md:mt-20 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-2 lg:mt-20"
        >
          <LeadForm locale={locale} dict={dict} variant="lead" tone="light" projectName={projectName} />
        </Reveal>

        <Reveal delay={0.08} className="mt-16 md:mt-20 lg:col-span-6 lg:row-start-3 lg:mt-16 lg:self-end">
          <ContactInfo locale={locale} dict={dict} tone="band" compact withMap={false} />
        </Reveal>
      </div>
    </Section>
  );
}
