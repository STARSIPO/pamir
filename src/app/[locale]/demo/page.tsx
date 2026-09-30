import type { Metadata } from 'next';
import Link from 'next/link';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { routes } from '@/i18n/routing';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Arrow } from '@/components/ui/Button';
import { typo } from '@/lib/text';

/**
 * /demo — one link to the whole site: every section and the new features in
 * a sensible viewing order, for showing the site to the client or a buyer.
 * Not in the navigation, not in the sitemap, noindex (and disallowed in
 * robots.txt). The showcased project/floor/apartment are fixed demo picks.
 */
const PROJECT = 'botanic-star-2-blocks-3-4';
const BUILDING = 'b3';
const FLOOR = 7;
const APARTMENT = 'b3-47';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return {
    title: dict.demoHub.metaTitle,
    description: dict.demoHub.subtitle,
    robots: { index: false, follow: true },
  };
}

type ItemKey = keyof ReturnType<typeof getDictionary>['demoHub']['items'];

export default async function DemoHubPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const h = dict.demoHub;
  const other: Locale = locale === 'ru' ? 'ro' : 'ru';

  const groups: { title: string; items: { key: ItemKey; href: string }[] }[] = [
    {
      title: h.sections.site,
      items: [
        { key: 'home', href: routes.home(locale) },
        { key: 'catalog', href: routes.projects(locale) },
        { key: 'project', href: routes.project(locale, PROJECT) },
        { key: 'company', href: routes.company(locale) },
      ],
    },
    {
      title: h.sections.selector,
      items: [
        { key: 'selector', href: routes.selector(locale, PROJECT) },
        { key: 'building', href: routes.building(locale, PROJECT, BUILDING) },
        { key: 'floor', href: routes.floor(locale, PROJECT, BUILDING, FLOOR) },
        { key: 'apartment', href: routes.apartment(locale, PROJECT, APARTMENT) },
      ],
    },
    {
      title: h.sections.tools,
      items: [
        { key: 'calculator', href: `${routes.project(locale, PROJECT)}#calculator` },
        { key: 'recommend', href: `${routes.selector(locale, PROJECT)}#recommend` },
      ],
    },
    {
      title: h.sections.variants,
      items: [
        { key: 'themeWarm', href: `${routes.home(locale)}?theme=warm` },
        { key: 'themeStone', href: `${routes.home(locale)}?theme=stone` },
        { key: 'themeDark', href: `${routes.home(locale)}?theme=reset` },
        { key: 'otherLocale', href: `/${other}/demo` },
      ],
    },
  ];

  let n = 0;
  return (
    <>
      <PageHero eyebrow={h.eyebrow} title={h.title} subtitle={h.subtitle} />
      <Section spacing="none" className="pb-section">
        <div className="flex flex-col gap-section-sm">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="flex items-center gap-4">
                <h2 className="label shrink-0 text-muted">{g.title}</h2>
                <span aria-hidden="true" className="h-px flex-1 bg-line/15" />
              </div>
              <ul role="list" className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
                {g.items.map((it) => {
                  n += 1;
                  const item = h.items[it.key];
                  return (
                    <li key={it.key}>
                      <Reveal className="h-full">
                        <Link
                          href={it.href}
                          className="group flex h-full min-h-[8.5rem] flex-col justify-between gap-6 border border-line/15 p-6 transition-colors duration-500 ease-premium hover:border-accent/60 focus-visible:border-accent md:p-8"
                        >
                          <span className="flex items-start justify-between gap-6">
                            <span className="font-display text-display-sm font-light text-ink">{item.title}</span>
                            <span aria-hidden="true" className="label tabular pt-1 text-muted">
                              {String(n).padStart(2, '0')}
                            </span>
                          </span>
                          <span className="flex items-end justify-between gap-6">
                            <span className="max-w-[46ch] text-pretty text-sm leading-relaxed text-muted md:text-base">
                              {typo(item.text)}
                            </span>
                            <Arrow className="mb-1.5 text-ink" />
                          </span>
                        </Link>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
