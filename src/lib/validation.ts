import { z } from 'zod';

/** Keep only leading + and digits. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, '');
  return '+' + digits;
}

/** Format Moldovan numbers as +373 XX XXX XXX while typing. */
export function formatMoldovaPhone(input: string): string {
  let digits = input.replace(/[^\d]/g, '');
  if (digits.startsWith('00373')) digits = digits.slice(2);
  if (!digits.startsWith('373')) {
    // Assume local entry — prefix country code.
    digits = '373' + digits.replace(/^0+/, '');
  }
  digits = digits.slice(0, 11); // 373 + 8
  const rest = digits.slice(3);
  const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 8)].filter(Boolean);
  return '+373' + (parts.length ? ' ' + parts.join(' ') : '');
}

const phoneField = z
  .string()
  .transform((v) => normalizePhone(v))
  .refine((v) => /^\+373\d{8}$/.test(v), { message: 'phone' });

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'name').max(80),
  phone: phoneField,
  project: z.string().max(120).optional().default(''),
  method: z.enum(['phone', 'whatsapp', 'telegram']).optional(),
  subject: z.string().max(160).optional().default(''),
  comment: z.string().max(2000).optional().default(''),
  email: z.union([z.string().email(), z.literal('')]).optional().default(''),
  consent: z.literal(true),
  locale: z.enum(['ru', 'ro']).default('ru'),
  page: z.string().max(300).optional().default(''),
  variant: z.enum(['lead', 'contact']).default('lead'),
  // Honeypot — bots fill it, humans never see it. Must stay empty.
  company: z.string().max(0).optional().default(''),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
