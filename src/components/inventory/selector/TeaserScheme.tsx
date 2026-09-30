'use client';

import { useMemo } from 'react';
import type { ProjectInventory } from '@/lib/inventory/types';
import { complexGeometry } from './ComplexGeometry';
import { ComplexDrawing, type ComplexDrawingLabels } from './ComplexDrawing';
import { useRise } from './ComplexRise';

/**
 * The complex scheme as a picture (project-page teaser): the same drawing as
 * step 1, not interactive, its volumes rising the first time it scrolls in.
 * `inventory` only needs the site and the buildings.
 */
export function TeaserScheme({
  inventory,
  labels,
  idPrefix,
}: {
  inventory: ProjectInventory;
  labels: ComplexDrawingLabels;
  idPrefix: string;
}) {
  const geometry = useMemo(() => complexGeometry(inventory), [inventory]);
  const { ref, rise } = useRise<HTMLDivElement>();
  return (
    <div ref={ref}>
      <ComplexDrawing geometry={geometry} labels={labels} idPrefix={idPrefix} rise={rise} />
    </div>
  );
}
