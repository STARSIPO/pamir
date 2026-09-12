import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Navigation } from 'lucide-react';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { projects, getProject } from '@/content/projects';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
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

export default async function ProjectPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const project = getProject(params.slug);
  if (!project) notFound();

  const others = projects.filter((p) => p.slug !== project.slug).slice(0, 3);
  const mapEmbed = project.mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(project.mapQuery)}&z=15&output=embed`
    : null;
  const mapDir = project.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.mapQuery)}`
    : null;

  return (
    <>
      <ProjectHero project={project} locale={locale} dict={dict} />

      {/* About + specs */}
      <Section tone="default">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <span className="eyebrow">{dict.projectDetail.aboutTitle}</span>
            </Reveal>
            <div className="mt-6 space-y-5">
              {project.description.map((p, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <p className="max-w-prose text-lg leading-relaxed text-muted text-pretty">{p[locale]}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-line/12 bg-sand p-7">
              <h2 className="font-display text-lg font-semibold text-ink">{dict.projectDetail.specsTitle}</h2>
              <dl className="mt-5 divide-y divide-line/10">
                {project.specs.map((s) => (
                  <div key={s.key} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-muted">{s.label[locale]}</dt>
                    <dd className="text-right font-medium text-ink">{s.value[locale]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Advantages */}
      {project.advantages.length > 0 && (
        <Section tone="sand">
          <Reveal>
            <span className="eyebrow">{dict.projectDetail.advantagesTitle}</span>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {project.advantages.map((a, i) => (
              <Reveal key={a.icon + i} delay={(i % 4) * 0.06}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-line/10 bg-white p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/12 text-brand-700">
                    <FeatureIcon name={a.icon} />
                  </span>
                  <span className="text-[0.95rem] font-medium leading-snug text-ink">{a.label[locale]}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Gallery */}
      <Section tone="default" id="gallery">
        <Reveal>
          <span className="eyebrow">{dict.projectDetail.galleryTitle}</span>
        </Reveal>
        <div className="mt-8">
          <Gallery images={project.gallery} name={project.name[locale]} locale={locale} />
        </div>
      </Section>

      {/* Floorplans */}
      {project.floorplans.length > 0 && (
        <Section tone="sand" id="floorplans">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow">{dict.projectDetail.floorplansTitle}</span>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 text-lg text-muted">{dict.projectDetail.floorplansSubtitle}</p>
            </Reveal>
          </div>
          <div className="mt-10">
            <Floorplans floorplans={project.floorplans} name={project.name[locale]} locale={locale} dict={dict} />
          </div>
        </Section>
      )}

      {/* Location */}
      {mapEmbed && (
        <Section tone="default" id="location">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <span className="eyebrow">{dict.projectDetail.locationTitle}</span>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 font-display text-display-md font-semibold text-ink">
                  {project.district[locale]}
                  {project.address && <span className="text-muted">, {project.address[locale]}</span>}
                </h2>
              </Reveal>
              {project.nearby.length > 0 && (
                <>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-label text-brand-700">
                    {dict.projectDetail.nearbyTitle}
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-3">
                    {project.nearby.map((n, i) => (
                      <Reveal key={n.icon + i} delay={(i % 4) * 0.05}>
                        <li className="flex items-center gap-3 rounded-xl border border-line/10 bg-sand px-4 py-3">
                          <FeatureIcon name={n.icon} className="h-5 w-5 text-brand-700" />
                          <span className="text-sm text-ink">
                            {n.label[locale]}
                            {n.distance && <span className="text-muted"> · {n.distance[locale]}</span>}
                          </span>
                        </li>
                      </Reveal>
                    ))}
                  </ul>
                </>
              )}
              {mapDir && (
                <a
                  href={mapDir}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink link-underline"
                >
                  <Navigation className="h-4 w-4 text-brand" />
                  {dict.contactBlock.routeCta}
                </a>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-line/10" style={{ aspectRatio: '4 / 3' }}>
              <iframe
                title={project.name[locale]}
                src={mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
              />
            </div>
          </div>
        </Section>
      )}

      {/* Lead / final CTA */}
      <LeadSection locale={locale} dict={dict} projectName={project.name[locale]} id="lead" />

      {/* Other projects */}
      <Section tone="sand">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-display-md font-semibold text-ink">{dict.projectDetail.otherProjects}</h2>
          <Link href={routes.projects(locale)} className="hidden items-center gap-1.5 text-sm font-semibold text-ink link-underline sm:inline-flex">
            {dict.common.viewAllProjects}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((p, i) => (
            <ProjectCard key={p.slug} project={p} locale={locale} dict={dict} index={i} />
          ))}
        </div>
      </Section>
    </>
  );
}
