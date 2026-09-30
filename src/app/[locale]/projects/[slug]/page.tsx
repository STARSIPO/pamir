import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { projects, getProject } from '@/content/projects';
import { getStats } from '@/content/home';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { ProjectHero } from '@/components/project/ProjectHero';
import { Gallery } from '@/components/project/Gallery';
import { Floorplans } from '@/components/project/Floorplans';
import { Media } from '@/components/ui/Media';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { LeadSection } from '@/components/home/LeadSection';
import { cn } from '@/lib/utils';
import { typo } from '@/lib/text';

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
 * Framing of the About picture, per project. With no second picture, About
 * shows a detail of the hero render — zoomed toward `origin` so it reads as a
 * second view, not a repeat of the hero a screen above. `origin` places the
 * zoomed window the way object-position places a crop (0% = left/top edge).
 * `aspect` is the source's width / height, so `sizes` can follow the width
 * the picture is painted at (see AboutPicture).
 *
 * Block 2 has one render: About frames its crown — the curved dark volume,
 * the bay-window column and the yellow fin — cut off above the lower floors,
 * so there is no ground, no park and no whole-tower silhouette to echo the
 * hero. 1.6× keeps the 1400px source near native size in the lg frame.
 *
 * With three or more spare pictures, About takes one of them — `src`, or the
 * last one — and the gallery keeps the rest. Botanic Star shows the courtyard
 * head-on (the playground, the benches, the spruce in the middle): it sits
 * beside the "landscaped courtyard" row of the facts, and its centred
 * composition already holds a 4:5 crop.
 */
type Frame = { src?: string; aspect?: number; position?: string; zoom?: number; origin?: string };
const ABOUT_FRAME: Record<string, Frame> = {
  'botanic-star-2-blocks-3-4': { aspect: 1.21, position: '80% 55%', zoom: 1.25, origin: '65% 75%' },
  'botanic-star-2-block-2': { aspect: 1.375, position: '50% 50%', zoom: 1.6, origin: '36% 14%' },
  'eco-house': { aspect: 0.861, position: '40% 50%' },
  'botanic-star-2-block-1': { aspect: 1.78, position: '49% 50%' },
  'botanic-star': { src: '/photos/projects/botanic-star/gallery-3.jpg', aspect: 1.5, position: '50% 50%' },
};

/**
 * Advantage columns follow the count, so no row ends on an orphan: 3 → 3,
 * 4 → 2×2 then 4, 5 → 2 + 3 then 5, 6 → 3, 8 → 2 then 4. Full class strings,
 * so Tailwind sees every one. Below md the list is single-column rows.
 */
const ADVANTAGE_GRID: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  5: 'md:grid-cols-6 lg:grid-cols-5',
  6: 'md:grid-cols-3',
  8: 'md:grid-cols-2 lg:grid-cols-4',
};
const advantageCell = (n: number, i: number) =>
  n === 5 ? (i < 2 ? 'md:col-span-3 lg:col-span-1' : 'md:col-span-2 lg:col-span-1') : undefined;

/**
 * Project page. One idea per section, a lot of air between them, and the
 * same opener everywhere: an index and a name on a hairline, then the content.
 *
 *   Hero (full-bleed photograph, huge name; a split at xl for small renders)
 *   01 About      statement + specs as a hairline table; a tall picture beside
 *                 them unless exactly two pictures make the gallery
 *   02 Advantages hairline grid, thin icons (≤2 items: rows under the specs)
 *   03 Gallery    editorial image grid + lightbox        (2+ pictures)
 *   04 Plans      drawings in 1px frames                 (only with plans)
 *   05 Location   district, nearby list, route, map
 *   06 More       two projects, asymmetric; a portfolio note (counts) in
 *                 the room the offset card leaves (md+)
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

  // Every distinct picture of the project except the one the hero already
  // shows full-bleed (the cover counts: Eco House's second render lives there).
  // Two or more make a gallery. Fewer, and About carries the picture itself —
  // the spare one, or a detail of the hero — so no page runs from the hero to
  // the map without a photograph. Three or more, and About still takes one
  // (the frame's pick, else the last) while the rest stay a gallery: a
  // statement alone beside the facts left a dead band under it.
  const heroSrc = project.hero ?? project.cover;
  const pictures = Array.from(
    new Set([project.cover, ...project.gallery].filter((src): src is string => !!src)),
  ).filter((src) => src !== heroSrc);
  const aboutFrame = ABOUT_FRAME[project.slug] ?? {};
  const aboutSrc =
    pictures.length < 2
      ? (pictures[0] ?? heroSrc)
      : pictures.length >= 3
        ? (pictures.find((src) => src === aboutFrame.src) ?? pictures[pictures.length - 1])
        : undefined;
  const gallery = pictures.length >= 2 ? pictures.filter((src) => src !== aboutSrc) : [];

  // One or two advantages do not carry a section and a display heading of
  // their own: they join the specs as rows.
  const advantagesInline = project.advantages.length > 0 && project.advantages.length <= 2;
  const advantagesSection = project.advantages.length > 2;
  const advantageCount = project.advantages.length;

  // The next two projects in catalogue order (wrapping), so every page links
  // onward to different neighbours.
  const at = projects.findIndex((p) => p.slug === project.slug);
  const others = [1, 2]
    .map((k) => projects[(at + k) % projects.length])
    .filter((p, i, list) => p.slug !== project.slug && list.indexOf(p) === i);
  // Counts derived from the project list; the demo placeholders stay out.
  const portfolioStats = getStats().filter((s) => !s.placeholder);

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
    advantagesSection && 'advantages',
    gallery.length > 0 && 'gallery',
    project.floorplans.length > 0 && 'floorplans',
    hasLocation && 'location',
    others.length > 0 && 'more',
  ].filter(Boolean) as string[];
  const num = (key: string) => pad(order.indexOf(key) + 1);

  const [statement, ...rest] = project.description;

  // Specs, plus the advantages when there are too few for their own section.
  const facts =
    project.specs.length > 0 || advantagesInline ? (
      <>
        {project.specs.length > 0 && (
          <>
            <h3 className="label text-muted">{d.specsTitle}</h3>
            <dl className="mt-6 border-b border-line/15">
              {project.specs.map((s) => (
                <div key={s.key} className="flex items-baseline justify-between gap-6 border-t border-line/15 py-4 md:py-5">
                  <dt className="text-sm text-muted">{s.label[locale]}</dt>
                  <dd className="text-right text-base text-ink md:text-[1.0625rem]">{s.value[locale]}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        {advantagesInline && (
          <div className={cn(project.specs.length > 0 && 'mt-12 md:mt-14')}>
            <h3 className="label text-muted">{d.advantagesTitle}</h3>
            <ul className="mt-6 border-b border-line/15">
              {project.advantages.map((a, i) => (
                <li key={a.icon + i} className="flex min-h-16 items-center gap-5 border-t border-line/15 py-4">
                  <FeatureIcon name={a.icon} strokeWidth={1.25} className="h-5 w-5 shrink-0 text-muted" />
                  <span className="flex-1 text-base text-ink md:text-[1.0625rem]">{a.label[locale]}</span>
                  {a.note && <span className="text-sm text-muted">{a.note[locale]}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    ) : null;

  return (
    <>
      <ProjectHero project={project} locale={locale} dict={dict} />

      {/* 01 — About: the first paragraph as a statement, specs beside it —
          or, with a picture in the right-hand columns, under it. */}
      <Section id="about">
        <LabelRow index={num('about')}>{d.aboutTitle}</LabelRow>
        <div className="mt-12 grid gap-16 md:mt-20 lg:grid-cols-12 lg:gap-gutter">
          <div className={aboutSrc ? 'lg:col-span-6' : 'lg:col-span-7'}>
            {statement && (
              <Reveal>
                <p className="font-display text-display-md font-light text-pretty text-ink">{typo(statement[locale])}</p>
              </Reveal>
            )}
            {rest.length > 0 && (
              <div className={cn('mt-10 space-y-6 md:mt-14 md:pl-[14.3%]', aboutSrc && 'lg:hidden')}>
                {rest.map((p, i) => (
                  <Reveal key={i} delay={0.08 * (i + 1)}>
                    <p className="max-w-[58ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                      {typo(p[locale])}
                    </p>
                  </Reveal>
                ))}
              </div>
            )}
            {aboutSrc && facts && (
              <Reveal delay={0.12} className="mt-14 md:mt-20 md:pl-[14.3%]">
                {facts}
              </Reveal>
            )}
          </div>

          {aboutSrc ? (
            <div className="md:ml-auto md:w-2/3 lg:col-span-5 lg:col-start-8 lg:ml-0 lg:w-auto">
              <AboutPicture src={aboutSrc} alt={name} caption={renderCaption} frame={aboutFrame} />
              {/* At lg the second paragraph moves under the picture, so the
                  left column (statement, specs) and the right one (picture,
                  paragraph) end together. Below lg it stays in the reading
                  order above; display:none keeps the idle copy out of the
                  accessibility tree, so it is read once. */}
              {rest.length > 0 && (
                <div className="mt-12 hidden space-y-6 lg:block">
                  {rest.map((p, i) => (
                    <Reveal key={i} delay={0.08 * (i + 1)}>
                      <p className="max-w-[44ch] text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                        {typo(p[locale])}
                      </p>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          ) : (
            facts && (
              <Reveal delay={0.12} className="lg:col-span-4 lg:col-start-9">
                {facts}
              </Reveal>
            )
          )}
        </div>
      </Section>

      {/* 02 — Advantages: a hairline grid, thin icons, nothing boxed. Phones
          get single-column rows, icon then label, like the nearby list. */}
      {advantagesSection && (
        <Section id="advantages" spacing="sm" className="pb-section">
          <SectionHeading
            index={num('advantages')}
            eyebrow={dict.design.amenitiesEyebrow}
            title={d.advantagesTitle}
            size="lg"
          />
          <ul
            className={cn(
              'mt-10 grid grid-cols-1 border-b border-line/15 md:mt-20 md:gap-x-gutter md:gap-y-12 md:border-b-0',
              ADVANTAGE_GRID[advantageCount] ?? 'md:grid-cols-3 lg:grid-cols-4',
            )}
          >
            {project.advantages.map((a, i) => (
              <Reveal
                as="li"
                key={a.icon + i}
                delay={(i % 4) * 0.08}
                className={cn(
                  'flex items-center gap-5 border-t border-line/15 py-5 md:min-h-[9rem] md:flex-col md:items-stretch md:justify-between md:gap-10 md:pb-0 md:pt-5 lg:min-h-[13rem]',
                  advantageCell(advantageCount, i),
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-4">
                  <span className="label tabular text-muted max-md:hidden">{pad(i + 1)}</span>
                  <FeatureIcon name={a.icon} strokeWidth={1.25} className="h-5 w-5 text-muted md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-display-sm font-light text-balance text-ink">{a.label[locale]}</p>
                  {a.note && <p className="mt-2 text-sm text-muted">{a.note[locale]}</p>}
                </div>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* 03 — Gallery, only with two or more pictures beyond the hero and
          the one About shows. */}
      {gallery.length > 0 && (
        <Section id="gallery" spacing="sm" className="pb-section">
          <SectionHeading
            index={num('gallery')}
            eyebrow={renderCaption ?? dict.design.photo}
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
          <SectionHeading
            index={num('floorplans')}
            eyebrow={dict.design.apartmentsEyebrow}
            title={d.floorplansTitle}
            subtitle={d.floorplansSubtitle}
            size="lg"
          />
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
                  className="map-treat absolute inset-0 h-full w-full"
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
            eyebrow={dict.design.portfolioEyebrow}
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
              className="col-span-4 md:col-span-12 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:self-start"
            />
            {others[1] && (
              <ProjectCard
                project={others[1]}
                locale={locale}
                dict={dict}
                index={1}
                aspect="4 / 5"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 42vw"
                className="col-span-4 md:col-span-8 md:col-start-5 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-[clamp(8rem,16vw,16rem)] lg:self-start"
              />
            )}
            {/* The room the offset right card leaves under the left one (at
                md, beside it): a line on the portfolio and the two counts
                derived from the catalogue — never the placeholder stats.
                At lg the note has a row of its own under the left card while
                the right card spans both rows: where the offset leaves room
                the note ends level with the right card's last line, and where
                it does not (a two-line name, widths near 1024) the row gap
                still keeps it clear of the card's link. self-start keeps both
                cards' link boxes from stretching over the empty rows. */}
            {others.length === 2 && (
              <Reveal
                delay={0.1}
                className="hidden md:col-span-4 md:col-start-1 md:row-start-2 md:block md:self-end lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:max-w-[26rem]"
              >
                <p className="text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
                  {typo(dict.featured.subtitle)}
                </p>
                <dl className="mt-6 border-b border-line/15">
                  {portfolioStats.map((s) => (
                    <div
                      key={s.label.ru}
                      className="flex items-baseline justify-between gap-6 border-t border-line/15 py-3.5"
                    >
                      <dt className="text-sm text-muted">{s.label[locale]}</dt>
                      <dd className="font-display text-display-sm font-light tabular text-ink">{pad(s.value)}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
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

/**
 * About's picture: a tall 4:5 frame that opens with the mask reveal. A zoomed
 * detail scales the photograph inside the frame, so the render caption sits
 * outside that layer (Media's own would be scaled and cropped with it). The
 * caption and its corner scrim repeat Media's markup exactly: it is the
 * render disclosure and has to hold on a white façade or pale pavement.
 *
 * `sizes` follows the painted width, not the frame's: a landscape source in
 * a 4:5 frame is height-bound (1.25 × aspect frame widths wide), then scaled
 * by the zoom — Block 2 at 1.6× paints ~2.75 frame widths. Frame widths:
 * the container on phones, two thirds of it on tablets, five columns at lg.
 */
function AboutPicture({
  src,
  alt,
  caption,
  frame,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  frame: Frame;
  className?: string;
}) {
  const paint = Math.max(1, 1.25 * (frame.aspect ?? 1.5)) * (frame.zoom ?? 1);
  const vw = (frameVw: number) => `${Math.ceil(frameVw * paint)}vw`;
  return (
    <Reveal variant="mask" className={className}>
      <div className="relative overflow-hidden bg-canvas-alt" style={{ aspectRatio: '4 / 5' }}>
        <div
          className="absolute inset-0"
          style={frame.zoom ? { transform: `scale(${frame.zoom})`, transformOrigin: frame.origin } : undefined}
        >
          <Media
            src={src}
            alt={alt}
            fill
            sizes={`(max-width: 768px) ${vw(100)}, (max-width: 1024px) ${vw(66)}, ${vw(40)}`}
            position={frame.position}
          />
        </div>
        {caption && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 z-[1] h-24 w-full bg-gradient-to-t from-scrim/55 via-scrim/20 to-transparent md:h-28 md:w-2/3 md:bg-[radial-gradient(120%_100%_at_0%_100%,rgb(var(--scrim)/0.55),rgb(var(--scrim)/0.18)_45%,transparent_75%)]"
            />
            <span className="label pointer-events-none absolute bottom-4 left-4 z-[2] text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.5)]">
              {caption}
            </span>
          </>
        )}
      </div>
    </Reveal>
  );
}
