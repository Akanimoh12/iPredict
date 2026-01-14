'use client';

import { Timer, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarketStatus } from '@/types';

interface StatusBadgeProps {
  status: MarketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs: Record<MarketStatus, {
    label: string;
    icon: React.ReactNode;
    className: string;
  }> = {
    'live': {
      label: 'LIVE',
      icon: <span className="w-2 h-2 rounded-full bg-yes animate-pulse" />,
      className: 'bg-yes/20 text-yes border-yes/50',
    },
    'ending-soon': {
      label: 'ENDING SOON',
      icon: <Timer className="h-3 w-3" />,
      className: 'bg-gold/20 text-gold border-gold/50',
    },
    'ended': {
      label: 'ENDED',
      icon: <Timer className="h-3 w-3" />,
      className: 'bg-muted text-muted-foreground border-muted',
    },
    'resolved-yes': {
      label: 'RESOLVED YES',
      icon: <CheckCircle className="h-3 w-3" />,
      className: 'bg-yes/20 text-yes border-yes/50',
    },
    'resolved-no': {
      label: 'RESOLVED NO',
      icon: <XCircle className="h-3 w-3" />,
      className: 'bg-no/20 text-no border-no/50',
    },
    'cancelled': {
      label: 'CANCELLED',
      icon: <Ban className="h-3 w-3" />,
      className: 'bg-muted text-muted-foreground border-muted',
    },
  };

  const config = configs[status];

  return (
    <Badge 
      variant="outline" 
      className={cn('flex items-center gap-1.5', config.className, className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
