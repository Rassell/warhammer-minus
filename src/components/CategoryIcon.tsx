import {
  Bug,
  Brush,
  Cog,
  Crown,
  Crosshair,
  Dices,
  Flame,
  Mountain,
  Shield,
  Sparkles,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CategoryIconKey } from "~/types";

const ICONS: Record<CategoryIconKey, LucideIcon> = {
  sparkles: Sparkles,
  brush: Brush,
  shield: Shield,
  flame: Flame,
  bug: Bug,
  crown: Crown,
  mountain: Mountain,
  truck: Truck,
  dice: Dices,
  crosshair: Crosshair,
  cog: Cog,
};

interface CategoryIconProps {
  icon: CategoryIconKey;
  className?: string;
}

export default function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
}
