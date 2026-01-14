'use client';

import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function LiveIndicator({ 
  className, 
  size = 'md', 
  showText = true 
}: LiveIndicatorProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span 
        className={cn(
          'rounded-full bg-yes animate-pulse',
          dotSizes[size]
        )} 
      />
      {showText && (
        <span className={cn('font-semibold text-yes', textSizes[size])}>
          LIVE
        </span>
      )}
    </div>
  );
}
