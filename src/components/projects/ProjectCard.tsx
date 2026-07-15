import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project } from '@/content/types';
import { routes } from '@/i18n/routing';
import { Media } from '@/components/ui/Media';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function ProjectCard({
  project,
  locale,
  dict,
  priority = false,
  index = 0,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  index?: number;
}) {
  const statusLabel =
    project.status === 'construction' ? dict.common.status.construction : dict.common.status.completed;

  return (
    <Link
      href={routes.project(locale, project.slug)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line/10 bg-white shadow-card transition-all duration-500 ease-premium hover:-translate-y-1 hover:shadow-float"
    >
      <div className="relative overflow-hidden">
        <Media
          src={project.cover}
          alt={project.name[locale]}
          aspect="4 / 3"
          seed={index}
          priority={priority}
          label={project.name[locale]}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          imgClassName="transition-transform duration-700 ease-premium group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={project.status} label={statusLabel} className="bg-white/90" />
        </div>
        <span className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-brand text-graphite-900 opacity-0 transition-all duration-500 ease-premium group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-700">
          <MapPin className="h-3.5 w-3.5" />
          {project.district[locale]}
          {project.address && <span className="text-muted/70">· {project.address[locale]}</span>}
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold text-ink transition-colors group-hover:text-brand-700">
          {project.name[locale]}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {project.excerpt[locale]}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          {dict.common.viewProject}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
