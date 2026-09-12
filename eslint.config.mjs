// ESLint 9 flat config. Next 16 removed `next lint`, so linting runs through the
// eslint CLI directly and `eslint-config-next` is consumed as a flat-config array.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];
