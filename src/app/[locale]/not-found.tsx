import { NotFoundView } from '@/components/shared/NotFoundView';

/** 404 inside the locale layout (after notFound() in a [locale] route): the
 *  site header and footer are already on the page. */
export default function NotFound() {
  return <NotFoundView />;
}
