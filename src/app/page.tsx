'use client';

import { useEffect } from 'react';

/**
 * Root redirect to the default locale. In the Node build this is preempted by
 * the `/` → `/ru` redirect in next.config; in static export (no redirects/
 * middleware) this client redirect handles `/pamir/` → `/pamir/ru`.
 */
export default function RootIndex() {
  useEffect(() => {
    const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.location.replace(`${bp}/ru`);
  }, []);

  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>
      <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/ru`}>Pamir Construct →</a>
    </div>
  );
}
