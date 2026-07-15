import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/validation';

export const runtime = 'nodejs';

// Very small in-memory throttle (best-effort; use a real store in production).
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}

async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  // Honeypot: silently accept but drop (don't tip off bots).
  if (d.company) return NextResponse.json({ ok: true });

  const lines = [
    '🏗 <b>Pamir Construct — новая заявка</b>',
    `👤 ${escapeHtml(d.name)}`,
    `📞 ${escapeHtml(d.phone)}`,
    d.email ? `✉️ ${escapeHtml(d.email)}` : '',
    d.project ? `🏢 Проект: ${escapeHtml(d.project)}` : '',
    d.method ? `💬 Связь: ${d.method}` : '',
    d.subject ? `📌 Тема: ${escapeHtml(d.subject)}` : '',
    d.comment ? `📝 ${escapeHtml(d.comment)}` : '',
    `🌐 ${d.locale} · ${escapeHtml(d.page)}`,
  ].filter(Boolean);

  const message = lines.join('\n');

  // Dispatch to configured channels. All are optional & server-side only.
  await notifyTelegram(message);
  // TODO: wire SMTP/email or CRM here using process.env.* (see .env.example).
  //       For now, log server-side so leads are never lost during setup.
  console.info('[lead]', JSON.stringify({ ...d, ip: undefined }));

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
}
