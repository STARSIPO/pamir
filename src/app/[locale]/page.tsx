import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { Hero } from '@/components/home/Hero';
import { AboutBrief } from '@/components/home/AboutBrief';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { Spotlight } from '@/components/home/Spotlight';
import { Advantages } from '@/components/home/Advantages';
import { Quality } from '@/components/home/Quality';
import { MoreProjects } from '@/components/home/MoreProjects';
import { CompanyBrief } from '@/components/home/CompanyBrief';
import { Steps } from '@/components/home/Steps';
import { LeadSection } from '@/components/home/LeadSection';
import { LatestNews } from '@/components/home/LatestNews';

/**
 * Homepage — architecture first.
 *
 *   Hero            full-screen photograph, slogan, one action
 *   01 AboutBrief   one large statement
 *   02 Featured     two projects in alternating large rows
 *      Spotlight    one project, full-bleed
 *   03 Advantages   numbers + four reasons, then construction quality
 *   04 More         the remaining projects in an asymmetric grid
 *   05 Company      photograph + quote + text, then the path to the keys
 *   06 Lead         contact CTA on the dark band, flowing into the footer
 */
export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = (isLocale(params.locale) ? params.locale : 'ru') as Locale;
  const dict = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <AboutBrief locale={locale} dict={dict} />
      <FeaturedProjects locale={locale} dict={dict} />
      <Spotlight locale={locale} dict={dict} />
      <Advantages locale={locale} dict={dict} />
      <Quality locale={locale} dict={dict} />
      <MoreProjects locale={locale} dict={dict} />
      <CompanyBrief locale={locale} dict={dict} />
      <Steps locale={locale} dict={dict} />
      <LatestNews locale={locale} dict={dict} />
      <LeadSection locale={locale} dict={dict} />
    </>
  );
}
