import {
  Activity,
  Baby,
  Blocks,
  Building2,
  Bus,
  Cctv,
  Clock,
  Flame,
  Handshake,
  HardHat,
  Landmark,
  Layers,
  LockKeyhole,
  Ruler,
  Scale,
  School,
  ShieldCheck,
  Sprout,
  SquareParking,
  Store,
  Thermometer,
  Trees,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Semantic key → line icon. Keys are used across content data files. */
const map: Record<string, LucideIcon> = {
  seismic: Activity,
  'warm-floor': Thermometer,
  heating: Flame,
  mortgage: Landmark,
  'closed-yard': LockKeyhole,
  video: Cctv,
  parking: SquareParking,
  playground: Blocks,
  garden: Sprout,
  store: Store,
  kindergarten: Baby,
  school: School,
  park: Trees,
  transport: Bus,
  facade: Building2,
  insulation: Layers,
  building: Building2,
  'hard-hat': HardHat,
  wrench: Wrench,
  ruler: Ruler,
  trees: Trees,
  wallet: Wallet,
  handshake: Handshake,
  scale: Scale,
  'shield-check': ShieldCheck,
  layers: Layers,
  clock: Clock,
};

export function FeatureIcon({
  name,
  className,
  strokeWidth = 1.5,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = map[name] ?? ShieldCheck;
  return <Icon className={cn('h-6 w-6', className)} strokeWidth={strokeWidth} aria-hidden="true" />;
}
