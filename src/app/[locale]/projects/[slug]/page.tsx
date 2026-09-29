import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { projects, getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { ProjectHero } from '@/components/project/ProjectHero';
import { Gallery } from '@/components/project/Gallery';
import { Floorplans } from '@/components/project/Floorplans';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { LeadSection } from '@/components/home/LeadSection';

export function generateStaticParams() {
  return locales.flatMap((locale) => projects.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const project = getProject(params.slug);
  if (!project) return {};
  return buildMetadata({
    locale,
    routeKey: 'projects',
    slug: project.slug,
    title: project.name[locale],
    description: project.excerpt[locale],
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Project page. One idea per section, a lot of air between them, and the
 * same opener everywhere: an index on a hairline, then the content.
 *
 *   Hero (full-bleed photograph, huge name)
 *   01 About      statement + specs as a hairline table
 *   02 Advantages hairline grid, thin icons
 *   03 Gallery    editorial image grid + lightbox        (only with photos)
 *   04 Plans      drawings in 1px frames                 (only with plans)
 *   05 Location   district, nearby list, route, map
 *   06 More       two projects, asymmetric
 *   Lead          contrast band, runs into the footer
 */
export default async function ProjectPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const project = getProject(params.slug);
  if (!project) notFound();

  const d = dict.projectDetail;
  const name = project.name[locale];
  const renderCaption = project.coverKind === 'render' ? dict.design.render : undefined;

  // The hero already shows its picture full-bleed; repeating it as the first
  // gallery frame reads as filler.
  const heroSrc = project.hero ?? project.cover;
  const gallery = project.gallery.filter((src) => src !== heroSrc);

  // The next two projects in catalogue order (wrapping), so every page links
  // onward to different neighbours.
  const at = projects.findIndex((p) => p.slug === project.slug);
  const others = [1, 2]
    .map((k) => projects[(at + k) % projects.length])
    .filter((p, i, list) => p.slug !== project.slug && list.indexOf(p) === i);

  const mapEmbed = project.mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(project.mapQuery)}&z=15&output=embed`
    : null;
  const mapDir = project.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.mapQuery)}`
    : null;
  const hasLocation = !!(mapEmbed || project.address || project.nearby.length > 0);

  // Section numbers follow what is actually on the page.
  const order = [
    'about',
    project.advantages.length > 0 && 'advantages',
    gallery.length > 0 && 'gallery',
    project.floorplans.length > 0 && 'floorplans',
    hasLocation && 'location',
    others.length > 0 && 'more',
  ].filter(Boolean) as string[];
  const num = (key: string) => pad(order.indexOf(key) + 1);

  const [statement, ...rest] = project.description;

  return (
    <>
      <ProjectHero project={project} locale={locale} dict={dict} />

      {/* 01 — About: the first paragraph as a statement, specs beside it. */}
      <Section id="about">
        <LabelRow index={num('about')}>{d.aboutTitle}</LabelRow>
        <div className="mt-12 grid gap-16 md:mt-20 lg:grid-cols-12 lg:gap-gutter">
          <div className="lg:col-span-7">
            {statement && (
              <Reveal>
                <p className="font-display text-display-md font-light text-pretty text-ink">{statement[locale]}</p>
              </Reveal>
            )}
            {rest.length > 0 && (
              <div className="mt-10 space-y-6 md:mt-14 md:pl-[14.3%]">
                {rest.map((p, i) => (
                  <Reveal key={i} delay={0.08 * (i + 1)}>
                    <p className="max-w-[58ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                      {p[locale]}
                    </p>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {project.specs.length > 0 && (
            <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
              <h3 className="label text-muted">{d.specsTitle}</h3>
              <dl className="mt-6 border-b border-line/15">
                {project.specs.map((s) => (
                  <div key={s.key} className="flex items-baseline justify-between gap-6 border-t border-line/15 py-4 md:py-5">
                    <dt className="text-sm text-muted">{s.label[locale]}</dt>
                    <dd className="text-right text-base text-ink md:text-[1.0625rem]">{s.value[locale]}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </Section>

      {/* 02 — Advantages: a hairline grid, thin icons, nothing boxed. */}
      {project.advantages.length > 0 && (
        <Section id="advantages" spacing="sm" className="pb-section">
          <SectionHeading index={num('advantages')} title={d.advantagesTitle} size="lg" />
          <ul className="mt-14 grid grid-cols-2 gap-x-gutter gap-y-12 md:mt-20 md:grid-cols-3 lg:grid-cols-4">
            {project.advantages.map((a, i) => (
              <Reveal
                as="li"
                key={a.icon + i}
                delay={(i % 4) * 0.08}
                className="flex min-h-[10.5rem] flex-col justify-between gap-10 border-t border-line/15 pt-5 md:min-h-[13rem]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="label tabular text-muted">{pad(i + 1)}</span>
                  <FeatureIcon name={a.icon} strokeWidth={1.25} className="h-6 w-6 text-muted" />
                </div>
                <div>
                  <p className="font-display text-display-sm font-light text-balance text-ink">{a.label[locale]}</p>
                  {a.note && <p className="mt-2 text-sm text-muted">{a.note[locale]}</p>}
                </div>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* 03 — Gallery, only when there are photographs beyond the hero. */}
      {gallery.length > 0 && (
        <Section id="gallery" spacing="sm" className="pb-section">
          <SectionHeading
            index={num('gallery')}
            title={d.galleryTitle}
            size="lg"
            action={
              <span className="label tabular text-muted">
                {pad(gallery.length)} {dict.design.photos}
              </span>
            }
          />
          <div className="mt-14 md:mt-20">
            <Gallery
              images={gallery}
              name={name}
              caption={renderCaption}
              labels={{ close: dict.common.close, title: d.galleryTitle }}
            />
          </div>
        </Section>
      )}

      {/* 04 — Floorplans, as drawings on paper plates. */}
      {project.floorplans.length > 0 && (
        <Section id="floorplans" tone="alt">
          <SectionHeading index={num('floorplans')} title={d.floorplansTitle} subtitle={d.floorplansSubtitle} size="lg" />
          <div className="mt-14 md:mt-20">
            <Floorplans floorplans={project.floorplans} name={name} locale={locale} dict={dict} />
          </div>
        </Section>
      )}

      {/* 05 — Location. Only confirmed facts: no invented distances. */}
      {hasLocation && (
        <Section id="location">
          <LabelRow index={num('location')}>{d.locationTitle}</LabelRow>
          <div className="mt-12 grid gap-14 md:mt-20 lg:grid-cols-12 lg:gap-gutter">
            <div className="flex flex-col lg:col-span-5">
              <Reveal>
                <p className="font-display text-display-lg font-light text-balance text-ink">{project.district[locale]}</p>
                {project.address && <p className="mt-4 text-lead text-muted">{project.address[locale]}</p>}
              </Reveal>

              {project.nearby.length > 0 && (
                <div className="mt-14 md:mt-20">
                  <Reveal as="h3" className="label text-muted">
                    {d.nearbyTitle}
                  </Reveal>
                  <ul className="mt-6 border-b border-line/15">
                    {project.nearby.map((n, i) => (
                      <Reveal
                        as="li"
                        key={n.icon + i}
                        delay={i * 0.06}
                        className="flex min-h-16 items-center gap-5 border-t border-line/15 py-4"
                      >
                        <FeatureIcon name={n.icon} strokeWidth={1.25} className="h-5 w-5 shrink-0 text-muted" />
                        <span className="flex-1 text-base text-ink md:text-[1.0625rem]">{n.label[locale]}</span>
                        {n.distance && <span className="label tabular text-muted">{n.distance[locale]}</span>}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              )}

              {mapDir && (
                <Reveal delay={0.1} className="mt-10">
                  <Button href={mapDir} variant="ghost" arrow className="min-h-11">
                    {dict.contactBlock.routeCta}
                  </Button>
                </Reveal>
              )}
            </div>

            {mapEmbed && (
              <Reveal
                delay={0.1}
                className="relative aspect-square overflow-hidden border border-line/15 bg-canvas-alt md:aspect-[16/10] lg:col-span-6 lg:col-start-7 lg:aspect-auto lg:min-h-[34rem]"
              >
                <iframe
                  title={`${d.locationTitle} — ${name}`}
                  src={mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full grayscale contrast-[1.05] [[data-theme=dark]_&]:invert [[data-theme=dark]_&]:contrast-[0.9]"
                />
              </Reveal>
            )}
          </div>
        </Section>
      )}

      {/* 06 — More projects: two, never a row of small cards. */}
      {others.length > 0 && (
        <Section id="more" spacing="sm" className="pb-section">
          <SectionHeading
            index={num('more')}
            title={d.otherProjects}
            size="lg"
            action={
              <Button href={routes.projects(locale)} variant="ghost" arrow className="min-h-11 self-start lg:self-auto">
                {dict.common.viewAllProjects}
              </Button>
            }
          />
          <div className="grid-12 mt-14 gap-y-20 md:mt-20">
            <ProjectCard
              project={others[0]}
              locale={locale}
              dict={dict}
              index={0}
              aspect="4 / 3"
              size="lg"
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="col-span-4 md:col-span-12 lg:col-span-7"
            />
            {others[1] && (
              <ProjectCard
                project={others[1]}
                locale={locale}
                dict={dict}
                index={1}
                aspect="4 / 5"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 42vw"
                className="col-span-4 md:col-span-8 md:col-start-5 lg:col-span-5 lg:col-start-8 lg:mt-[clamp(8rem,16vw,16rem)]"
              />
            )}
          </div>
        </Section>
      )}

      {/* Lead — last, on the band, so it runs straight into the footer. */}
      <LeadSection locale={locale} dict={dict} projectName={name} id="lead" />
    </>
  );
}

/**
 * Section opener when the content itself carries the display type:
 *   01 — О ПРОЕКТЕ ──────────────────────────────
 * The label is the section's h2; the index is decoration.
 */
function LabelRow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Reveal as="h2" className="label flex shrink-0 items-center gap-3 text-muted">
        <span aria-hidden="true" className="tabular">
          {index}
        </span>
        <span aria-hidden="true">—</span>
        <span>{children}</span>
      </Reveal>
      <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
    </div>
  );
}
