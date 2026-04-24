import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { VerificationStatus } from '@/lib/verificationTypes';
import { VERIFICATION_LABEL, VERIFICATION_DESCRIPTION } from '@/lib/verificationTypes';

interface VerificationBadgeProps {
  status: VerificationStatus;
  confidence?: number | null;
  notes?: string | null;
  size?: 'sm' | 'md';
}

const CONFIG: Record<
  VerificationStatus,
  { icon: React.ElementType; classes: string; dot: string }
> = {
  unverified: {
    icon: ShieldOff,
    classes: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
  },
  pending: {
    icon: Clock,
    classes: 'bg-amber-50 text-amber-600 border-amber-200',
    dot: 'bg-amber-400 animate-pulse',
  },
  auto_verified: {
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  needs_review: {
    icon: AlertTriangle,
    classes: 'bg-orange-50 text-orange-600 border-orange-200',
    dot: 'bg-orange-400',
  },
  rejected: {
    icon: XCircle,
    classes: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
  manual_verified: {
    icon: ShieldCheck,
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
};

export const VerificationBadge = ({
  status,
  confidence,
  notes,
  size = 'sm',
}: VerificationBadgeProps) => {
  const cfg = CONFIG[status] ?? CONFIG['unverified'];
  const Icon = cfg.icon;
  const label = VERIFICATION_LABEL[status];
  const description = VERIFICATION_DESCRIPTION[status];

  const tooltipContent = (
    <div className="max-w-[220px] space-y-1">
      <p className="font-semibold text-xs">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {confidence != null && (
        <p className="text-xs text-muted-foreground">Confidence: {confidence}%</p>
      )}
      {notes && (
        <p className="text-xs text-muted-foreground border-t pt-1 mt-1">{notes}</p>
      )}
    </div>
  );

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.classes} ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : ''
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {label}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipContent}</TooltipContent>
    </Tooltip>
  );
};
