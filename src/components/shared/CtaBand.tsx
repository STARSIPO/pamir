import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { contact } from '@/content/site';
import { routes } from '@/i18n/routing';
import { telHref } from '@/lib/utils';
import { splitWords, typo } from '@/lib/text';

/**
 * Closing conversion block for inner pages, on the contrast band. It sits
 * directly above the footer (also band), so the two read as one dark plane
 * divided by a hairline.
 */
export function CtaBand({
  locale,
  dict,
  title,
  subtitle,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  subtitle?: string;
}) {
  return (
    <Section tone="band">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-gutter">
        <div className="lg:col-span-7">
          <Reveal className="label text-band-muted">{dict.design.contactEyebrow}</Reveal>
          <Reveal stagger className="mt-8">
            <h2 className="font-display text-display-lg font-light text-band-fg text-balance">{splitWords(title)}</h2>
          </Reveal>
          {subtitle && (
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-band-muted md:text-[1.0625rem]">
                {typo(subtitle)}
              </p>
            </Reveal>
          )}
        </div>
        {/* 5 columns below xl: at 1024 four columns (~300px) are narrower
            than the nowrap "Получить консультацию" button. */}
        <Reveal delay={0.14} className="flex flex-col gap-8 lg:col-span-5 lg:col-start-8 xl:col-span-4 xl:col-start-9">
          <a
            href={telHref(contact.primaryPhone)}
            className="link-line self-start font-display text-display-md font-light tabular text-band-fg"
          >
            {contact.primaryPhone}
          </a>
          <Button href={routes.contacts(locale)} variant="inverse" size="lg" arrow className="self-start">
            {dict.common.getConsultation}
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
