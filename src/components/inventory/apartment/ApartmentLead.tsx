import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { LeadForm } from '@/components/forms/LeadForm';
import { contact } from '@/content/site';
import { splitWords, typo } from '@/lib/text';
import { telHref } from '@/lib/utils';
import { pad2 } from './text';

export interface LeadStep {
  title: string;
  text: string;
}

/**
 * The lead at the foot of an available or reserved apartment — where
 * «Оставить заявку» lands. The site-wide LeadSection is a matchmaking call
 * («Подберём квартиру под ваши требования»); here the buyer has already
 * chosen, so the heading names the apartment, the lead-in says what the
 * manager does, the button names this request («Отправить заявку»; reserved:
 * «Узнать о снятии брони», the words of the button that led here), and on a
 * phone the form follows right under them, the apartment shown as its
 * context line. Same band, same form, same sales number.
 *
 *   СВЯЗАТЬСЯ ──────────────────────────────────────────────────────
 *   Заявка на квартиру №43                  ЗАЯВКА ПО КВАРТИРЕ
 *   what the manager does, muted            Квартира №43, Блок 3, этаж 7
 *                                           ИМЯ           ТЕЛЕФОН
 *   ОТДЕЛ ПРОДАЖ                            …
 *   +373 76 007 007                         КОММЕНТАРИЙ
 *                                           …
 *   ЧТО ДАЛЬШЕ                              □ consent
 *   ─────────────────────────────           [ ОТПРАВИТЬ ЗАЯВКУ → ]
 *   01  Связь с менеджером
 *       how, muted
 *   ─────────────────────────────
 *   02  …
 *
 * From lg the steps (`next`) carry the left column on beside the taller
 * form, as the two buyer questions do in LeadSection. Phones and tablets:
 * heading → lead-in → form → number (no steps: after the form they would
 * only push the number down).
 */
export function ApartmentLead({
  locale,
  dict,
  id = 'lead',
  title,
  lead,
  submitLabel,
  next,
  projectName,
  apartment,
}: {
  locale: Locale;
  dict: Dictionary;
  id?: string;
  /** «Заявка на квартиру №43». */
  title: string;
  lead: string;
  /** The form's button: «Отправить заявку» / reserved «Узнать о снятии брони». */
  submitLabel: string;
  /** What follows the request, shown beside the form from lg. */
  next?: { title: string; steps: LeadStep[] };
  projectName: string;
  /** Context line sent with the request: «Квартира №43, Блок 3, этаж 7». */
  apartment: string;
}) {
  const titleId = `${id}-title`;
  const nextId = `${id}-next`;
  const sales = contact.phones.find((p) => p.number === contact.primaryPhone);

  return (
    // No scroll margin of its own: the page's scroll-padding already lands
    // an anchor jump below the fixed header.
    <Section id={id} tone="band" aria-labelledby={titleId}>
      <div className="flex items-center gap-4">
        <Reveal className="label shrink-0 text-band-muted">{dict.design.contactEyebrow}</Reveal>
        <span aria-hidden="true" className="rule-draw h-px flex-1 bg-band-fg/15" />
      </div>

      {/* lg: the form spans both rows; its extra height goes to the second
          (1fr), so the number follows the lead-in instead of drifting down. */}
      <div className="mt-10 grid gap-y-12 md:mt-14 md:gap-y-16 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-gutter lg:gap-y-0">
        <div className="lg:col-span-6 lg:row-start-1">
          <Reveal stagger>
            <h2 id={titleId} className="font-display text-display-lg font-light text-balance text-band-fg">
              {splitWords(title)}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-band-muted md:mt-8 md:text-[1.0625rem]">
              {typo(lead)}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <LeadForm
            locale={locale}
            dict={dict}
            variant="lead"
            tone="light"
            projectName={projectName}
            apartment={apartment}
            submitLabel={submitLabel}
          />
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-6 lg:row-start-2 lg:mt-16 lg:self-start">
          {sales && <p className="label text-band-muted">{sales.label[locale]}</p>}
          <a
            href={telHref(contact.primaryPhone)}
            className="group mt-3 inline-flex min-h-11 items-center font-display text-display-md font-light tabular text-band-fg"
          >
            <span className="link-line">{contact.primaryPhone}</span>
          </a>

          {next && next.steps.length > 0 && (
            <section aria-labelledby={nextId} className="mt-16 hidden max-w-md lg:block">
              <h3 id={nextId} className="label text-band-muted">
                {next.title}
              </h3>
              <ol className="mt-5 border-b border-band-fg/15">
                {next.steps.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[2.5rem_1fr] border-t border-band-fg/15 py-5">
                    <span aria-hidden="true" className="label tabular pt-[0.3em] text-band-muted">
                      {pad2(i + 1)}
                    </span>
                    <div>
                      <p className="text-base text-band-fg">{typo(s.title)}</p>
                      <p className="mt-2 text-pretty text-sm leading-relaxed text-band-muted">{typo(s.text)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
