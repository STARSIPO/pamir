import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { Hero } from '@/components/home/Hero';
import { AboutBrief } from '@/components/home/AboutBrief';
import { Stats } from '@/components/home/Stats';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { WhyUs } from '@/components/home/WhyUs';
import { Quality } from '@/components/home/Quality';
import { Steps } from '@/components/home/Steps';
import { LeadSection } from '@/components/home/LeadSection';
import { ContactMap } from '@/components/home/ContactMap';

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <AboutBrief locale={locale} dict={dict} />
      <FeaturedProjects locale={locale} dict={dict} />
      {/* WhyUs + Stats share one graphite ground and read as a single
          proof band, so no other section may sit between them. */}
      <WhyUs locale={locale} dict={dict} />
      <Stats locale={locale} dict={dict} />
      <Quality locale={locale} dict={dict} />
      <Steps locale={locale} dict={dict} />
      <LeadSection locale={locale} dict={dict} />
      <ContactMap locale={locale} dict={dict} />
    </>
  );
}
