/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Real project photos will live under /public. Remote domains can be added here
    // if assets are served from a CDN or the current pamirconstruct.md host.
    remotePatterns: [
      { protocol: 'https', hostname: 'pamirconstruct.md' },
    ],
  },
  async redirects() {
    // 301s preserving SEO from the old site structure. Locale-less roots go to RU.
    const legacyProjectSlugs = [
      ['zhiloy-kompleks-botanic-star-2-blok-3-4', 'botanic-star-2-blocks-3-4'],
      ['complexul-imobiliar-botanic-star-2-bloc-2', 'botanic-star-2-block-2'],
      ['complexul-imobiliar-botanic-star-2-bloc-1', 'botanic-star-2-block-1'],
      ['zhiloy-kompleks-botanic-star', 'botanic-star'],
      ['zhiloy-kompleks-botanic-park', 'botanic-park'],
      ['eco-house', 'eco-house'],
    ];

    const projectRedirects = legacyProjectSlugs.flatMap(([oldSlug, newSlug]) => [
      { source: `/ru/project/${oldSlug}`, destination: `/ru/projects/${newSlug}`, permanent: true },
      { source: `/ro/project/${oldSlug}`, destination: `/ro/proiecte/${newSlug}`, permanent: true },
    ]);

    return [
      { source: '/', destination: '/ru', permanent: false },
      // Legacy singular/renamed sections
      { source: '/ru/contact', destination: '/ru/contacts', permanent: true },
      { source: '/ro/contact', destination: '/ro/contacte', permanent: true },
      { source: '/ru/news', destination: '/ru', permanent: true },
      { source: '/ro/news', destination: '/ro', permanent: true },
      { source: '/ro/projects', destination: '/ro/proiecte', permanent: true },
      { source: '/ro/services', destination: '/ro/servicii', permanent: true },
      { source: '/ro/company', destination: '/ro/despre-companie', permanent: true },
      { source: '/ro/faq', destination: '/ro/intrebari-frecvente', permanent: true },
      ...projectRedirects,
    ];
  },
};

export default nextConfig;
