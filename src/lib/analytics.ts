/**
 * Analytics hook. A no-op until a provider is wired: push to GTM's dataLayer
 * when present, log in development. Swap the body for Plausible / GA4 / a CRM
 * webhook without touching call sites.
 */
export type AnalyticsEvent =
  | 'selector_view'
  | 'building_select'
  | 'floor_select'
  | 'apartment_open'
  | 'apartment_view_mode'
  | 'plan_download'
  | 'calculator_change'
  | 'installment_change'
  | 'recommend_submit'
  | 'lead_open'
  | 'lead_submit';

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event, ...props });
  if (process.env.NODE_ENV !== 'production') console.debug('[track]', event, props);
}
