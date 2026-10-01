import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { latestNews } from '@/lib/news/repository';
import { routes } from '@/i18n/routing';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { NewsCard } from '@/components/news/NewsCard';

/** Home — the three newest stories and «Все новости →». Hidden when there are none. */
export function LatestNews({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const items = latestNews(3);
  if (items.length === 0) return null;
  const n = dict.news;

  return (
    <Section tone="canvas" spacing="sm" className="pb-section">
      <SectionHeading
        eyebrow={n.home.eyebrow}
        title={n.home.title}
        action={
          <Button href={routes.news(locale)} variant="ghost" arrow className="min-h-11 self-start lg:self-auto">
            {n.common.allNews}
          </Button>
        }
      />
      <ul role="list" className="mt-14 grid grid-cols-1 gap-x-gutter gap-y-14 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a, i) => (
          <li key={a.slug} className={i === 2 ? 'md:hidden lg:block' : undefined}>
            <NewsCard article={a} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
