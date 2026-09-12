// ESLint 9 flat config. Next 16 removed `next lint`, so linting runs through the
// eslint CLI directly and `eslint-config-next` is consumed as a flat-config array.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // `const { variant: _v, ...rest } = props` is how Button strips its own
      // props before spreading onto a DOM element — deliberate, not dead code.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default config;
