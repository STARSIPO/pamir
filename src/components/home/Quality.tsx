import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Media } from '@/components/ui/Media';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { qualityFeatures } from '@/content/home';
import { typo } from '@/lib/text';

/**
 * Construction quality — the part of a building a facade does not show.
 * Used on the homepage (after 03 Advantages) and on the company page.
 *
 *   КАЧЕСТВО СТРОИТЕЛЬСТВА ─────────────────────────────────────────
 *
 *   Внимание к тому, что
 *   не видно на фасаде
 *
 *   ┌──────────────────┐            Инженерные решения и материалы …
 *   │                  │
 *   │   tall photo     │            ── ⌁ ───────────  ── ♨ ───────────
 *   │   (atmosphere)   │            Сейсмостойкие     Автономное
 *   │                  │            конструкции       отопление
 *   │                  │            … 8 items, 2 columns, hairlines
 *   └──────────────────┘
 *
 * The photograph is a stock construction site: atmosphere only, so it never
 * carries a project caption. On lg the lead text aligns to the photo's top
 * edge and the list to its bottom edge (the frame squares up on wide screens
 * so the space between them stays modest); below lg everything stacks and the
 * list opens to four columns on tablets.
 */
export function Quality({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section tone="alt" id="quality">
      <SectionHeading eyebrow={dict.quality.eyebrow} title={dict.quality.title} size="lg" />

      <div className="mt-12 grid gap-y-12 md:mt-16 lg:mt-24 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-gutter">
        <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <p className="max-w-[44ch] text-pretty text-lead text-muted">{typo(dict.quality.subtitle)}</p>
        </Reveal>

        {/* lg: the aspect ratio is the frame's minimum height; self-stretch
            lets it grow with the text column so both bottom edges always
            align. The text column stays ~620–660px tall at every desktop
            width while the frame keeps widening, so the ratio relaxes in
            steps (4:5 → 9:10 at 2xl → 1:1 from 1680px, where the container
            stops growing) to keep the gap between the lead and the list near
            the 1440px one instead of opening a dead band on wide screens. */}
        <Reveal
          variant="mask"
          className="relative aspect-[4/3] md:aspect-[16/10] lg:col-span-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-[4/5] lg:self-stretch lg:justify-self-stretch 2xl:aspect-[9/10] min-[1680px]:aspect-square"
        >
          {/* Stock photo, atmosphere only: the theme grading still applies on
              the <img>; the frame then takes it almost to monochrome and lifts
              it slightly (dims it on the dark theme, where pale concrete would
              glare), so the red/yellow formwork reads as a quiet texture and
              the site's own project photographs stay the loudest images on the
              page. The right-hand crop keeps most of the yellow formwork out of
              the tall lg frame.
              sizes: the 3:2 photo covers a ≥4:5 frame at lg, so it renders
              ~1.9× the frame width (≈ 85vw), not the frame's own 45vw; up to
              ~1200px the frame stretches taller with the text column and the
              photo needs up to ~1.08vw, so those widths keep 100vw. From
              1680px the frame is a fixed ~750px square (the container has
              stopped growing), so the photo is 1.5× that: a fixed width. */}
          <Media
            src="/photos/quality-site.jpg"
            alt={dict.quality.eyebrow}
            fill
            position="96% 50%"
            className="brightness-[1.03] contrast-[.92] saturate-[.2] [[data-theme=dark]_&]:brightness-[.86]"
            sizes="(max-width: 1200px) 100vw, (max-width: 1679px) 85vw, 1140px"
            seed={4}
          />
        </Reveal>

        <ul className="grid grid-cols-2 gap-x-gutter md:grid-cols-4 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:grid-cols-2 lg:self-end">
          {qualityFeatures.map((f, i) => (
            <Reveal
              as="li"
              key={f.icon}
              delay={(i % 4) * 0.06}
              className="flex flex-col gap-5 border-t border-line/15 pb-8 pt-5 md:pb-10 md:pt-6"
            >
              <FeatureIcon name={f.icon} strokeWidth={1.25} className="h-5 w-5 text-muted" />
              <span className="text-pretty text-base leading-snug text-ink md:text-[1.0625rem]">{typo(f.label[locale])}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
