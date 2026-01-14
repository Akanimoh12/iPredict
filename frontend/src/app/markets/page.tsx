'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  BarChart3,
  Search,
  Timer,
  CheckCircle,
  Bitcoin,
  Dumbbell,
  Landmark,
  Clapperboard,
  Cpu,
  LineChart,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  CircleDot,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LiveIndicator } from '@/components/live-indicator';
import { MarketCard, MarketCardSkeleton } from '@/components/market-card';
import { EmptyState } from '@/components/empty-state';
import { useMarkets } from '@/hooks/useContract';
import { getMarketStatus, cn } from '@/lib/utils';
import type { MarketFilter, MarketSort, Category } from '@/types';

// ===========================================
// Constants
// ===========================================

const FILTER_TABS: { value: MarketFilter; label: string; icon?: React.ReactNode }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live', icon: <span className="w-2 h-2 rounded-full bg-yes animate-pulse" /> },
  { value: 'ending-soon', label: 'Ending Soon', icon: <Timer className="h-3 w-3" /> },
  { value: 'resolved', label: 'Resolved', icon: <CheckCircle className="h-3 w-3" /> },
];

const CATEGORIES: { value: Category; label: string; icon: React.ElementType }[] = [
  { value: 'All', label: 'All', icon: CircleDot },
  { value: 'Crypto', label: 'Crypto', icon: Bitcoin },
  { value: 'Sports', label: 'Sports', icon: Dumbbell },
  { value: 'Politics', label: 'Politics', icon: Landmark },
  { value: 'Entertainment', label: 'Entertainment', icon: Clapperboard },
  { value: 'Tech', label: 'Tech', icon: Cpu },
  { value: 'Finance', label: 'Finance', icon: LineChart },
];

const SORT_OPTIONS: { value: MarketSort; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending-soon', label: 'Ending Soon' },
];

const MARKETS_PER_PAGE = 12;

// ===========================================
// Markets Page Component
// ===========================================

export default function MarketsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-based state
  const filter = (searchParams.get('filter') as MarketFilter) || 'all';
  const category = (searchParams.get('category') as Category) || 'All';
  const sort = (searchParams.get('sort') as MarketSort) || 'trending';
  const searchQuery = searchParams.get('q') || '';

  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [visibleCount, setVisibleCount] = useState(MARKETS_PER_PAGE);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch markets
  const { markets, isLoading, isError, refetch } = useMarkets(0, 100);

  // Update URL params
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === 'All' || value === 'trending') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // Handle search submit
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput || null });
  }, [searchInput, updateParams]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInput('');
    updateParams({ q: null });
  }, [updateParams]);

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    if (!markets) return [];

    let result = [...markets];

    // Filter by status
    if (filter !== 'all') {
      result = result.filter((market) => {
        const status = getMarketStatus(market);
        switch (filter) {
          case 'live':
            return status === 'live';
          case 'ending-soon':
            return status === 'ending-soon';
          case 'resolved':
            return status === 'resolved-yes' || status === 'resolved-no';
          default:
            return true;
        }
      });
    }

    // Filter by category
    if (category !== 'All') {
      result = result.filter((market) => market.category === category);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((market) =>
        market.question.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sort) {
      case 'volume':
        result.sort((a, b) => Number(b.totalPool - a.totalPool));
        break;
      case 'newest':
        result.sort((a, b) => Number(b.createdAt - a.createdAt));
        break;
      case 'ending-soon':
        result.sort((a, b) => Number(a.endTime - b.endTime));
        break;
      case 'trending':
      default:
        // Trending = combination of volume and recency
        result.sort((a, b) => {
          const aScore = Number(a.totalPool) * (1 / (Date.now() / 1000 - Number(a.createdAt) + 1));
          const bScore = Number(b.totalPool) * (1 / (Date.now() / 1000 - Number(b.createdAt) + 1));
          return bScore - aScore;
        });
        break;
    }

    return result;
  }, [markets, filter, category, searchQuery, sort]);

  // Paginated markets
  const visibleMarkets = filteredMarkets.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMarkets.length;

  // Load more
  const loadMore = () => {
    setVisibleCount((prev) => prev + MARKETS_PER_PAGE);
  };

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      {/* Page Header */}
      <div className="bg-card/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg gradient-injective flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold">MARKETS</h1>
                <LiveIndicator size="sm" />
              </div>
              <p className="text-muted-foreground text-sm">
                Browse and predict on live markets
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10 bg-secondary/50"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Mobile Filters Toggle */}
          <div className="flex md:hidden justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filter !== 'all' || category !== 'All') && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center gradient-injective text-xs">
                  {(filter !== 'all' ? 1 : 0) + (category !== 'All' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Sort'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => updateParams({ sort: option.value })}
                    className={cn(sort === option.value && 'bg-primary/10')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Filters */}
          <div className={cn(
            'flex-col md:flex-row gap-4 md:items-center md:justify-between',
            showMobileFilters ? 'flex' : 'hidden md:flex'
          )}>
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {FILTER_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={filter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ filter: tab.value })}
                  className={cn(
                    'gap-2 whitespace-nowrap',
                    filter === tab.value && 'gradient-injective'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Desktop Sort */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Sort'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => updateParams({ sort: option.value })}
                      className={cn(sort === option.value && 'bg-primary/10')}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Category Pills */}
          <div className={cn(
            'overflow-x-auto pb-2 scrollbar-hide',
            showMobileFilters ? 'block' : 'hidden md:block'
          )}>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.value;
                return (
                  <Button
                    key={cat.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => updateParams({ category: cat.value })}
                    className={cn(
                      'gap-2 whitespace-nowrap rounded-full border',
                      isActive
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filter !== 'all' || category !== 'All') && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: &quot;{searchQuery}&quot;
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {FILTER_TABS.find((t) => t.value === filter)?.label}
                <button onClick={() => updateParams({ filter: null })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {category !== 'All' && (
              <Badge variant="secondary" className="gap-1">
                {category}
                <button onClick={() => updateParams({ category: null })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('');
                updateParams({ q: null, filter: null, category: null, sort: null });
              }}
              className="text-xs h-6"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <div className="text-sm text-muted-foreground mb-4">
            {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'} found
          </div>
        )}

        {/* Market Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={BarChart3}
            title="Failed to load markets"
            description="There was an error loading the markets. Please try again."
            action={{
              label: 'Retry',
              onClick: () => refetch(),
            }}
          />
        ) : filteredMarkets.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No markets found"
            description={
              searchQuery
                ? `No markets match "${searchQuery}". Try a different search.`
                : 'No markets match your current filters.'
            }
            action={{
              label: 'Clear filters',
              onClick: () => {
                setSearchInput('');
                updateParams({ q: null, filter: null, category: null });
              },
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleMarkets.map((market) => (
                <MarketCard key={String(market.id)} market={market} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  className="gap-2"
                >
                  Load More
                  <Badge variant="secondary" className="ml-1">
                    {filteredMarkets.length - visibleCount} more
                  </Badge>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
