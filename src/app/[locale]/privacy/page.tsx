import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildMetadata } from '@/lib/seo';
import { privacySections, privacyUpdated } from '@/content/legal';
import { PageHero } from '@/components/shared/PageHero';
import { Section } from '@/components/ui/Section';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);
  return {
    ...buildMetadata({ locale, routeKey: 'privacy', title: dict.privacyPage.title }),
    robots: { index: false, follow: true },
  };
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero eyebrow={dict.privacyPage.eyebrow} title={dict.privacyPage.title} />
      <Section tone="default">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-muted">
            {dict.privacyPage.updated}: {privacyUpdated}
          </p>
          <div className="mt-8 space-y-10">
            {privacySections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-semibold text-ink">{s.heading[locale]}</h2>
                <div className="mt-3 space-y-3">
                  {s.body.map((p, j) => (
                    <p key={j} className="max-w-prose leading-relaxed text-muted">{p[locale]}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
