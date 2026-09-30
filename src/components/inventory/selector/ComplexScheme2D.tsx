'use client';

import { useId, useMemo } from 'react';
import type { FocusEvent, HTMLAttributes, KeyboardEvent, PointerEvent, SVGProps } from 'react';
import type { Building } from '@/lib/inventory/types';
import type { ComplexViewProps } from '../viewer/types';
import { complexGeometry } from './ComplexGeometry';
import { ComplexDrawing, type ComplexDrawingLabels } from './ComplexDrawing';
import { useRise } from './ComplexRise';

export interface ComplexSchemeLabels extends Omit<ComplexDrawingLabels, 'names'> {
  /** Building id → accessible name with its numbers ("Блок 3. Этажность: 10. Доступно: 24 из 64…"). */
  zones: Record<string, string>;
}

/**
 * Step 1 — the complex as an axonometric 2D scheme (implements ComplexViewProps).
 *
 * Each building is a volume extruded from its footprint (floorsCount ×
 * storeyHeight) and a focusable button; its name pin is a pointer target too.
 * Hover (mouse only) and keyboard focus preview a building through
 * `onHoverBuilding`; a click, tap or Enter calls `onSelectBuilding` — the
 * step decides whether that selects or navigates.
 * The volumes rise out of the ground the first time the scheme is on screen.
 *
 * A Three.js scene can replace this component later with the same props.
 */
export function ComplexScheme2D({
  inventory,
  locale,
  activeBuildingId = null,
  selectedBuildingId = null,
  onHoverBuilding,
  onSelectBuilding,
  labels,
  className,
}: ComplexViewProps & {
  /** Selected (pressed) building, when it differs from the highlighted one. */
  selectedBuildingId?: string | null;
  labels: ComplexSchemeLabels;
  className?: string;
}) {
  const geometry = useMemo(() => complexGeometry(inventory), [inventory]);
  const names = useMemo(
    () => Object.fromEntries(inventory.buildings.map((b) => [b.id, b.name[locale]])),
    [inventory, locale],
  );
  const idPrefix = `cx${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { ref, rise } = useRise<HTMLDivElement>();

  const zoneProps = (b: Building): SVGProps<SVGGElement> => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': labels.zones[b.id] ?? b.name[locale],
    'aria-pressed': selectedBuildingId === b.id,
    onPointerEnter: (e: PointerEvent<SVGGElement>) => {
      if (e.pointerType === 'mouse') onHoverBuilding?.(b.id);
    },
    onPointerLeave: (e: PointerEvent<SVGGElement>) => {
      if (e.pointerType === 'mouse') onHoverBuilding?.(null);
    },
    // Preview on keyboard focus only. A tap also focuses the zone (just
    // before its click); previewing then would make the step read the tap
    // as a second one and skip the "first tap selects" stage.
    onFocus: (e: FocusEvent<SVGGElement>) => {
      if (keyboardFocus(e.currentTarget)) onHoverBuilding?.(b.id);
    },
    onBlur: () => onHoverBuilding?.(null),
    onClick: () => onSelectBuilding(b.id),
    onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectBuilding(b.id);
      }
    },
  });

  // The name pins above the roofs answer the pointer like their volumes.
  const pinProps = (b: Building): HTMLAttributes<HTMLSpanElement> => ({
    onPointerEnter: (e: PointerEvent<HTMLSpanElement>) => {
      if (e.pointerType === 'mouse') onHoverBuilding?.(b.id);
    },
    onPointerLeave: (e: PointerEvent<HTMLSpanElement>) => {
      if (e.pointerType === 'mouse') onHoverBuilding?.(null);
    },
    onClick: () => onSelectBuilding(b.id),
  });

  return (
    <div ref={ref} className={className}>
      <ComplexDrawing
        geometry={geometry}
        labels={{ ...labels, names }}
        idPrefix={idPrefix}
        activeId={activeBuildingId}
        selectedId={selectedBuildingId}
        rise={rise}
        zoneProps={zoneProps}
        pinProps={pinProps}
      />
    </div>
  );
}

/** Focus that came from the keyboard (false where :focus-visible is unsupported). */
function keyboardFocus(el: Element) {
  try {
    return el.matches(':focus-visible');
  } catch {
    return false;
  }
}
