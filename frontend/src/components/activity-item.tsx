'use client';

import { TrendingUp, TrendingDown, Trophy, ExternalLink } from 'lucide-react';
import { cn, formatAddress, formatINJ, formatRelativeTime, getExplorerUrl } from '@/lib/utils';

interface ActivityItemProps {
  type: 'bet' | 'claim';
  user: `0x${string}`;
  amount: bigint;
  isYes?: boolean;
  timestamp: number;
  txHash: `0x${string}`;
  marketQuestion?: string;
  className?: string;
  compact?: boolean;
}

export function ActivityItem({
  type,
  user,
  amount,
  isYes,
  timestamp,
  txHash,
  marketQuestion,
  className,
  compact = false,
}: ActivityItemProps) {
  const isBet = type === 'bet';

  if (compact) {
    return (
      <div className={cn(
        'flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors',
        className
      )}>
        <div className="flex items-center gap-2">
          {isBet ? (
            isYes ? (
              <TrendingUp className="h-4 w-4 text-yes" />
            ) : (
              <TrendingDown className="h-4 w-4 text-no" />
            )
          ) : (
            <Trophy className="h-4 w-4 text-gold" />
          )}
          <span className="font-mono text-sm">{formatAddress(user)}</span>
          <span className="text-muted-foreground">
            {isBet ? (isYes ? 'bet YES' : 'bet NO') : 'claimed'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'font-semibold',
            isBet ? (isYes ? 'text-yes' : 'text-no') : 'text-gold'
          )}>
            {formatINJ(amount)} INJ
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isBet 
            ? (isYes ? 'bg-yes/20' : 'bg-no/20') 
            : 'bg-gold/20'
        )}>
          {isBet ? (
            isYes ? (
              <TrendingUp className="h-5 w-5 text-yes" />
            ) : (
              <TrendingDown className="h-5 w-5 text-no" />
            )
          ) : (
            <Trophy className="h-5 w-5 text-gold" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{formatAddress(user)}</span>
            <span className="text-muted-foreground">
              {isBet ? (isYes ? 'predicted YES' : 'predicted NO') : 'claimed winnings'}
            </span>
          </div>
          {marketQuestion && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {marketQuestion}
            </p>
          )}
          <span className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(timestamp)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-bold text-lg',
          isBet ? (isYes ? 'text-yes' : 'text-no') : 'text-gold'
        )}>
          {formatINJ(amount)} INJ
        </span>
        <a
          href={getExplorerUrl('tx', txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
