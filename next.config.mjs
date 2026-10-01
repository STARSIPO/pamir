/** @type {import('next').NextConfig} */

// Static-export mode (GitHub Pages). Defaults OFF → full Node app (Vercel/dev)
// keeps middleware, /api routes, localized RO slugs and image optimization.
const isExport = process.env.EXPORT === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const base = {
  reactStrictMode: true,
  poweredByHeader: false,
};

const nextConfig = isExport
  ? {
      ...base,
      output: 'export',
      trailingSlash: true,
      basePath: basePath || undefined,
      images: { unoptimized: true },
      // redirects()/middleware are not applied in static export.
    }
  : {
      ...base,
      images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [{ protocol: 'https', hostname: 'pamirconstruct.md' }],
      },
      async redirects() {
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
          { source: '/ru/contact', destination: '/ru/contacts', permanent: true },
          { source: '/ro/contact', destination: '/ro/contacte', permanent: true },
          { source: '/ro/projects', destination: '/ro/proiecte', permanent: true },
          { source: '/ro/services', destination: '/ro/servicii', permanent: true },
          { source: '/ro/company', destination: '/ro/despre-companie', permanent: true },
          { source: '/ro/faq', destination: '/ro/intrebari-frecvente', permanent: true },
          ...projectRedirects,
        ];
      },
    };

export default nextConfig;
