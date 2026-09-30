'use client';

import type { ComponentType } from 'react';
import type { ApartmentViewProps } from '@/components/inventory/viewer/types';
import { typo } from '@/lib/text';
import { cn } from '@/lib/utils';
import styles from './plan.module.css';

/**
 * Where the 3D apartment viewer mounts — today a quiet "3D — скоро" plate.
 *
 * The 3D scene implements the SAME contract as the 2D plan
 * (`ApartmentViewProps`: apartment, locale, activeRoomId, onHoverRoom,
 * pinnedRoomId, onSelectRoom), so
 * PlanViewer's mode switch, the explication list and the room highlight work
 * unchanged. To switch it on (see docs/INVENTORY.md §4):
 *
 *   1. npm i three @react-three/fiber @react-three/drei
 *   2. src/components/inventory/viewer/3d/ApartmentScene3D.tsx — a client
 *      component that loads `apartment.model3D.src` (glb) and maps mesh names
 *      (`model3D.nodeId` / room ids) onto `activeRoomId` / `onHoverRoom`.
 *   3. Register it in `scenes` below as a lazy, client-only import, so
 *      three.js is downloaded only when a buyer actually picks 3D:
 *
 *        import dynamic from 'next/dynamic';
 *        const scenes = {
 *          apartment: dynamic(
 *            () => import('@/components/inventory/viewer/3d/ApartmentScene3D').then((m) => m.ApartmentScene3D),
 *            { ssr: false, loading: () => <Placeholder … /> },
 *          ),
 *        };
 *
 *   4. Give apartments a `model3D` ref in the inventory data. Apartments
 *      without one keep showing the plate below when 3D is picked.
 *
 * Nothing heavy is imported here today: no three.js, no canvas, no WebGL.
 */
const scenes: { apartment: ComponentType<ApartmentViewProps> | null } = { apartment: null };

export interface Model3DLabels {
  title: string;
  text: string;
  back: string;
}

export function Model3DSlot({
  labels,
  onBack,
  className,
  ...view
}: ApartmentViewProps & { labels: Model3DLabels; onBack: () => void; className?: string }) {
  const Scene = view.apartment.model3D ? scenes.apartment : null;
  if (Scene) return <Scene {...view} />;

  return (
    <div
      className={cn(
        styles.soon,
        'mx-auto flex aspect-[4/3] max-h-[min(58svh,36rem)] w-full max-w-xl flex-col items-center justify-center gap-6 px-6 text-center',
        className,
      )}
    >
      <span aria-hidden="true" className="h-10 w-px bg-accent/60" />
      <p className="font-display text-display-sm font-light text-balance text-ink">{labels.title}</p>
      <p className="max-w-[44ch] text-pretty text-sm leading-relaxed text-muted">{typo(labels.text)}</p>
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex min-h-11 items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink"
      >
        <span className="link-rule pb-1">{labels.back}</span>
      </button>
    </div>
  );
}
