import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { services } from '@/content/services';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { CtaBand } from '@/components/shared/CtaBand';

const pad = (n: number) => String(n).padStart(2, '0');

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'services', title: dict.servicesPage.title, description: dict.servicesPage.subtitle });
}

/**
 * Services as a numbered schedule — one large row per service, divided by
 * hairlines, like the room schedule on a drawing sheet.
 *
 *   01   Строительство жилых           Полный цикл возведения…
 *        комплексов                    ─────────────────────────
 *                                      Монолитно-каркасное…
 *   ───────────────────────────────────────────────────────────
 *   02        Генеральный подряд       Управление проектом…
 *
 * On wide screens the title column steps in on every other row, so the list
 * reads with a slow rhythm instead of as a table.
 */
export default async function ServicesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero eyebrow={dict.servicesPage.eyebrow} title={dict.servicesPage.title} subtitle={dict.servicesPage.subtitle} />

      <Section spacing="none" className="pb-section">
        <ol className="border-b border-line/15">
          {services.map((s, i) => {
            const stepped = i % 2 === 1;
            return (
              <li key={s.slug} className="border-t border-line/15">
                <div className="grid gap-y-6 py-12 md:grid-cols-12 md:gap-x-gutter md:py-16 lg:py-20">
                  <Reveal className="md:col-span-1">
                    <span className="label tabular block text-muted md:pt-3">{pad(i + 1)}</span>
                  </Reveal>

                  <Reveal
                    delay={0.04}
                    className={cn(
                      'md:col-span-5 md:col-start-2',
                      stepped ? 'lg:col-span-5 lg:col-start-4' : 'lg:col-span-6 lg:col-start-2',
                    )}
                  >
                    <h2 className="font-display text-display-md font-light text-balance text-ink">{s.title[locale]}</h2>
                  </Reveal>

                  <Reveal delay={0.12} className="md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-9">
                    <p className="text-pretty text-base leading-relaxed text-muted md:pt-2 md:text-[1.0625rem]">
                      {s.summary[locale]}
                    </p>
                    {s.points.length > 0 && (
                      <ul className="mt-8 border-t border-line/15 md:mt-10">
                        {s.points.map((pt, j) => (
                          <li
                            key={j}
                            className="flex gap-4 border-b border-line/15 py-3.5 text-[0.95rem] leading-snug text-ink last:border-b-0 last:pb-0"
                          >
                            <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" />
                            {pt[locale]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Reveal>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.servicesPage.ctaTitle} subtitle={dict.lead.subtitle} />
    </>
  );
}
