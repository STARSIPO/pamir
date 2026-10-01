import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { listNews } from '@/lib/news/repository';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { NewsCard } from '@/components/news/NewsCard';

/** Project page — «Новости проекта». Renders nothing when the project has no news. */
export function ProjectNews({ locale, dict, projectSlug }: { locale: Locale; dict: Dictionary; projectSlug: string }) {
  const items = listNews({ project: projectSlug, limit: 3 });
  if (items.length === 0) return null;
  const n = dict.news;

  return (
    <Section id="news" spacing="sm" className="pb-section">
      <SectionHeading
        eyebrow={n.home.eyebrow}
        title={n.home.projectTitle}
        size="lg"
        action={
          <Button href={routes.news(locale)} variant="ghost" arrow className="min-h-11 self-start lg:self-auto">
            {n.common.allNews}
          </Button>
        }
      />
      <ul role="list" className="mt-14 grid grid-cols-1 gap-x-gutter gap-y-14 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <li key={a.slug}>
            <NewsCard article={a} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
