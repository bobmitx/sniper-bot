'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Shield,
  Lock,
  Key,
  Info,
} from 'lucide-react';
import { chainIdToName, nativeCurrencySymbols, nameToChainId } from '@/components/providers';
import { useTradingStore } from '@/store/trading-store';
import { formatUnits } from 'viem';

export function WalletConnection() {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  
  const { botConfig, setBotConfig } = useTradingStore();
  const [copied, setCopied] = useState(false);
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Update bot config when chain changes
  useEffect(() => {
    if (chain && botConfig) {
      const chainName = chainIdToName[chain.id];
      if (chainName && chainName !== botConfig.network) {
        setBotConfig({ ...botConfig, network: chainName });
      }
    }
  }, [chain, botConfig, setBotConfig]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getExplorerUrl = () => {
    if (!address || !chain) return '#';
    const explorers: Record<number, string> = {
      1: `https://etherscan.io/address/${address}`,
      137: `https://polygonscan.com/address/${address}`,
      10: `https://optimistic.etherscan.io/address/${address}`,
      42161: `https://arbiscan.io/address/${address}`,
      8453: `https://basescan.org/address/${address}`,
      43114: `https://snowtrace.io/address/${address}`,
      250: `https://ftmscan.com/address/${address}`,
      56: `https://bscscan.com/address/${address}`,
      369: `https://scan.pulsechain.com/address/${address}`,
    };
    return explorers[chain.id] || '#';
  };

  // Switch to the network configured in bot settings
  const switchToConfiguredNetwork = async () => {
    if (botConfig?.network) {
      const chainId = nameToChainId[botConfig.network];
      if (chainId) {
        switchChain({ chainId });
      }
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to start trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your wallet is only used for signing transactions. We never store your private keys.
            </AlertDescription>
          </Alert>
          
          <Button onClick={openConnectModal} className="w-full min-h-[44px] sm:min-h-0" size="lg">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
          
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Recommended Wallets</AlertTitle>
            <AlertDescription className="text-sm">
              <p className="mt-1"><strong>Browser Extensions (Best):</strong></p>
              <ul className="list-disc list-inside ml-2 text-xs mt-1">
                <li>MetaMask - Most compatible</li>
                <li>Rabby - Great security features</li>
                <li>Brave Wallet - Built into Brave browser</li>
              </ul>
              <p className="mt-2"><strong>Note:</strong> WalletConnect may show "Connection reset" errors in some environments. If you experience issues, please use a browser extension wallet instead.</p>
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">All Supported Wallets:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>MetaMask (Recommended)</li>
              <li>Rabby (Recommended)</li>
              <li>Brave Wallet</li>
              <li>Trust Wallet Extension</li>
              <li>OKX Wallet</li>
              <li>Rainbow</li>
              <li>WalletConnect (Mobile)</li>
              <li>Ledger (Hardware)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCorrectNetwork = chain && botConfig?.network && 
    chainIdToName[chain.id] === botConfig.network;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Manage your connected wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        {chain && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="font-medium text-sm sm:text-base">{chain.name}</span>
            </div>
            {!isCorrectNetwork && botConfig?.network && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={switchToConfiguredNetwork}
                disabled={isSwitchingChain}
                className="min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Switch to {botConfig.network}</span>
                <span className="sm:hidden">Switch</span>
              </Button>
            )}
          </div>
        )}
        {/* Address & Balance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            <p className="text-sm text-muted-foreground">Address</p>
            <div className="flex items-center gap-2">
              <code className="text-sm">{formatAddress(address!)}</code>
              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8" onClick={copyAddress}>
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <a href={getExplorerUrl()} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-1">
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-bold text-base sm:text-lg">
              {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.0000'} 
              {balance?.symbol || chain ? ` ${nativeCurrencySymbols[chain?.id || 1]}` : ''}
            </p>
          </div>
        </div>

        {/* Wallet Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full min-h-[44px] sm:min-h-0">
              <Wallet className="mr-2 h-4 w-4" />
              {formatAddress(address!)}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(getExplorerUrl(), '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => disconnect()} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Security Settings */}
        <div className="space-y-3 sm:space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between py-2 sm:py-0">
            <div className="space-y-0.5 flex-1">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Lock className="h-4 w-4" />
                Auto-approve Spending
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically approve token spending
              </p>
            </div>
            <div className="p-2 sm:p-0 -mr-2 sm:mr-0">
              <Switch
                checked={botConfig?.autoApprove || false}
                onCheckedChange={(checked) => {
                  if (botConfig) {
                    setBotConfig({ ...botConfig, autoApprove: checked });
                  }
                }}
                className="scale-110 sm:scale-100"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 sm:py-0">
            <div className="space-y-0.5 flex-1">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Shield className="h-4 w-4" />
                MEV Protection
              </Label>
              <p className="text-xs text-muted-foreground">
                Protect against MEV attacks
              </p>
            </div>
            <div className="p-2 sm:p-0 -mr-2 sm:mr-0">
              <Switch
                checked={botConfig?.mevProtection || false}
                onCheckedChange={(checked) => {
                  if (botConfig) {
                    setBotConfig({ ...botConfig, mevProtection: checked });
                  }
                }}
                className="scale-110 sm:scale-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 sm:py-0">
            <div className="space-y-0.5 flex-1">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4" />
                Flash Loan Detection
              </Label>
              <p className="text-xs text-muted-foreground">
                Detect potential flash loan attacks
              </p>
            </div>
            <div className="p-2 sm:p-0 -mr-2 sm:mr-0">
              <Switch
                checked={botConfig?.flashLoanDetection || false}
                onCheckedChange={(checked) => {
                  if (botConfig) {
                    setBotConfig({ ...botConfig, flashLoanDetection: checked });
                  }
                }}
                className="scale-110 sm:scale-100"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
