# Pamir Construct

Premium bilingual (RU / RO) website for **Pamir Construct**, a residential
developer in Chișinău. A full redesign of the legacy site: modern architectural
design, real project catalogue, floor-plan & gallery viewers, lead capture, and
SEO — built on Next.js.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS** on a themed design-token system (CSS variables)
- CSS transitions + IntersectionObserver reveals, **Lenis** smooth scrolling
- **zod** (form validation) · `next/font` (Inter Tight display, Inter text)

## Themes

Three complete colour themes. Switch the whole site by changing **one line** in
`src/config/theme.ts`:

```ts
export const SITE_THEME: ThemeName = 'dark'; // 'warm' | 'dark' | 'stone'
```

| Theme | Name | Palette |
|---|---|---|
| `warm` | Variant 1 — Warm Architectural | #F2EFE9 · #E5E0D7 · #171717 · #6A6863 · accent #9A8264 |
| `dark` | Variant 2 — Premium Dark (live) | #111210 · #1B1C19 · #F4F1EA · #AAA79F · accent #B39A73 / #70614D |
| `stone` | Variant 3 — Modern Stone | #E9E9E5 · #D5D6D0 · #161816 · #696D68 · accent #59665B |

Preview any theme without rebuilding: add `?theme=dark` (or `warm`, `stone`) to a
URL; it sticks for the browser session, `?theme=reset` clears it.
Design rules live in **`docs/DESIGN-SYSTEM.md`**.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in as needed
npm run dev                  # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.

## Brand

Architectural minimalism: large light Inter Tight headlines, hairlines, square
geometry, a lot of whitespace, the developer's own renders and photos. Tokens
live in `src/app/globals.css` (per theme) and `tailwind.config.ts` (semantic
names: `canvas`, `ink`, `muted`, `accent`, `band`…). The logo is a single-colour
SVG (`src/components/brand/Logo.tsx`) that follows `currentColor`.

## Internationalisation

- Locales: `ru` (default), `ro`. Add a language by extending `src/i18n/config.ts`
  and adding a dictionary in `src/i18n/dictionaries/`.
- **All UI text lives outside components** — `src/i18n/dictionaries/*` (chrome)
  and `src/content/*` (domain content), each with `{ ru, ro }` fields.
- Localised URLs: RU uses `/ru/projects`, RO uses `/ro/proiecte` etc.
  `src/middleware.ts` rewrites RO slugs; `src/i18n/routing.ts` builds links.
- Switching language keeps you on the same page (`LanguageSwitcher`).
- `hreflang` alternates, per-locale metadata, canonical, sitemap & robots included.

## Content (CMS-ready)

Content is a typed local layer under `src/content/` that **mirrors a headless-CMS
schema**, so the owner can edit projects, services, FAQ, contacts, etc. without
touching components — and it can later be swapped for Sanity/Payload by changing
one data module. See `src/content/types.ts`.

Pages: Home · Projects (filterable) · Project detail (specs, gallery, floorplans,
map) · Company · Services · FAQ · Contacts · Privacy · Thank-you · 404.

## Forms

`LeadForm` posts to `/api/lead` — zod validation, Moldovan phone mask, honeypot,
rate-limiting, pluggable Telegram/email notifications (env-configured,
server-side only). See `PLACEHOLDERS.md`.

## Assets & data still needed

Real photos, floor plans, and a few facts are pending — all clearly flagged.
See **`PLACEHOLDERS.md`**.

## Deployment

Standard Next.js (Node). Set `NEXT_PUBLIC_SITE_URL`. Legacy URLs are
301-redirected in `next.config.mjs`.
