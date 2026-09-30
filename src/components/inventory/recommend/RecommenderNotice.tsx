'use client';

import { usePathname } from 'next/navigation';
import { DemoNotice } from '../DemoNotice';

/**
 * Selector steps (/…/select, /…/select/{building}[/{floor}]) and apartment
 * pages (/…/apartments/{id}) render inside SelectorShell, which already shows
 * the demo notice under the page title. Same segments in every locale.
 */
export function hasPageDemoNotice(pathname: string | null): boolean {
  return !!pathname && /\/(select|apartments)(\/|$)/.test(pathname);
}

/**
 * The recommender's own demo notice. `show` true / false forces it; left
 * undefined it appears only where the page does not carry one already, so a
 * selector page never shows the notice twice.
 */
export function RecommenderDemoNotice({
  badge,
  text,
  show,
  className,
}: {
  badge: string;
  text: string;
  show?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  if (show === false || (show === undefined && hasPageDemoNotice(pathname))) return null;
  return <DemoNotice badge={badge} text={text} className={className} />;
}
