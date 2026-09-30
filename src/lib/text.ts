import { Fragment, type ReactNode } from 'react';
import { createElement } from 'react';

export const NBSP = ' ';

/**
 * RU/RO typesetting for running text and headlines. It only moves spaces,
 * never changes the words:
 *   - a spaced dash never opens a line: it is tied to the word before it
 *     ("Botanic Star 2 —" / "блоки 3 и 4");
 *   - a short preposition, conjunction or particle (в, и, к, с, о, на, по,
 *     за, не, для…; RO o, și, în, la, de, pe, cu, din…) never hangs at the
 *     end of a line: it is tied to the word after it ("узнать о доступных",
 *     "Свяжитесь с Pamir"). A closed list, not "any two letters": RO has
 *     many two-letter words (ce, nu, se, să, ne) and tying them all would
 *     glue half a headline into one unbreakable run;
 *   - a brand name never splits across lines: "Pamir Construct",
 *     "Botanic Star 2", "Botanic Park", "Prima Casă", "Eco House".
 *
 * Only ordinary spaces are ever replaced, so it is idempotent: running it
 * twice gives the same string, and text already typeset by hand (content
 * with no-break spaces) passes through unchanged.
 */
const SHORT_WORD =
  /(^|[\s(«"„])(а|в|во|и|к|ко|о|об|обо|с|со|у|я|на|по|за|из|изо|от|ото|до|не|ни|но|или|для|без|под|над|при|про|o|a|al|ale|ai|ca|și|sau|în|la|de|pe|cu|un|din|sub|prin|spre|fără|până) (?=\S)/giu;

/**
 * Brand names, tied word to word. Each pattern captures everything up to the
 * space to tie; the lookahead names what follows. Order matters: "Botanic
 * Star" is tied first, so the third pattern can then keep its phase number
 * ("Botanic Star 2") on the same line.
 */
const BRAND: RegExp[] = [
  /(\bPamir) (?=Construct\b)/gi,
  /(\bBotanic) (?=(?:Star|Park)\b)/gi,
  /(\bBotanic Star) (?=\d)/gi,
  /(\bPrima) (?=Cas[ăa](?![\p{L}\p{N}]))/giu,
  /(\bEco) (?=House\b)/gi,
];

export function typo(text: string): string {
  let out = text.replace(/ ([—–])(?=\s|$)/g, `${NBSP}$1`);
  for (const re of BRAND) out = out.replace(re, `$1${NBSP}`);
  // Two passes: the lookahead lets adjacent short words chain ("и в доме").
  for (let i = 0; i < 2; i++) out = out.replace(SHORT_WORD, `$1$2${NBSP}`);
  return out;
}

/**
 * Typeset a project name for display sizes, so a wrapped name never strands
 * a piece of itself:
 *   - a spaced dash stays on the line before it ("Star 2 —" / "блоки 3 и 4"),
 *   - a numeral stays with the word before it ("Star 2", "блок 1"),
 *   - a one- or two-letter word stays with the word after it ("и 4", "și 4").
 * The only break left is the one after the dash.
 */
export function typesetName(text: string): string {
  return text
    .replace(/ ([—–])(?=\s|$)/g, `${NBSP}$1`)
    .replace(/ (\d)/g, `${NBSP}$1`)
    .replace(/(^|\s)([^\s—–]{1,2}) (?=\S)/g, `$1$2${NBSP}`);
}

/**
 * Wrap each word of a heading in `<span class="word" style="--i: n">` so CSS can
 * stagger them in.
 *
 * Runs on the server: the complete heading ships in the HTML, so crawlers and
 * screen readers get ordinary text and no reflow happens when Manrope swaps in.
 * Whitespace is preserved as real text nodes between the spans, which keeps the
 * accessible name identical to the source string.
 *
 * The text goes through typo() first and is split on BREAKING whitespace
 * only: `.word` spans are inline-blocks, so a no-break space between two of
 * them would not hold. Words tied by a no-break space ("о доступных",
 * "2 —") travel — and wrap — as one span.
 *
 * Splits by WORD, never by character — RU and RO text would have Cyrillic and
 * ș/ț/ă/î/â graphemes broken apart by character splitting.
 *
 * Non-string titles are returned untouched; callers may pass rich nodes.
 */
export function splitWords(text: ReactNode): ReactNode {
  if (typeof text !== 'string') return text;

  const parts = typo(text).split(/([^\S  ]+)/);
  let wordIndex = 0;

  return parts.map((part, i) => {
    if (part.length === 0) return null;
    if (/^[^\S  ]+$/.test(part)) return createElement(Fragment, { key: i }, part);
    const index = wordIndex++;
    return createElement(
      'span',
      { key: i, className: 'word', style: { '--i': index } as React.CSSProperties },
      part,
    );
  });
}
