import {
  Database,
  Zap,
  Server,
  Globe,
  Lock,
  Clock,
  Users,
  ShieldCheck,
  GitBranch,
  Layers,
  type LucideIcon,
} from "lucide-react";

const POINT_ICONS = {
  database: Database,
  cache: Zap,
  service: Server,
  network: Globe,
  lock: Lock,
  clock: Clock,
  users: Users,
  shield: ShieldCheck,
  branch: GitBranch,
  layers: Layers,
} satisfies Record<string, LucideIcon>;

interface PointProps {
  icon: keyof typeof POINT_ICONS;
  children: React.ReactNode;
}

export function Point({ icon, children }: PointProps) {
  const Icon = POINT_ICONS[icon];
  return (
    <div className="mt-2 flex items-start gap-2 first:mt-0" role="listitem">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <p className="text-foreground">{children}</p>
    </div>
  );
}
