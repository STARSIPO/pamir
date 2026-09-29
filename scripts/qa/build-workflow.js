export const meta = {
  name: 'pamir-redesign-build',
  description: 'Build the Pamir Construct visual redesign: 8 parallel agents, each owning a disjoint set of pages/components',
  phases: [{ title: 'Build', detail: '8 builders on disjoint file sets, each self-verifying with screenshots' }],
}

const SHOOT = 'C:/Users/burie/AppData/Local/Temp/claude/C--Users-burie-AppData-Roaming-Claude-scratch-workspaces-f7eb3d41-e02c-4421-b6d8-2b55d6d410e2-900ed917-a875-46e5-8b85-729c9f557d13-scratch-2026-09-29-73273b/0c03f3f7-22e0-4120-b152-c0ba74142bef/scratchpad/shoot.mjs'
const SHOTS = 'C:/Users/burie/AppData/Local/Temp/claude/C--Users-burie-AppData-Roaming-Claude-scratch-workspaces-f7eb3d41-e02c-4421-b6d8-2b55d6d410e2-900ed917-a875-46e5-8b85-729c9f557d13-scratch-2026-09-29-73273b/0c03f3f7-22e0-4120-b152-c0ba74142bef/scratchpad/shots'

const COMMON = `
You are a senior frontend designer-engineer on a full VISUAL REDESIGN of the Pamir Construct website
(residential developer, Chișinău). Repo: D:\\pamr — Next.js 16 App Router, React 19, TypeScript, Tailwind 3.
Always use absolute paths under D:\\pamr. Your shell cwd may be elsewhere.

## Client brief (condensed, binding)
- Strong visual redesign, NOT cosmetic. Keep the meaning, information, projects, texts and overall structure.
- Direction (refs solomon.md, inamstro.md — direction only, never copy): modern architecture, premium real estate,
  LARGE photographs of buildings, minimalism, a lot of whitespace, quality typography, VERY large headings,
  the feel of a serious large developer. Avoid the ordinary template-corporate look.
- BIG TYPOGRAPHY + ARCHITECTURE + WHITESPACE. Few sizes, few weights.
- Projects are the most important part: no small standard cards. Large photos; alternate layouts
  (photo left / info right; info left / photo right; full-width photo; grid of 2). On hover the photo very slowly
  zooms ~2–4%. Project name large; extra info minimal (e.g. "Pamir Residence / Chișinău / View project →").
- Motion: very smooth and minimal — fade-up, reveal, small image zoom, smooth scrolling, 300–700ms.
  NO heavy parallax, flying elements, glow, neon, or lots of animation.
- Header: transparent over the hero, compact with a background after scroll; logo left, sections + CTA right; very clean.
- Full responsive: desktop, tablet, mobile — mobile must look as premium as desktop.
- The difference from the old site must be obvious at first glance.

## Before writing code, READ (all of it)
1. D:\\pamr\\docs\\DESIGN-SYSTEM.md — the binding design-system spec (tokens, type ramp, grid, motion, photo rules, home composition).
2. Foundation (use these; do not modify them): src/app/globals.css, tailwind.config.ts, src/config/theme.ts,
   src/components/ui/{Section,SectionHeading,Reveal,Media,Button,StatusBadge,Container}.tsx,
   src/components/projects/ProjectCard.tsx, src/components/shared/{PageHero,CtaBand}.tsx, src/components/brand/Logo.tsx,
   src/lib/{utils,text,smooth-scroll}.ts, src/i18n/dictionaries/ru.ts (Dictionary shape incl. dict.design.*),
   src/i18n/routing.ts, src/content/{types,projects,home,site,company}.ts.
3. The current versions of the files you own (keep their data flow / logic; rewrite their presentation).

## Hard rules
- You OWN ONLY the files listed in your task. Do not edit any other file (not dictionaries, not content, not
  foundation components, not tailwind/globals). If another file needs a change, put it in crossFileRequests.
- Keep every exported name and props signature that other files use (listed in your task).
- Colours only via theme tokens (bg-canvas, bg-canvas-alt, bg-surface, text-ink, text-muted, accent*, band*, border-line/15,
  scrim). No hex, no bg-white page backgrounds, no legacy brand/graphite/sand/stone classes. text-white only on photographs.
- Display headings: font-display font-light, sizes only from the ramp (text-hero, text-display-xl/lg/md/sm, text-lead, .label).
  No font-bold/semibold on display text. Square corners, no shadows, 1px hairlines.
- All text from dictionaries (dict.*) or content (src/content/*). No hard-coded RU/RO strings. If a string is missing,
  pick the closest existing key and list the missing one in missingStrings.
- Images: <Media> (or next/image + asset() + img-treat). Renders (project.coverKind === 'render') get caption={dict.design.render}.
  Never CSS background-image url(). The LCP hero image: priority, no mask reveal.
- Motion via <Reveal> (fade / mask / stagger) and CSS transitions; respect the global reduced-motion rule; no new JS animation libs,
  no new npm dependencies. Overlays/dialogs: lockScroll() from @/lib/smooth-scroll and data-lenis-prevent on inner scrollers.
- Server Components by default; 'use client' only where needed. Must work under static export (GitHub Pages, basePath /pamir).
- Source files use CRLF line endings: edit with the Edit/Write tools, not sed.
- Do not touch src/components/variants/* or /preview. Do not run \`next build\`, do not start/stop dev servers, do not commit.
- Accessibility: semantic headings (one h1 per page), visible focus, alt text, aria on toggles/dialogs, ≥44px touch targets.

## Verify your work visually (required)
A dev server is ALREADY running at http://localhost:3000 (RU at /ru, RO at /ro). Other agents are editing other parts of
the site at the same time, so a page may briefly fail to compile or show unfinished neighbours — wait ~20s and retry;
judge only your own part. Take full-page screenshots with:
  node "${SHOOT}" <url> <width> <height> "${SHOTS}/<your-id>-<name>" [--mobile] [--theme=dark|stone]
It prints JSON with the PNG chunk paths (each chunk = 2 viewports) and horizontalOverflow (must be 0). Read the PNGs.
Check at least 1440x900, 390x844 --mobile, and 768x1024; also 1440x900 --theme=dark once to catch hard-coded colours.
Iterate until your part looks like a premium developer site: generous whitespace, strong hierarchy, large type,
clean alignment on the 12-col grid, nothing cramped, nothing overflowing, good line breaks on mobile.
Then run \`npx tsc --noEmit\` and \`npx eslint <your files>\` from D:\\pamr; fix errors in YOUR files only.

## Final answer
Return the structured report: what you built (design decisions), files changed/created/deleted, cross-file requests,
missing strings, and your visual self-check results (what you verified at which widths, any known remaining issues).
`

const REPORT = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    crossFileRequests: { type: 'array', items: { type: 'string' } },
    missingStrings: { type: 'array', items: { type: 'string' } },
    selfCheck: { type: 'string' },
    knownIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'files', 'crossFileRequests', 'missingStrings', 'selfCheck', 'knownIssues'],
}

const TASKS = [
  {
    id: 'home-hero',
    label: 'Hero + About',
    task: `
## Your task: homepage Hero and "01 — About"
OWNED FILES: src/components/home/Hero.tsx, src/components/home/AboutBrief.tsx
Exports to keep: Hero({locale, dict}), AboutBrief({locale, dict}).

HERO — the first screen must impress immediately.
- Full-screen: h-[100svh] min-h-[640px], relative, overflow-hidden, bg-scrim, text-white.
- Background photo: the Eco House render — getProject('eco-house').hero (fallback .cover) via <Media fill priority sizes="100vw">.
  Entrance: the image wrapper uses animate-hero-zoom (scale 1.08→1). Choose object position so the building reads well on
  desktop AND on a 390px portrait phone (test it; the building is left-of-centre in the frame).
- Scrims for legibility: a top gradient (from-scrim/55, ~160px) for the transparent header, and a bottom gradient
  (from-scrim/85 via-scrim/30 to-transparent) under the text. Keep the architecture visible; do not grey out the whole photo.
- Minimum information on top of the photo, bottom-aligned inside .container:
  label "Pamir Construct" (companyLegalName from content/site) → the slogan dict.hero.title in text-hero font-light
  (break into ~2–3 lines; balance) → dict.hero.subtitle (short, white/75, ≤ 36ch) → ONE button: Button variant="light"
  arrow → routes.projects (dict.hero.ctaProjects). Do NOT add a second CTA, stats, or other clutter.
  On lg: slogan on the left (8 cols), subtitle + button in a right column aligned to the slogan's baseline.
- A bottom strip with a hairline (border-white/20): left = "{dict.design.onImage} — Eco House · {dict.design.render}"
  (label, white/60); right = dict.common.scrollHint with a thin vertical line indicator (subtle, CSS only).
- Entrance: CSS animate-hero-in on text blocks with a small stagger (animationDelay 0.1–0.6s). Content must still be
  visible with reduced motion.
- The fixed header (another agent) overlays the top ~88px in white text: leave room.

"01 — ABOUT" (AboutBrief) — one large statement with a lot of air, no photo.
- Section tone canvas. Label row: index "01", eyebrow dict.about.eyebrow, hairline (use SectionHeading's label style or
  build the same pattern). Then an editorial layout on the 12-col grid, e.g. left 4 cols: dict.about.title as a small
  display-sm heading; right 8 cols: dict.about.body set LARGE as a statement (text-display-md font-light, text-balance/pretty,
  ink), then a ghost Button arrow → routes.company (dict.about.cta).
- Optionally a quiet facts row under it (label style, hairline separated): city (content/site foundedCity), completed
  count, under-construction count — derived from projects (truthful). Keep it minimal.
- Must feel like a premium architecture studio page: big type, generous whitespace, strict alignment.`,
  },
  {
    id: 'home-projects',
    label: 'Featured + Spotlight + More',
    task: `
## Your task: homepage project sections
OWNED FILES: src/components/home/FeaturedProjects.tsx, src/components/home/ProjectFeature.tsx (new),
src/components/home/Spotlight.tsx (currently a stub), src/components/home/MoreProjects.tsx (currently a stub)
Exports to keep: FeaturedProjects({locale, dict}), Spotlight({locale, dict}), MoreProjects({locale, dict}).
Use ProjectCard (foundation) where a card fits; ProjectFeature is your own large alternating row.

"02 — PROJECTS" (FeaturedProjects): Section canvas. SectionHeading index="02" eyebrow=dict.featured.eyebrow
title=dict.featured.title subtitle=dict.featured.subtitle action=<Button variant="ghost" arrow href={routes.projects}>
{dict.featured.cta}. Then the two projects under construction ('botanic-star-2-blocks-3-4', 'eco-house') as two LARGE
alternating rows (ProjectFeature):
- The whole row is one Link (group). Image side ~7 cols with <Reveal variant="mask"> + <Media zoom caption=render ...>
  (use project.cover — for Eco House that is a portrait crop, different from the hero image); text side ~4 cols with an
  offset column so the composition breathes.
- Text: "01 / 02" style index (label, muted) · StatusBadge · district (· address if present) — then the project name in
  text-display-lg font-light — excerpt (muted, max ~38ch) — ArrowLabel {dict.common.viewProject}. Minimal.
- Row 1: photo left / info right. Row 2: info left / photo right. Vary aspect ratios between the rows (e.g. 5/4 and 4/5)
  to avoid a template feel. Vertical spacing between rows: generous (mt-section-sm or more).
- Mobile: photo first, full container width, text below; still large name.

SPOTLIGHT (no index number): one project full-bleed — 'botanic-star-2-block-1' (use project.hero, a wide 2000x924 render).
- Full-width section (no container on the image): height ~ h-[88svh] min-h-[560px] max-h-[1000px] on desktop; on mobile a
  shorter but still big frame (e.g. 78svh) — choose object position so the building stays in frame on a portrait phone.
- Image: <Media fill> with treat; mask reveal is fine here (not LCP). Bottom scrim gradient.
- Overlaid content inside .container at the bottom: label dict.design.spotlightEyebrow + StatusBadge (white) —
  the project name HUGE (text-display-xl font-light, white) — one-line district/tagline — Button variant="outlineLight"
  arrow → routes.project(locale, slug) (dict.common.viewProject). Caption dict.design.render in a corner.
- The section should feel like a pause: a single, cinematic image.

"04 — MORE PROJECTS" (MoreProjects): the remaining completed projects (all projects except the two featured ones and the
spotlight one): 'botanic-star-2-block-2', 'botanic-star', 'botanic-park'.
- Section canvas. SectionHeading index="04" eyebrow=dict.design.moreEyebrow title=dict.design.moreTitle
  subtitle=dict.design.moreSubtitle action=ghost Button → routes.projects (dict.featured.cta).
- An ASYMMETRIC grid of ProjectCards on lg (12 cols): e.g. card A col-span-7 (landscape 5/4), card B col-span-4 col-start-9
  pushed down (lg:mt-40, portrait 3/4 — Botanic Star's cover is a tall portrait photo), card C col-span-8 col-start-3 or
  similar (landscape 16/10). Tune by looking at the photos (public/photos/projects/*) and your screenshots.
  md: two columns; mobile: one column, consistent spacing (gap-y ~ 4–5rem).
- Pass sensible sizes= to cards.`,
  },
  {
    id: 'home-proof',
    label: 'Advantages + Quality',
    task: `
## Your task: "03 — Advantages" (numbers + reasons) and construction quality
OWNED FILES: src/components/home/Advantages.tsx (currently a stub), src/components/home/Quality.tsx,
src/components/ui/Counter.tsx, src/components/home/WhyUs.tsx and src/components/home/Stats.tsx (their content moves into
Advantages; DELETE these two files if nothing imports them anymore — grep src first; the homepage no longer does).
Exports to keep: Advantages({locale, dict}), Quality({locale, dict}) — Quality is ALSO used on the company page
(src/app/[locale]/company/page.tsx) so it must look right there too. Counter's props must stay compatible.

ADVANTAGES: Section canvas.
- SectionHeading index="03" eyebrow=dict.design.numbersEyebrow title=dict.stats.title (or dict.why.title — choose the one
  that reads best as the section's big title; the other can title the reasons list).
- Big numbers: getStats() from content/home.ts — 4 figures as very large light numerals (text-display-xl font-light tabular,
  Counter count-up once in view), each with a label beneath (label, muted), separated by vertical hairlines (border-l
  border-line/15) on lg in 4 columns; 2×2 on mobile with hairlines. Placeholder figures (placeholder: true) get an
  asterisk and dict.stats.note printed small and muted below the row — honesty about unconfirmed numbers is mandatory.
- Four reasons: advantages from content/home.ts (n, title, text): an editorial list — e.g. a 2×2 grid or rows with top
  hairlines, index n in label/accent, title text-display-sm font-light, text muted max ~40ch. Use dict.why.title /
  dict.why.eyebrow as a sub-heading if helpful.
- Lots of whitespace, strict grid alignment. No icons-in-circles, no cards with backgrounds.

QUALITY: section (tone canvas or alt — pick what gives rhythm after Advantages; on the homepage the next section is
"04 More projects" on canvas) with dict.quality.eyebrow/title/subtitle (SectionHeading, size lg or xl, no index number or
continue the '03' block visually — your call) and qualityFeatures (8 items) as a clean hairline grid/list: 2 cols mobile,
4 cols desktop, each item = small index (01–08) or a thin FeatureIcon (strokeWidth ~1.25, text-muted) + label text.
Optionally pair it with the atmosphere photo /photos/quality-site.jpg (stock construction site — atmosphere only, NO
project caption) in a tall frame beside the list on lg. Keep it calm and premium.
COUNTER: make the numeral style work at display sizes (tabular, no layout shift: reserve width) and keep reduced motion
showing the final value.`,
  },
  {
    id: 'home-closing',
    label: 'Company + Steps + Lead + Form',
    task: `
## Your task: "05 — Company", steps, "06 — Contact" CTA, the lead form, contact info
OWNED FILES: src/components/home/CompanyBrief.tsx (currently a stub), src/components/home/Steps.tsx,
src/components/home/LeadSection.tsx, src/components/home/ContactMap.tsx (no longer on the homepage — DELETE it if nothing
imports it; grep first), src/components/forms/LeadForm.tsx, src/components/shared/ContactInfo.tsx
Exports/props to keep:
- CompanyBrief({locale, dict}), Steps({locale, dict})
- LeadSection({locale, dict, projectName?, id = 'lead'}) — also used at the end of the project detail page.
- LeadForm({locale, dict, variant: 'lead'|'contact', tone: 'light'|'dark', projectName?, className?}) — used by the
  contacts page (variant="contact" tone="dark", on canvas) and inside LeadSection (tone="light" = on the dark band).
  Keep ALL form logic intact: fields, validation, Moldovan phone mask (formatMoldovaPhone), honeypot, POST /api/lead,
  static-export behaviour, redirect to routes.thankyou, success/error states. Restyle only.
- ContactInfo({locale, dict}) — used by the contacts page on canvas. You may add an optional tone prop ('canvas' | 'band').

COMPANY BRIEF "05": Section canvas. Label row index "05" eyebrow dict.design.companyEyebrow. Photo
/photos/projects/company/about.jpg (a render of Botanic Star 2 → caption dict.design.render) large (~6–7 cols, mask
reveal, zoom). Beside it: companyQuote (content/company.ts, "Дом — это крепость.") in text-display-lg font-light,
companyIntro[0] in muted body text, ghost Button arrow → routes.company (dict.about.cta). Asymmetric, airy.

STEPS: dict.steps.eyebrow/title + steps (content/home.ts, 6 items). A calm process row: on xl 6 columns (or 3×2 on md),
each with a top hairline, index numeral (text-display-md font-light, accent or muted), title text-display-sm font-light,
text muted. Mobile: a vertical list with hairlines. Spacing sm (it continues the company block).

LEAD SECTION "06": Section tone="band" (dark contrast band; the footer — also band — follows directly, so end cleanly).
- Label row index "06" eyebrow dict.design.contactEyebrow (band-muted, hairline band-fg/15).
- Left (~6 cols): dict.lead.title in text-display-xl font-light band-fg, dict.lead.subtitle (band-muted), the sales phone
  as a large link (text-display-md font-light tabular), then compact contact details (ContactInfo tone band or inline):
  phones with labels, office address, hours, email, route link (Google Maps search URL from contact.mapQuery).
- Right (~5 cols): LeadForm tone="light".
- If projectName is passed (project page), preselect it in the form (existing behaviour).

LEAD FORM restyle: architectural and minimal — fields as underlines (border-b, transparent bg, py-4, text-base), labels
as .label (muted/band-muted), focus = border-accent, errors in a restrained red (text-red-400/500 is acceptable for errors
only) with messages; contact-method choice as square toggle chips; consent as a square checkbox; submit = Button
(inverse on band, primary on canvas) full width, h-14. Works for tone="light" (on band) and tone="dark" (on canvas).
CONTACT INFO restyle: label/value rows with hairlines; big phone numbers; no icons-in-circles.`,
  },
  {
    id: 'chrome',
    label: 'Header + Menu + Footer',
    task: `
## Your task: site chrome — header, mobile menu, language switcher, footer
OWNED FILES: src/components/layout/Header.tsx, src/components/layout/MobileMenu.tsx,
src/components/layout/LanguageSwitcher.tsx, src/components/layout/Footer.tsx
Exports/props to keep: Header({locale, dict}), Footer({locale, dict}), MobileMenu({open, onClose, locale, dict}),
LanguageSwitcher({current, tone}) (check all usages with grep and keep them compiling).

HEADER:
- Fixed. On the homepage and project detail pages (existing overHero logic) it starts TRANSPARENT over the hero photo with
  white text/logo; after a small scroll (existing sentinel IntersectionObserver) it becomes compact (height
  var(--header-h) 88px → var(--header-h-compact) 68px) with bg-canvas/85 backdrop-blur-md text-ink and a bottom hairline
  (border-line/10). Transitions 400–600ms ease-premium. Other pages: solid from the start + the spacer div.
- Left: Logo (monochrome, currentColor). Right: primary nav (content/site primaryNav) as small, clean links
  (e.g. text-[0.8125rem] font-medium or .label style — pick the cleanest), active page marked subtly (accent hairline or
  small square), hover = link-line underline; then LanguageSwitcher ("RU / RO", minimal), then a compact CTA
  (Button outline / outlineLight when transparent, size md) dict.common.contactUs → routes.contacts. Very clean.
  Phone number: optional on xl only as plain text; do not crowd.
- < lg: Logo + LanguageSwitcher + a menu button (two thin horizontal lines, 44×44 target, aria-label dict.common.menu,
  aria-expanded).
MOBILE MENU: full-screen overlay (bg-canvas text-ink), opens with a smooth fade/slide (400–600ms), nav links HUGE
(text-display-md or display-lg font-light) with small index numbers, staggered fade-up; bottom area: sales phone, email,
address (content/site contact), LanguageSwitcher, CTA. role="dialog" aria-modal, Escape closes, focus moves in and
returns to the button on close, lockScroll(true/false) from @/lib/smooth-scroll, data-lenis-prevent on the panel.
Close on route change.
FOOTER: tone band (bg-band text-band-fg) — it directly follows a band section (LeadSection / CtaBand) on most pages, so
start with an in-container hairline (border-band-fg/15), not a new visual block. Minimal: an optional very large wordmark
"Pamir Construct" (font-display font-light, fitted to the container width — make sure it never overflows at 375px),
dict.footer.tagline, nav links, the projects list (routes.project), contacts (phones, email, address, hours), social
(content/site social), and a bottom row: © currentYear() companyLegalName, dict.footer.rights, privacy link,
LanguageSwitcher, and a "back to top" button (dict.design.backToTop) using getLenis()?.scrollTo(0) with a
window.scrollTo fallback. Everything in band-muted/band-fg; hover = link-line.`,
  },
  {
    id: 'projects-list',
    label: 'Projects page',
    task: `
## Your task: the projects catalogue page
OWNED FILES: src/app/[locale]/projects/page.tsx, src/components/projects/ProjectsExplorer.tsx
Exports/props to keep: ProjectsExplorer({projects, locale, dict, showFilters}) — ALSO used on the company page with
showFilters={false} and only the 4 completed projects: it must look great there too. Keep generateMetadata as is.

PAGE: PageHero (eyebrow dict.projectsPage.eyebrow, title dict.projectsPage.title, subtitle dict.projectsPage.subtitle),
then ProjectsExplorer with filters, then CtaBand (dict.projectDetail.ctaTitle / ctaSubtitle) — CtaBand is the last block
and flows into the band footer.
EXPLORER:
- Filters (client): text tabs "All / Under construction / Completed" (dict.common.filters) with counts in small tabular
  figures, active tab underlined with a 1px ink line (or accent), inactive muted; role="tablist"/aria-selected or
  aria-pressed buttons; ≥44px targets; horizontally scrollable on narrow screens without overflow of the page.
- Grid: large ProjectCards in an asymmetric 2-column rhythm on md+ (12-col grid: alternate col-span-7 / col-span-5 with
  a vertical offset on the narrower one, vary aspect ratios 5/4, 4/5, 3/4) — never a uniform grid of small cards.
  1 column on mobile. Big gaps. Pass good sizes= and priority to the first 2.
- Filter change: a short, smooth transition (fade/translate 300–500ms), no layout jank; empty state
  dict.projectsPage.empty.
- The explorer should make 6 projects feel like a curated portfolio.`,
  },
  {
    id: 'project-detail',
    label: 'Project detail page',
    task: `
## Your task: the project detail page
OWNED FILES: src/app/[locale]/projects/[slug]/page.tsx, src/components/project/ProjectHero.tsx,
src/components/project/Gallery.tsx, src/components/project/Floorplans.tsx
Keep generateStaticParams / generateMetadata / notFound logic. Keep Floorplans' dialog behaviour, keyboard support and
availability logic (resolveAvailability), and Gallery's lightbox behaviour — restyle them. Other props can change since
you own both sides, but LeadSection (home/LeadSection.tsx, not yours) keeps props {locale, dict, projectName, id}.

PROJECT HERO: full-bleed photo (project.hero ?? project.cover), h-[100svh] min-h-[620px] (the transparent header sits on
top — another agent handles it), bottom scrim, priority image, animate-hero-zoom. Bottom-aligned content: a small
breadcrumb (label: dict.projectsPage.eyebrow → routes.projects / project name), StatusBadge, the project name HUGE
(text-display-xl or text-hero font-light, white, balanced), tagline (white/75), district · address (label). Actions:
Button light arrow "#lead" (dict.projectDetail.availableApartments) and, if floorplans exist, outlineLight "#floorplans"
(dict.projectDetail.viewFloorplans). Caption dict.design.render when coverKind==='render'. Choose object-position that
keeps the building in frame on a 390px phone.
PAGE SECTIONS (all theme tokens, lots of air, strict 12-col grid):
1. About: label row (dict.projectDetail.aboutTitle); description paragraphs — the first as a large statement
   (text-display-md font-light), the rest muted; beside it the specs as a hairline definition list (label → value).
2. Advantages (dict.projectDetail.advantagesTitle): hairline grid of items with thin FeatureIcon (strokeWidth ~1.25,
   text-muted) and labels — minimal, 2 cols mobile / 4 cols desktop.
3. Gallery (dict.projectDetail.galleryTitle) — ONLY if project.gallery has images (hide otherwise): an asymmetric
   editorial image grid (first image wide, then pairs), mask reveals, zoom, click opens the restyled lightbox (dark scrim
   bg, thin controls, counter "01 / 04", Escape/arrows, lockScroll from @/lib/smooth-scroll, focus management).
4. Floorplans (dict.projectDetail.floorplansTitle/Subtitle) if any: plans presented as architectural drawings — 1px
   hairline frames, no shadows, labels outside the frame; placeholder note (dict.projectDetail.placeholderNote) stays.
5. Location (dict.projectDetail.locationTitle / nearbyTitle): address, nearby list with hairlines, "route" link to Google
   Maps search (project.mapQuery) — no fake distances.
6. Other projects (dict.projectDetail.otherProjects): 2 ProjectCards (or 3) in an asymmetric layout + link to all projects.
7. LeadSection LAST (band) so it flows into the band footer; id="lead" for the hero anchor.
Test several slugs: botanic-star-2-blocks-3-4 (no gallery, has floorplans), eco-house, botanic-star (photo, portrait cover,
4-image gallery), botanic-park.`,
  },
  {
    id: 'secondary-pages',
    label: 'Company, Services, FAQ, Contacts, Legal, 404',
    task: `
## Your task: inner pages
OWNED FILES: src/app/[locale]/company/page.tsx, src/app/[locale]/services/page.tsx, src/app/[locale]/faq/page.tsx,
src/components/shared/Accordion.tsx, src/app/[locale]/contacts/page.tsx, src/app/[locale]/privacy/page.tsx,
src/app/[locale]/thank-you/page.tsx, src/app/[locale]/not-found.tsx, src/app/not-found.tsx,
src/components/shared/NotFoundView.tsx, src/components/ui/FeatureIcon.tsx (you may only make icons thinner/quieter:
strokeWidth ~1.25 default, keep its API {name, className}).
Keep generateMetadata on each page. Components you USE but do not own (other agents are restyling them now, props fixed):
PageHero, CtaBand, Section, SectionHeading, Reveal, Media, Button (foundation); Quality({locale, dict}) from home;
ProjectsExplorer({projects, locale, dict, showFilters}); LeadForm({locale, dict, variant, tone}); ContactInfo({locale, dict}).
- COMPANY: PageHero → history: companyIntro as a large statement (first paragraph text-display-md font-light, second muted)
  + companyQuote set huge ("Дом — это крепость.") → the image /photos/projects/company/about.jpg LARGE (render → caption
  dict.design.render, mask reveal) → principles and values (content/company.ts) as hairline editorial grids (index,
  title display-sm font-light, text muted; thin icons optional) → Quality → completed projects (ProjectsExplorer
  showFilters={false}, heading dict.companyPage.projectsTitle) → CtaBand last.
- SERVICES: PageHero → services (content/services.ts) as large numbered rows: index, title text-display-md font-light,
  summary, points as a hairline list; alternate text column offsets for rhythm → CtaBand.
- FAQ: PageHero → two-column layout on lg (left: a sticky small block with dict.faqPage.ctaSubtitle + sales phone;
  right: Accordion). ACCORDION restyle: hairline rows, question text-display-sm font-light, thin plus that rotates to a
  cross, answer expands smoothly (grid-template-rows 0fr→1fr, 400–600ms), aria-expanded/controls, keyboard. → CtaBand.
- CONTACTS: PageHero → grid: ContactInfo (left) and a "write to us" block with LeadForm variant="contact" tone="dark"
  (right, on canvas or surface) → a route/map link row. No CtaBand needed (the footer follows).
- PRIVACY: readable legal typography (max-w-prose, headings text-display-sm font-light, hairlines between sections,
  "updated" label).
- THANK-YOU and 404 (NotFoundView, both not-found files): minimal, large light typography, two actions (ghost/primary).
  app/not-found.tsx renders outside the [locale] layout — make sure it still looks on-brand (theme tokens work there).
Every page must share the same visual system as the homepage: big light type, hairlines, generous whitespace.`,
  },
]

phase('Build')
const reports = await parallel(TASKS.map((t) => () =>
  agent(`${COMMON}\n${t.task}\n\nYour screenshot id prefix: ${t.id}`, { label: t.label, phase: 'Build', schema: REPORT })
    .then((r) => ({ id: t.id, ...r }))
))
return reports.filter(Boolean)
