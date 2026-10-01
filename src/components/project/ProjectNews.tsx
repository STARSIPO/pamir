import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

/** Stub — implemented in the build step (news-integration zone). Renders null when the project has no news. */
export function ProjectNews(_props: { locale: Locale; dict: Dictionary; projectSlug: string }) {
  return null;
}
