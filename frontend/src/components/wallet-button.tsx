'use client';

import { useState } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut, 
  User, 
  Trophy,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserStats } from '@/hooks/useContract';
import { formatAddress, formatINJ, getExplorerUrl } from '@/lib/utils';
import Link from 'next/link';

export function WalletButton() {
  const { address, isConnecting, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({ 
    address,
    query: { enabled: !!address }
  });
  const { stats: userStats } = useUserStats(address);
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show connecting state
  if (isConnecting) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // Show connect button when not connected
  if (!isConnected || !address) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <Button 
            onClick={openConnectModal}
            className="gap-2 gradient-injective text-primary-foreground hover:opacity-90"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </ConnectButton.Custom>
    );
  }

  // Format balance
  const formattedBalance = balance 
    ? formatINJ(balance.value)
    : '0.00';

  // Format points
  const points = userStats?.totalPoints 
    ? Number(userStats.totalPoints)
    : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-border hover:border-primary/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yes animate-pulse" />
            <span className="font-mono text-sm">{formatAddress(address)}</span>
          </div>
          {!balanceLoading && (
            <span className="text-muted-foreground text-sm">
              {formattedBalance} INJ
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card border-border">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(address, 6)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        {/* Balance */}
        <div className="px-2 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-sm font-semibold gradient-injective-text">
              {balanceLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                `${formattedBalance} INJ`
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Points</span>
            <span className="text-sm font-semibold text-gold flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {points.toLocaleString()}
            </span>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-border" />
        
        {/* Actions */}
        <DropdownMenuItem 
          onClick={copyAddress}
          className="cursor-pointer hover:bg-secondary"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-yes" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer hover:bg-secondary">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href={getExplorerUrl('address', address)}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:bg-secondary"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={() => disconnect()}
          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
