'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Bitcoin,
  Dumbbell,
  Landmark,
  Clapperboard,
  Cpu,
  LineChart,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { CountdownTimer } from '@/components/countdown-timer';
import { cn, formatINJ, getMarketStatus } from '@/lib/utils';
import type { MarketWithOdds } from '@/types';

interface MarketCardProps {
  market: MarketWithOdds;
  className?: string;
}

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  Crypto: Bitcoin,
  Sports: Dumbbell,
  Politics: Landmark,
  Entertainment: Clapperboard,
  Tech: Cpu,
  Finance: LineChart,
};

export function MarketCard({ market, className }: MarketCardProps) {
  const status = getMarketStatus(market);
  const CategoryIcon = categoryIcons[market.category] || CircleDot;
  const totalPool = market.totalYesBets + market.totalNoBets;

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className={cn(
        'glass hover:glow-primary transition-all duration-300 h-full',
        'hover:-translate-y-1 cursor-pointer group',
        className
      )}>
        {/* Market Image */}
        {market.imageUrl && (
          <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
            <Image
              src={market.imageUrl}
              alt={market.question}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        <CardHeader className={cn(!market.imageUrl && 'pt-6')}>
          <div className="flex justify-between items-start gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
              <CategoryIcon className="h-3 w-3" />
              {market.category}
            </Badge>
            <StatusBadge status={status} />
          </div>
          <h3 className="font-semibold text-lg leading-tight mt-3 line-clamp-2 group-hover:text-primary transition-colors">
            {market.question}
          </h3>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Odds Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-yes flex items-center gap-1 font-medium">
                <TrendingUp className="h-4 w-4" /> YES {market.yesPercent}%
              </span>
              <span className="text-no flex items-center gap-1 font-medium">
                NO {market.noPercent}% <TrendingDown className="h-4 w-4" />
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
              <div 
                className="bg-yes h-full transition-all duration-500" 
                style={{ width: `${market.yesPercent}%` }} 
              />
              <div 
                className="bg-no h-full transition-all duration-500" 
                style={{ width: `${market.noPercent}%` }} 
              />
            </div>
          </div>

          {/* Pool and Timer */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              <span>{formatINJ(totalPool)} INJ</span>
            </div>
            <CountdownTimer endTime={market.endTime} compact showIcon />
          </div>

          {/* View Button */}
          <Button 
            variant="secondary" 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            View Market
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

// Loading skeleton for market card
export function MarketCardSkeleton() {
  return (
    <Card className="glass h-full">
      <div className="h-40 w-full bg-secondary/50 rounded-t-lg animate-pulse" />
      <CardHeader>
        <div className="flex justify-between">
          <div className="h-5 w-16 bg-secondary/50 rounded animate-pulse" />
          <div className="h-5 w-20 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="h-6 w-full bg-secondary/50 rounded animate-pulse mt-3" />
        <div className="h-6 w-3/4 bg-secondary/50 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-secondary/50 rounded animate-pulse" />
            <div className="h-4 w-16 bg-secondary/50 rounded animate-pulse" />
          </div>
          <div className="h-2 w-full bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
          <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-secondary/50 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
