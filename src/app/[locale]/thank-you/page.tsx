import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { routes } from '@/i18n/routing';
import { telHref } from '@/lib/utils';
import { splitWords } from '@/lib/text';
import { contact } from '@/content/site';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
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

/**
 * Thank-you page after a lead form. Typography only: a status label on a
 * hairline, a very large light title, one line of reassurance, two actions.
 */
export default async function ThankYouPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  const sales = contact.phones[0];

  return (
    <section className="flex min-h-[78svh] flex-col bg-canvas text-ink">
      <Container className="flex flex-1 flex-col justify-center py-section-sm">
        <div className="flex items-center gap-4">
          <Reveal className="label flex shrink-0 items-center gap-3 text-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
            {dict.form.successTitle}
          </Reveal>
          <span aria-hidden="true" className="rule-draw h-px flex-1 bg-line/15" />
        </div>

        <div className="mt-12 grid gap-y-10 md:mt-16 lg:grid-cols-12 lg:items-end lg:gap-x-gutter">
          <Reveal stagger className="lg:col-span-8">
            <h1 className="font-display text-display-xl font-light text-balance">{splitWords(dict.thankYou.title)}</h1>
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-4 lg:pb-3">
            <p className="max-w-md text-pretty text-base leading-relaxed text-muted md:text-[1.0625rem]">
              {dict.thankYou.subtitle}
            </p>
          </Reveal>
        </div>

        <Reveal
          delay={0.2}
          className="mt-14 flex flex-col gap-10 border-t border-line/15 pt-10 md:mt-20 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
            <Button href={routes.home(locale)} variant="primary" size="lg" arrow>
              {dict.thankYou.backHome}
            </Button>
            <Button href={routes.projects(locale)} variant="ghost" arrow>
              {dict.thankYou.viewProjects}
            </Button>
          </div>
          <p className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <span className="label text-muted">{sales.label[locale]}</span>
            <a href={telHref(sales.number)} className="link-line self-start text-lead tabular text-ink">
              {sales.number}
            </a>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
