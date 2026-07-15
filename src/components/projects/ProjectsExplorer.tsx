'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Project, ProjectStatus } from '@/content/types';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';

type Filter = 'all' | ProjectStatus;

/**
 * Filterable project grid. Entrance/filter animation is pure CSS (a remounting
 * `key` replays `animate-fade-up`), so cards are always visible regardless of
 * JS animation timing.
 */
export function ProjectsExplorer({
  projects,
  locale,
  dict,
  showFilters = true,
}: {
  projects: Project[];
  locale: Locale;
  dict: Dictionary;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: dict.common.filters.all },
    { key: 'construction', label: dict.common.filters.construction },
    { key: 'completed', label: dict.common.filters.completed },
  ];

  const visible = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.status === filter)),
    [filter, projects],
  );

  return (
    <div>
      {showFilters && (
        <div className="mb-10 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300',
                filter === f.key
                  ? 'border-ink bg-ink text-white'
                  : 'border-line/20 text-muted hover:border-ink hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-muted">{dict.projectsPage.empty}</p>
      ) : (
        <div key={filter} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${(i % 3) * 0.07}s` }}>
              <ProjectCard project={p} locale={locale} dict={dict} index={i} priority={i < 3} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
