import type { Metadata } from 'next';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';
import { services } from '@/content/services';
import { steps } from '@/content/home';
import { getProject } from '@/content/projects';
import type { Project, Service } from '@/content/types';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { CtaBand } from '@/components/shared/CtaBand';

const pad = (n: number) => String(n).padStart(2, '0');

/** Wide render for the full-bleed band under the hero (2000×924). */
const WIDE_SLUG = 'botanic-star-2-block-1';
/** Upright on-site photograph between the two groups of services. */
const UPRIGHT_SLUG = 'botanic-star';
/** Services 01–05 are building work; 06–08 accompany the buyer. */
const BUILD_COUNT = 5;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return buildMetadata({ locale, routeKey: 'services', title: dict.servicesPage.title, description: dict.servicesPage.subtitle });
}

/**
 * Services as a numbered schedule — one large row per service, divided by
 * hairlines, like the room schedule on a drawing sheet — set between two
 * photographs of the company's own buildings.
 *
 *   PageHero
 *   ┌ wide render, full bleed ───────────────────────────────────────────┐
 *   └────────────────────────────────────────────────────────────────────┘
 *   НА ИЗОБРАЖЕНИИ: BOTANIC STAR 2 — БЛОК 1
 *
 *   01   Строительство жилых           ─────────────────────────
 *        комплексов                    — Монолитно-каркасное…
 *        Полный цикл возведения…       ─────────────────────────
 *                                      — …
 *   ───────────────────────────────────────────────────────────
 *   …05
 *
 *        ЭТАПЫ РАБОТЫ                  ┌ upright photograph ┐
 *        Путь от выбора до ключей      │                    │
 *        Покупка квартиры проходит…    │                    │
 *                                      │                    │
 *        ───────────────────────       │                    │
 *        01  Выбор комплекса           │                    │
 *        ───────────────────────       │                    │
 *        …06 Получение ключей          │                    │
 *        ───────────────────────       └────────────────────┘
 *                                      НА ИЗОБРАЖЕНИИ: BOTANIC STAR
 *   (the steps column is lg+ only; below lg the photo stands alone)
 *
 *   06 … 08
 *   CtaBand
 */
export default async function ServicesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const wide = getProject(WIDE_SLUG);
  const upright = getProject(UPRIGHT_SLUG);

  return (
    <>
      <PageHero eyebrow={dict.servicesPage.eyebrow} title={dict.servicesPage.title} subtitle={dict.servicesPage.subtitle} />

      {/* ── Full-bleed render: the frame opens from its lower edge ────── */}
      {wide && (
        <Section spacing="none" bleed className="pb-section-sm">
          <figure>
            <Reveal
              variant="mask"
              className="relative aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]"
            >
              {/* The 2.16:1 render is cropped into taller frames below lg, so
                  `sizes` asks for the width the crop really needs. */}
              <Media
                src={wide.hero ?? wide.cover}
                alt={wide.name[locale]}
                fill
                position="60% 20%"
                sizes="(max-width: 639px) 270vw, (max-width: 767px) 162vw, (max-width: 1023px) 122vw, 100vw"
                caption={wide.coverKind === 'render' ? dict.design.render : undefined}
              />
            </Reveal>
            <Container>
              <OnImage project={wide} locale={locale} dict={dict} className="mt-5" />
            </Container>
          </figure>
        </Section>
      )}

      <Section spacing="none" className="pb-section">
        <ServiceRows items={services.slice(0, BUILD_COUNT)} offset={0} locale={locale} />

        {/* ── An upright photograph between the two groups ──────────────── */}
        {upright && (
          <div className="grid gap-y-12 py-section-sm lg:grid-cols-12 lg:gap-x-gutter">
            <figure className="lg:col-span-6 lg:col-start-7 lg:row-start-1">
              <Reveal variant="mask" className="relative aspect-[4/5]">
                <Media
                  src={upright.cover}
                  alt={upright.name[locale]}
                  fill
                  position="50% 42%"
                  sizes="(max-width: 1023px) 100vw, (max-width: 1680px) 50vw, 820px"
                  caption={upright.coverKind === 'render' ? dict.design.render : undefined}
                />
              </Reveal>
              <OnImage project={upright} locale={locale} dict={dict} className="mt-5" />
            </figure>

            {/* Beside the photograph (lg+): the buyer's path, the same six
                steps as on the homepage but set quieter — label indices, text
                titles — so the service titles keep the lead. The group opens
                on the photo's top line and the list closes on its bottom
                line: the bottom padding is the caption under the photo
                (mt-5 + one label line, 0.72rem × 1.2 + the link's pb-1).
                Step descriptions only from xl: at 1024–1279 the frame is too
                short for them. */}
            <section
              aria-labelledby="services-path"
              className="hidden lg:col-span-5 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:justify-between lg:gap-12 lg:pb-[calc(1.25rem_+_0.864rem_+_0.25rem)]"
            >
              <div>
                <Reveal className="label text-muted">{dict.steps.eyebrow}</Reveal>
                <Reveal stagger className="mt-6">
                  <h2 id="services-path" className="font-display text-display-sm font-light text-balance text-ink">
                    {splitWords(dict.steps.title)}
                  </h2>
                </Reveal>
                <Reveal delay={0.08}>
                  <p className="mt-5 max-w-[40ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                    {typo(dict.design.fill.stepsNote)}
                  </p>
                </Reveal>
              </div>

              <ol className="border-b border-line/15">
                {steps.map((s, i) => (
                  <Reveal
                    as="li"
                    key={s.n}
                    delay={(i % 3) * 0.06}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-line/15 py-4"
                  >
                    <span className="label tabular text-muted">{s.n}</span>
                    <div>
                      <h3 className="text-base text-ink">{typo(s.title[locale])}</h3>
                      <p className="mt-1 hidden text-pretty text-base leading-relaxed text-muted xl:block">
                        {typo(s.text[locale])}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          </div>
        )}

        <ServiceRows items={services.slice(BUILD_COUNT)} offset={BUILD_COUNT} locale={locale} />
      </Section>

      <CtaBand locale={locale} dict={dict} title={dict.servicesPage.ctaTitle} subtitle={dict.lead.subtitle} />
    </>
  );
}

/**
 * One group of schedule rows: the title with its summary on the left, the
 * points on the right. Through lg the two sides split 5/6; from xl the points
 * narrow to four columns and one empty column separates them from the title.
 */
function ServiceRows({ items, offset, locale }: { items: Service[]; offset: number; locale: Locale }) {
  return (
    <ol start={offset + 1} className="border-b border-line/15">
      {items.map((s, i) => (
        <li key={s.slug} className="border-t border-line/15">
          <div className="grid gap-y-6 py-12 md:grid-cols-12 md:gap-x-gutter md:py-16 lg:py-20">
            <Reveal className="md:col-span-1">
              <span className="label tabular block text-muted md:pt-3">{pad(offset + i + 1)}</span>
            </Reveal>

            {/* Below xl the title and the text share a single gutter, so the
                title keeps some air on its right. */}
            <Reveal delay={0.04} className="md:col-span-5 md:col-start-2 md:pr-4 lg:pr-10 xl:col-span-6 xl:pr-0">
              <h2 className="font-display text-display-md font-light text-balance text-ink">{typo(s.title[locale])}</h2>
              <p className="mt-5 max-w-[42ch] text-pretty text-lead text-muted">{typo(s.summary[locale])}</p>
            </Reveal>

            {/* md:mt-2 puts the first hairline on the title's cap line. */}
            <Reveal delay={0.12} className="md:col-span-6 md:col-start-7 xl:col-span-4 xl:col-start-9">
              {s.points.length > 0 && (
                <ul className="border-t border-line/15 md:mt-2">
                  {s.points.map((pt, j) => (
                    <li
                      key={j}
                      className="flex gap-4 border-b border-line/15 py-3.5 text-base leading-snug text-ink last:border-b-0 last:pb-0"
                    >
                      <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" />
                      {typo(pt[locale])}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * "На изображении: <project>" under a photograph — label over link on phones,
 * one line from sm. The link's 44px hit area is an ::after, so the line keeps
 * its label height.
 */
function OnImage({
  project,
  locale,
  dict,
  className,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <figcaption
      className={cn('label flex flex-col items-start gap-2 text-muted sm:flex-row sm:items-baseline sm:gap-3', className)}
    >
      <span>{dict.design.onImage}:</span>
      <Link
        href={routes.project(locale, project.slug)}
        className="link-rule relative pb-1 text-ink after:absolute after:-inset-y-4 after:inset-x-0 after:content-['']"
      >
        {project.name[locale]}
      </Link>
    </figcaption>
  );
}
