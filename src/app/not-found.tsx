import { NotFoundView } from '@/components/shared/NotFoundView';

/** Global fallback 404 (rarely hit — middleware redirects locale-less paths).
 *  Rendered inside the root layout, so it inherits fonts & globals. */
export default function GlobalNotFound() {
  return <NotFoundView />;
}
