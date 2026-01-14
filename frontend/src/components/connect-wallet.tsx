'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ConnectWalletPrompt({
  title = 'Connect Your Wallet',
  description = 'Connect your wallet to view your bets, stats, and make predictions.',
  className = '',
}: ConnectWalletPromptProps) {
  return (
    <Card className={`glass ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          {description}
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button 
              onClick={openConnectModal}
              className="gap-2 gradient-injective text-primary-foreground"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      </CardContent>
    </Card>
  );
}

interface ConnectionErrorProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function ConnectionError({ error, onRetry }: ConnectionErrorProps) {
  return (
    <Card className="glass border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
        <p className="text-muted-foreground text-sm mb-2 max-w-sm">
          {error?.message || 'Failed to connect to wallet. Please try again.'}
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Make sure you have MetaMask or another wallet installed.
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return fallback || <ConnectWalletPrompt />;
  }

  return <>{children}</>;
}
