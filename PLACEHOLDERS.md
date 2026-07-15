# Placeholders & data to confirm

This site is fully built and functional, but some **real assets and facts are not
yet available**. Everything below is clearly flagged in code and easy to replace.
Nothing here is invented data shown as fact — unconfirmed values render as
“Уточняется / Se precizează”, and all images are branded `DEMO` placeholders.

## 1. Images (all currently branded placeholders)

The `<Media>` component (`src/components/ui/Media.tsx`) shows a branded
architectural placeholder tagged **DEMO** whenever no `src` is set. To replace:

1. Drop real files into `public/` (e.g. `public/projects/botanic-star-2-blocks-3-4/cover.jpg`).
2. Set the path in the content file:
   - Project cover / gallery / floorplan images → `src/content/projects.ts`
     (`cover`, `gallery: [...]`, `floorplans[].image`).
   - Home / about / company section images → passed via `Media src=…` in the
     respective components (`src/components/home/*`, `company/page.tsx`).
3. `next/image` then serves optimized AVIF/WebP automatically.

**Logo:** rebuilt faithfully as SVG (`src/components/brand/Logo.tsx`,
`public/favicon.svg`) from the original green “Pamir peak + skyline” mark.
Replace with the official vector if the brand archive provides one.

## 2. Facts to confirm with the owner

| Where | Field | Note |
|---|---|---|
| `src/content/site.ts` | `contact.hours` | Old site showed conflicting schedules — confirm exact hours. |
| `src/content/site.ts` | `contact.email` | `office@pamirconstruct.md` is a guess — confirm. |
| `src/content/site.ts` | `social` (Instagram) | Old IG linked a **different company** (“constructinvestgarantgrup”) — omitted until the correct Pamir handle is given. |
| `src/content/home.ts` | `getStats()` | “Лет на рынке (10+)” and “Квартир построено (500+)” are demo placeholders (`placeholder: true`). Completed/under-construction counts are derived from real data and are accurate. |
| `src/content/projects.ts` | Botanic Star 2 (bl. 3–4) | Floors, deadline unconfirmed. Old site’s **“Всего квартир: 10”** looks wrong — verify it means apartments (not blocks/floors). |
| `src/content/projects.ts` | Eco House | Exact address, floors, deadline unconfirmed. |
| `src/content/projects.ts` | Completed projects | Completion years, exact addresses, real photos. |
| `src/content/projects.ts` | `floorplans` | All are demo (`placeholder: true`) with no area/price — add real drawings, areas, availability. |
| `src/content/services.ts` | services list | Confirm the final list (structure fixed to Pamir Construct only — the old site’s wrong company name is removed everywhere). |
| `src/content/faq.ts` | answers | Confirm wording and any specific figures. |
| `src/content/legal.ts` | privacy policy | Baseline text — **have a lawyer review**; set the real `privacyUpdated` date. |

Each project also carries an `unconfirmed: [...]` list documenting its open items.

## 3. Forms & notifications

Lead/contact forms POST to `/api/lead` (validation, MD phone mask, honeypot,
rate-limit). To actually deliver leads, set env vars in `.env.local`
(see `.env.example`):

- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (works out of the box once set).
- **Email/CRM**: wire your provider in `src/app/api/lead/route.ts` (marked `TODO`).

Until configured, leads are logged server-side (`console.info('[lead]', …)`) so
nothing is lost during setup. **No secrets are exposed to the client.**

## 4. Deployment

Set `NEXT_PUBLIC_SITE_URL` (used for canonical, sitemap, Open Graph, hreflang).
The site is a standard Next.js app (Node runtime) — deploy to Vercel or any Node
host. Old-site URLs are 301-redirected in `next.config.mjs`.
