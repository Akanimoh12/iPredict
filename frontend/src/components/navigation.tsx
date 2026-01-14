'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Trophy, 
  HelpCircle, 
  Home,
  User,
  Menu,
  X
} from 'lucide-react';
import { WalletButton } from '@/components/wallet-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/markets', label: 'Markets', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/#how-it-works', label: 'How It Works', icon: HelpCircle },
];

const mobileNavLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/markets', label: 'Markets', icon: BarChart3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-injective flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">i</span>
              </div>
              <span className="font-bold text-xl hidden sm:block">
                <span className="gradient-injective-text">iPredict</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link key={href} href={href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'gap-2 text-muted-foreground hover:text-foreground',
                        isActive && 'text-foreground bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet Button & Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <WalletButton />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-2 text-muted-foreground',
                        isActive && 'text-foreground bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-16">
          {mobileNavLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-colors',
                  isActive && 'text-primary'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
