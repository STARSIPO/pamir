/**
 * "Скачать планировку" — the apartment plan as a clean, standalone SVG.
 *
 * Built in the browser from the same geometry as the on-screen drawing
 * (geometry.ts), laid out as a print sheet: project, apartment number and key
 * figures on top, the plan with its façade, doors, entrance, scale bar and
 * north arrow, the explication (room — m²) and a footer. It is a document of its
 * own, not a themed page element: black on white whatever the site theme,
 * named colours only, fonts falling back to Helvetica/Arial.
 */
import type { Apartment, RoomType } from '@/lib/inventory/types';
import { formatArea } from '@/lib/pricing/engine';
import {
  PARTITION,
  WALL,
  isWet,
  labelSpot,
  openingCut,
  openingLines,
  planGeometry,
  type CornerSide,
} from './geometry';

export interface PlanSvgText {
  project: string;
  /** «Квартира №34» */
  title: string;
  /** «3 комнаты · 84,6 м² · Этаж 7 · Блок 3» */
  subtitle: string;
  room: Record<RoomType, string>;
  metre: string;
  /** «Фасад · Окна во двор» */
  facade: string;
  entrance: string;
  north: string;
  explication: string;
  indoorTotal: string;
  /** «Pamir Construct · Сформировано 30.09.2026» */
  footer: string;
  /** Schematic / demo disclaimer lines. */
  notes: string[];
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const n2 = (n: number) => Math.round(n * 100) / 100;
const n3 = (n: number) => Math.round(n * 1000) / 1000;

const INK = 'black';
const MUTED = 'dimgray';
const HAIR = 'silver';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function buildPlanSvg(
  apartment: Apartment,
  locale: string,
  orientation: { northDeg: number; cornerSide: CornerSide },
  text: PlanSvgText,
): string {
  const g = planGeometry(apartment.plan2D, orientation.cornerSide);
  const v = g.view;

  const W = 1240;
  const M = 72;
  const A = W - M * 2;
  const top = M + 196;
  const S = Math.min(A / v.w, 620 / v.h);
  const planW = v.w * S;
  const planH = v.h * S;
  const left = M + (A - planW) / 2;
  const ox = left - v.x * S;
  const oy = top - v.y * S;
  const px = (x: number) => n2(ox + x * S);
  const py = (y: number) => n2(oy + y * S);
  const out: string[] = [];

  // Header.
  out.push(
    `<text x="${M}" y="${M + 12}" font-size="13" letter-spacing="2.2" fill="${MUTED}">${esc(text.project.toUpperCase())}</text>`,
    `<text x="${M}" y="${M + 72}" font-size="52" font-weight="300" letter-spacing="-1.5" fill="${INK}">${esc(text.title)}</text>`,
    `<text x="${M}" y="${M + 110}" font-size="18" fill="${INK}">${esc(text.subtitle)}</text>`,
    `<line x1="${M}" y1="${M + 140}" x2="${W - M}" y2="${M + 140}" stroke="${HAIR}" stroke-width="1"/>`,
    `<text x="${W / 2}" y="${top - 18}" font-size="11" letter-spacing="2" fill="${MUTED}" text-anchor="middle">${esc(text.facade.toUpperCase())}</text>`,
  );

  // Plan, drawn in metres inside a scaled group.
  const hair = `vector-effect="non-scaling-stroke"`;
  out.push(
    `<defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="0.26" height="0.26" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.26" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.03"/></pattern>` +
      `<pattern id="tile" patternUnits="userSpaceOnUse" width="0.3" height="0.3"><path d="M0.3 0V0.3H0" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="0.014"/></pattern>` +
      // Door openings taken out of the partitions (white keeps, black cuts).
      `<mask id="doors" maskUnits="userSpaceOnUse" x="${n2(v.x)}" y="${n2(v.y)}" width="${n2(v.w)}" height="${n2(v.h)}"><rect x="${n2(v.x)}" y="${n2(v.y)}" width="${n2(v.w)}" height="${n2(v.h)}" fill="white"/>` +
      g.doors
        .map((d) => (d.cut ? `<rect x="${n3(d.cut.x0)}" y="${n3(d.cut.y0)}" width="${n3(d.cut.x1 - d.cut.x0)}" height="${n3(d.cut.y1 - d.cut.y0)}" fill="black"/>` : ''))
        .join('') +
      `</mask></defs>`,
    `<g transform="translate(${n2(ox)} ${n2(oy)}) scale(${n2(S)})">`,
  );
  for (const r of g.rooms) {
    if (r.outdoor || isWet(r.room.type)) out.push(`<path d="${r.path}" fill="url(#${r.outdoor ? 'hatch' : 'tile'})"/>`);
  }
  out.push('<g mask="url(#doors)">');
  for (const r of g.rooms) {
    out.push(
      `<path d="${r.path}" fill="none" stroke="${INK}" stroke-opacity="${r.outdoor ? 0.6 : 0.8}" stroke-width="${r.outdoor ? 0.035 : PARTITION}"/>`,
    );
  }
  out.push('</g>');
  out.push(`<path d="${g.outline}" fill="none" stroke="${INK}" stroke-width="${WALL}" stroke-linejoin="miter"/>`);
  for (const o of g.windows) {
    const c = openingCut(o);
    out.push(
      `<rect x="${n2(c.x0)}" y="${n2(c.y0)}" width="${n2(c.x1 - c.x0)}" height="${n2(c.y1 - c.y0)}" fill="white"/>`,
      `<path d="${openingLines(o)}" fill="none" stroke="${INK}" stroke-width="1" ${hair}/>`,
    );
  }
  if (g.door) {
    const c = g.door.cut;
    out.push(
      `<rect x="${n2(c.x0)}" y="${n2(c.y0)}" width="${n2(c.x1 - c.x0)}" height="${n2(c.y1 - c.y0)}" fill="white"/>`,
      `<path d="${g.door.leaf}" fill="none" stroke="${INK}" stroke-width="1.5" ${hair}/>`,
      `<path d="${g.door.arc}" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="1" ${hair}/>`,
    );
  }
  for (const d of g.doors) {
    out.push(
      `<path d="${d.leaf}" fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.25" ${hair}/>`,
      `<path d="${d.arc}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1" ${hair}/>`,
    );
  }
  out.push('</g>');

  // Room labels at print size; a paper-white halo keeps them clear of hatching.
  const halo = `stroke="white" stroke-width="5" stroke-linejoin="round" paint-order="stroke"`;
  for (const r of g.rooms) {
    const name = text.room[r.room.type];
    const area = `${formatArea(r.room.area, locale)} ${text.metre}²`;
    const { mode, center } = labelSpot(r, S, name, area, { name: 11, area: 17 });
    const [cx, cy] = [px(center[0]), py(center[1])];
    if (mode === 'full') {
      out.push(
        `<text x="${cx}" y="${n2(cy - 4)}" font-size="11" letter-spacing="1.6" fill="${MUTED}" text-anchor="middle" ${halo}>${esc(name.toUpperCase())}</text>`,
        `<text x="${cx}" y="${n2(cy + 17)}" font-size="17" font-weight="300" fill="${INK}" text-anchor="middle" ${halo}>${esc(area)}</text>`,
      );
    } else if (mode === 'area') {
      out.push(
        `<text x="${cx}" y="${n2(cy + 6)}" font-size="15" font-weight="300" fill="${INK}" text-anchor="middle" ${halo}>${esc(area)}</text>`,
      );
    } else if (mode === 'index') {
      out.push(
        `<text x="${cx}" y="${n2(cy + 4)}" font-size="11" fill="${MUTED}" text-anchor="middle" ${halo}>${String(r.index).padStart(2, '0')}</text>`,
      );
    }
  }
  if (g.door) {
    out.push(
      `<text x="${px(g.door.label[0])}" y="${n2(py(g.door.label[1]) + 4)}" font-size="10" letter-spacing="1.6" fill="${MUTED}" text-anchor="middle">${esc(text.entrance.toUpperCase())}</text>`,
    );
  }

  // Scale bar (0 — 1 — 2 m) and north arrow under the plan.
  const sy = top + planH + 28;
  const m = S;
  out.push(
    `<rect x="${n2(left)}" y="${n2(sy)}" width="${n2(2 * m)}" height="6" fill="none" stroke="${INK}" stroke-width="1"/>`,
    `<rect x="${n2(left)}" y="${n2(sy)}" width="${n2(m)}" height="6" fill="${INK}"/>`,
    `<text x="${n2(left)}" y="${n2(sy + 22)}" font-size="10" fill="${MUTED}" text-anchor="middle">0</text>`,
    `<text x="${n2(left + m)}" y="${n2(sy + 22)}" font-size="10" fill="${MUTED}" text-anchor="middle">1</text>`,
    `<text x="${n2(left + 2 * m)}" y="${n2(sy + 22)}" font-size="10" fill="${MUTED}" text-anchor="middle">2 ${esc(text.metre)}</text>`,
  );
  const nx = left + planW - 14;
  const ny = sy + 8;
  out.push(
    `<g transform="translate(${n2(nx)} ${n2(ny)}) rotate(${orientation.northDeg})"><circle r="12" fill="none" stroke="${INK}" stroke-opacity="0.4"/><path d="M0 -9 3.5 2H-3.5Z" fill="${INK}"/><path d="M0 9V2" stroke="${INK}"/></g>`,
    `<text x="${n2(nx)}" y="${n2(ny - 18)}" font-size="10" letter-spacing="1.6" fill="${MUTED}" text-anchor="middle">${esc(text.north)}</text>`,
  );

  // Explication in two columns.
  const ey = sy + 76;
  const rows = g.rooms;
  const perCol = Math.ceil(rows.length / 2);
  const colW = (A - 48) / 2;
  out.push(
    `<text x="${M}" y="${n2(ey)}" font-size="11" letter-spacing="2" fill="${MUTED}">${esc(text.explication.toUpperCase())}</text>`,
    `<text x="${W - M}" y="${n2(ey)}" font-size="13" fill="${MUTED}" text-anchor="end">${esc(text.indoorTotal)}  <tspan font-size="17" fill="${INK}">${esc(formatArea(apartment.area, locale))} ${esc(text.metre)}²</tspan></text>`,
    `<line x1="${M}" y1="${n2(ey + 14)}" x2="${W - M}" y2="${n2(ey + 14)}" stroke="${HAIR}"/>`,
  );
  rows.forEach((r, i) => {
    const col = i < perCol ? 0 : 1;
    const row = col === 0 ? i : i - perCol;
    const x = M + col * (colW + 48);
    const y = ey + 44 + row * 34;
    out.push(
      `<text x="${n2(x)}" y="${n2(y)}" font-size="11" fill="${MUTED}">${String(r.index).padStart(2, '0')}</text>`,
      `<text x="${n2(x + 36)}" y="${n2(y)}" font-size="15" fill="${r.outdoor ? MUTED : INK}">${esc(text.room[r.room.type])}</text>`,
      `<text x="${n2(x + colW)}" y="${n2(y)}" font-size="15" fill="${INK}" text-anchor="end">${esc(formatArea(r.room.area, locale))} ${esc(text.metre)}²</text>`,
      `<line x1="${n2(x)}" y1="${n2(y + 12)}" x2="${n2(x + colW)}" y2="${n2(y + 12)}" stroke="${HAIR}" stroke-opacity="0.6"/>`,
    );
  });

  // Footer.
  const fy = ey + 44 + perCol * 34 + 36;
  out.push(`<line x1="${M}" y1="${n2(fy)}" x2="${W - M}" y2="${n2(fy)}" stroke="${HAIR}"/>`);
  out.push(`<text x="${M}" y="${n2(fy + 28)}" font-size="12" letter-spacing="1.2" fill="${INK}">${esc(text.footer)}</text>`);
  text.notes.forEach((note, i) => {
    out.push(`<text x="${M}" y="${n2(fy + 52 + i * 20)}" font-size="12" fill="${MUTED}">${esc(note)}</text>`);
  });
  const H = Math.ceil(fy + 52 + text.notes.length * 20 + M / 2);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">` +
    `<title>${esc(`${text.title} — ${text.project}`)}</title>` +
    `<rect width="${W}" height="${H}" fill="white"/>` +
    out.join('') +
    `</svg>`
  );
}

/** Save a string as a file, client-side (no server on the static export). */
export function downloadText(content: string, fileName: string, type = 'image/svg+xml') {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The plan sheet as a small print-ready page — what a phone gets instead of
 * a bare .svg file, which iOS Files or an Android download would show as
 * code or in a viewer that cannot print. The sheet fills the screen width; a
 * bar on top prints it (the system dialog also saves a PDF) or saves the SVG.
 * Like the sheet itself, a document of its own: black on white, named
 * colours, whatever the site theme.
 */
export function printablePage(
  svg: string,
  text: { lang: string; title: string; print: string; save: string; fileName: string },
): string {
  const inline = svg.replace(/^<\?xml[^>]*>\s*/, '');
  const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const button =
    'display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid black;background:white;color:black;' +
    'font-family:inherit;font-size:12px;font-weight:500;line-height:1;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer';
  return (
    `<!doctype html><html lang="${esc(text.lang)}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(text.title)}</title>` +
    `<style>html,body{margin:0;background:white;color:black;font-family:${FONT}}` +
    `.bar{position:sticky;top:0;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;padding:12px 16px;background:white;border-bottom:1px solid silver}` +
    `.sheet{padding:16px}.sheet svg{display:block;width:100%;height:auto}` +
    `@media print{.bar{display:none}.sheet{padding:0}}@page{margin:12mm}</style></head><body>` +
    `<div class="bar"><button type="button" onclick="print()" style="${button}">${esc(text.print)}</button>` +
    `<a href="${href}" download="${esc(text.fileName)}" style="${button}">${esc(text.save)}</a></div>` +
    `<div class="sheet">${inline}</div></body></html>`
  );
}

/** Open an HTML string in a new tab; false when the browser blocked it. */
export function openPage(html: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const win = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return !!win;
}
