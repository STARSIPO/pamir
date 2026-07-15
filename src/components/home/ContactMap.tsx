import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactInfo } from '@/components/shared/ContactInfo';

export function ContactMap({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="default" id="contacts">
      <SectionHeading eyebrow={dict.contactBlock.eyebrow} title={dict.contactBlock.title} />
      <div className="mt-12">
        <ContactInfo locale={locale} dict={dict} />
      </div>
    </Section>
  );
}
