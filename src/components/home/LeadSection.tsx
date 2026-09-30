import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Arrow } from '@/components/ui/Button';
import { LeadForm } from '@/components/forms/LeadForm';
import { contact } from '@/content/site';
import { leadFaq } from '@/content/faq';
import { telHref } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';

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
 *   ЧАСТЫЕ ВОПРОСЫ →                          КОММЕНТАРИЙ
 *   ──────────────────────                    ─────────────────────────
 *   Как узнать стоимость?                     □ consent
 *   answer, muted                             [ ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ → ]
 *   ──────────────────────
 *   Как записаться на просмотр?
 *   answer, muted
 *   ──────────────────────
 *
 * The heading spans the grid; below it the lead-in and the sales number face
 * the form. From lg two buyer questions follow the number (`leadFaq`: the
 * current price and booking a viewing, both answered by the form beside
 * them), under a link to the FAQ page — the same pattern on the homepage and
 * on every project page. The rest of the contact list (other numbers, office,
 * hours, email) is left to the footer, which follows on the same band on
 * every page — listing it twice in a row only diluted the call to action. On
 * phones the order is heading → lead-in → number → form (no questions). The
 * section ends on its padding with no closing rule: the footer opens with
 * its own hairline.
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

        {/* Pinned beside the (taller) form on wide screens, so the lead-in
            and the number stay opposite whichever fields are in view. */}
        <Reveal
          delay={0.1}
          className="mt-8 md:mt-10 lg:sticky lg:top-28 lg:col-span-6 lg:row-start-2 lg:mt-20 lg:self-start"
        >
          <p className="max-w-md text-pretty text-base leading-relaxed text-band-muted md:text-[1.0625rem]">
            {typo(dict.lead.subtitle)}
          </p>
          <div className="mt-12 md:mt-14">
            {sales && <p className="label text-band-muted">{sales.label[locale]}</p>}
            <a
              href={telHref(contact.primaryPhone)}
              className="group mt-3 inline-flex min-h-11 items-center font-display text-display-md font-light tabular text-band-fg"
            >
              <span className="link-line">{contact.primaryPhone}</span>
            </a>
          </div>

          {/* Two buyer questions under the number (from lg), so the pinned
              column carries on beside the form. Both answers lead back to it. */}
          <div className="mt-14 hidden max-w-md lg:block">
            <Link
              href={routes.faq(locale)}
              className="group label inline-flex min-h-11 items-center gap-2 text-band-muted transition-colors duration-500 hover:text-band-fg"
            >
              <span className="link-line">{dict.faqPage.title}</span>
              <Arrow className="w-4" />
            </Link>
            <dl className="mt-4 border-b border-band-fg/15">
              {leadFaq.map((f, i) => (
                <div key={i} className="border-t border-band-fg/15 py-5">
                  <dt className="text-base text-band-fg">{typo(f.q[locale])}</dt>
                  <dd className="mt-2 text-pretty text-sm leading-relaxed text-band-muted">{typo(f.a[locale])}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="mt-16 md:mt-20 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:mt-20">
          <LeadForm locale={locale} dict={dict} variant="lead" tone="light" projectName={projectName} />
        </Reveal>
      </div>
    </Section>
  );
}
