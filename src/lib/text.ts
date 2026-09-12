import { Fragment, type ReactNode } from 'react';
import { createElement } from 'react';

/**
 * Wrap each word of a heading in `<span class="word" style="--i: n">` so CSS can
 * stagger them in.
 *
 * Runs on the server: the complete heading ships in the HTML, so crawlers and
 * screen readers get ordinary text and no reflow happens when Manrope swaps in.
 * Whitespace is preserved as real text nodes between the spans, which keeps the
 * accessible name identical to the source string.
 *
 * Splits by WORD, never by character — RU and RO text would have Cyrillic and
 * ș/ț/ă/î/â graphemes broken apart by character splitting.
 *
 * Non-string titles are returned untouched; callers may pass rich nodes.
 */
export function splitWords(text: ReactNode): ReactNode {
  if (typeof text !== 'string') return text;

  const parts = text.split(/(\s+)/);
  let wordIndex = 0;

  return parts.map((part, i) => {
    if (part.length === 0) return null;
    if (/^\s+$/.test(part)) return createElement(Fragment, { key: i }, part);
    const index = wordIndex++;
    return createElement(
      'span',
      { key: i, className: 'word', style: { '--i': index } as React.CSSProperties },
      part,
    );
  });
}
