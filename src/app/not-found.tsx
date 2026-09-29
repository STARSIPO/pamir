import { NotFoundView } from '@/components/shared/NotFoundView';

/**
 * Global 404 — what an unknown URL (e.g. /ru/anything) actually renders.
 * It sits in the root layout only, so there is no site header or footer:
 * `standalone` makes the view bring its own logo bar, <main> and closing row.
 * Theme tokens and fonts come from the root layout, so it matches the site.
 */
export default function GlobalNotFound() {
  return <NotFoundView standalone />;
}
