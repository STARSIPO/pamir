'use client';

import { useEffect, useRef } from 'react';

export type InputKind = 'mouse' | 'pen' | 'touch' | 'keyboard';

/**
 * The kind of input behind the user's latest interaction, kept in a ref (no
 * re-render). The selector steps branch on it: a mouse click or Enter opens
 * the next step at once; a finger's first tap only selects and shows an info
 * bar with an explicit action button — there is no hover on touch screens.
 */
export function useLastInput() {
  const last = useRef<InputKind>('mouse');
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      last.current = e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse';
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') last.current = 'keyboard';
    };
    window.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
    window.addEventListener('keydown', onKey, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer, { capture: true });
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, []);
  return last;
}

/** Pointer types that can hover (hover cards and hover sync only for these). */
export const canHover = (pointerType: string) => pointerType === 'mouse' || pointerType === 'pen';

/**
 * Focus that should read as "hover" (side tag, hover card): keyboard focus
 * only. A tap or a click also focuses a tabIndex'd zone, but that focus is not
 * :focus-visible — treating it as a hover would leave a card stuck on a touch
 * screen, where no pointer position exists to place it.
 */
export function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    // Engines without :focus-visible: keep the old behaviour.
    return true;
  }
}

/**
 * Which drawing each input gets. A hover-capable pointer from md up gets the
 * wide drawing (long elevation, landscape plan) with hover cards; touch
 * screens and narrow windows get the tall one, where every storey or
 * apartment stays a ≥ 44 px tap target. Full class strings, so Tailwind
 * sees them.
 */
export const wideOnly = 'hidden md:[@media(hover:hover)]:block';
export const tallOnly = 'md:[@media(hover:hover)]:hidden';
export const wideOnlyInline = 'hidden md:[@media(hover:hover)]:inline';
