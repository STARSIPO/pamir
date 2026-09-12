import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return {
    ...buildMetadata({ locale, routeKey: 'thankyou', title: dict.thankYou.title }),
    robots: { index: false, follow: false },
  };
}

export default async function ThankYouPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <section className="flex min-h-[70vh] items-center bg-sand">
      <Container className="py-24 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-graphite-900">
            <Check className="h-8 w-8" />
          </span>
          <h1 className="mt-8 font-display text-display-lg font-semibold text-ink text-balance">
            {dict.thankYou.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{dict.thankYou.subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href={routes.home(locale)} variant="primary" size="lg">
              {dict.thankYou.backHome}
            </Button>
            <Button href={routes.projects(locale)} variant="outline" size="lg" arrow>
              {dict.thankYou.viewProjects}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
