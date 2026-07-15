import type { Locale } from './config';
import { ru, type Dictionary } from './dictionaries/ru';
import { ro } from './dictionaries/ro';

const dictionaries: Record<Locale, Dictionary> = { ru, ro };

/** Synchronous dictionary access (content is bundled, no async fetch needed). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ru;
}

export type { Dictionary };
