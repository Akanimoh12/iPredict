'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-secondary/50 rounded';

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, getVariantClasses())}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, getVariantClasses(), className)}
      style={style}
    />
  );
}

// Preset skeletons for common use cases
export function TextSkeleton({ lines = 1, className }: { lines?: number; className?: string }) {
  return <LoadingSkeleton variant="text" lines={lines} className={className} />;
}

export function AvatarSkeleton({ size = 40, className }: { size?: number; className?: string }) {
  return <LoadingSkeleton variant="circular" width={size} height={size} className={className} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-lg p-4 space-y-4', className)}>
      <LoadingSkeleton variant="rectangular" height={160} className="w-full" />
      <div className="flex justify-between">
        <LoadingSkeleton variant="text" width={60} height={20} />
        <LoadingSkeleton variant="text" width={80} height={20} />
      </div>
      <LoadingSkeleton variant="text" lines={2} className="h-5" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <LoadingSkeleton variant="text" width={50} height={16} />
          <LoadingSkeleton variant="text" width={50} height={16} />
        </div>
        <LoadingSkeleton variant="rectangular" height={8} className="w-full" />
      </div>
      <div className="flex justify-between">
        <LoadingSkeleton variant="text" width={70} height={16} />
        <LoadingSkeleton variant="text" width={70} height={16} />
      </div>
      <LoadingSkeleton variant="rectangular" height={36} className="w-full" />
    </div>
  );
}

// Grid of card skeletons
export function MarketGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
