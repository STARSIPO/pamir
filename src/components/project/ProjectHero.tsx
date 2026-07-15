import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function ProjectHero({
  project,
  locale,
  dict,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
}) {
  const statusLabel =
    project.status === 'construction'
      ? dict.common.status.construction
      : dict.common.status.completed;
  const hasFloorplans = project.floorplans.length > 0;

  return (
    <section className="relative flex min-h-[82vh] items-end overflow-hidden bg-graphite-900 text-white">
      {/* Background: real cover or branded backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        {project.cover ? (
          <Image src={project.cover} alt={project.name[locale]} fill priority className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-graphite-900 via-graphite-900/90 to-[#101113]" />
            <div className="absolute -right-24 top-1/4 h-[32rem] w-[32rem] rounded-full bg-brand/10 blur-[120px]" />
            <svg
              viewBox="0 0 1440 420"
              preserveAspectRatio="xMidYMax slice"
              className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-[0.10]"
            >
              <g fill="#ffffff">
                <rect x="60" y="160" width="100" height="260" />
                <rect x="180" y="80" width="120" height="340" />
                <rect x="330" y="210" width="90" height="210" />
                <rect x="440" y="130" width="130" height="290" />
                <rect x="600" y="60" width="100" height="360" />
                <rect x="730" y="190" width="110" height="230" />
                <rect x="870" y="110" width="140" height="310" />
                <rect x="1040" y="40" width="90" height="380" />
                <rect x="1160" y="170" width="120" height="250" />
                <rect x="1300" y="120" width="110" height="300" />
              </g>
            </svg>
            <span className="absolute bottom-3 right-3 rounded bg-black/30 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-white/40">
              demo
            </span>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/80 via-graphite-900/20 to-transparent" />
      </div>

      <Container className="relative z-10 pb-16 pt-32">
        <div className="max-w-3xl">
          <Reveal>
            <StatusBadge status={project.status} label={statusLabel} className="bg-white/10 text-white" />
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 font-display text-display-xl font-extrabold text-balance">
              {project.name[locale]}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-lg text-white/75 sm:text-xl">{project.tagline[locale]}</p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">
              <MapPin className="h-4 w-4 text-brand" />
              {project.district[locale]}
              {project.address && <span>· {project.address[locale]}</span>}
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#lead"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-7 text-[0.95rem] font-semibold text-graphite-900 transition-colors hover:bg-brand-600"
              >
                {dict.projectDetail.availableApartments}
              </a>
              {hasFloorplans && (
                <a
                  href="#floorplans"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 px-7 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white hover:text-graphite-900"
                >
                  {dict.projectDetail.viewFloorplans}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
