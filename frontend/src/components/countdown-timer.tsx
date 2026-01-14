'use client';

import { useState, useEffect } from 'react';
import { Timer, AlertCircle } from 'lucide-react';
import { cn, getTimeRemaining } from '@/lib/utils';

interface CountdownTimerProps {
  endTime: bigint;
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

export function CountdownTimer({ 
  endTime, 
  className, 
  showIcon = true,
  compact = false 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.isExpired) {
    return (
      <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
        {showIcon && <AlertCircle className="h-4 w-4" />}
        <span>Ended</span>
      </div>
    );
  }

  const isUrgent = timeLeft.total < 3600; // Less than 1 hour

  if (compact) {
    let display = '';
    if (timeLeft.days > 0) {
      display = `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      display = `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else {
      display = `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    return (
      <div className={cn(
        'flex items-center gap-1.5',
        isUrgent ? 'text-gold' : 'text-muted-foreground',
        className
      )}>
        {showIcon && <Timer className={cn('h-4 w-4', isUrgent && 'animate-pulse')} />}
        <span className={cn(isUrgent && 'font-semibold')}>{display}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3',
      isUrgent && 'text-gold',
      className
    )}>
      {showIcon && <Timer className={cn('h-5 w-5', isUrgent && 'animate-pulse')} />}
      <div className="flex gap-2 text-center">
        {timeLeft.days > 0 && (
          <div className="flex flex-col">
            <span className="text-2xl font-bold tabular-nums">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground uppercase">Days</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground uppercase">Hours</span>
        </div>
        <span className="text-2xl font-bold">:</span>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground uppercase">Min</span>
        </div>
        {!timeLeft.days && (
          <>
            <span className="text-2xl font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tabular-nums">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground uppercase">Sec</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
