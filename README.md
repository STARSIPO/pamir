# Pamir Construct

Premium bilingual (RU / RO) website for **Pamir Construct**, a residential
developer in Chișinău. A full redesign of the legacy site: modern architectural
design, real project catalogue, floor-plan & gallery viewers, lead capture, and
SEO — built on Next.js.

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** with a brand design-token system
- **framer-motion** (interactions), CSS transitions (content reveals)
- **zod** (form validation) · `next/font` (Manrope)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in as needed
npm run dev                  # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.

## Brand

Palette extracted from the real logo & site — signature green `#7CC12B` +
graphite `#2A2C2F`. Tokens live in `src/app/globals.css` and `tailwind.config.ts`.
The logo is a self-contained SVG (`src/components/brand/Logo.tsx`).

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
