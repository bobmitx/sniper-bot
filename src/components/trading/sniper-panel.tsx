'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSniperService, SniperTarget } from '@/hooks/use-sniper-service';
import { useTradingStore } from '@/store/trading-store';
import { useWalletBalances, getBalanceForChain, hasEnoughBalance, formatBalance, SUPPORTED_CHAINS } from '@/hooks/use-wallet-balances';
import { useAccount } from 'wagmi';
import { chainConfigs, ChainName } from '@/lib/chain-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Crosshair,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Droplets,
  Target,
  Zap,
  Clock,
  Eye,
  StopCircle,
  Trash2,
  Radio,
  Layers,
  TrendingUp,
  TrendingDown,
  Shield,
  Download,
  Wallet,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

export function SniperPanel() {
  const {
    connected,
    targets,
    events,
    config,
    lastVerifiedToken,
    lastLiquidityInfo,
    verifyToken,
    checkLiquidity,
    addTarget,
    cancelTarget,
    getTargets,
    configureAutoSweep,
  } = useSniperService();

  // Get botConfig from trading store for synchronization
  const { botConfig } = useTradingStore();

  // Wallet connection and balances
  const { isConnected: walletConnected, address } = useAccount();
  const { balances, isLoading: isLoadingBalances, refetch: refetchBalances } = useWalletBalances();

  // Form state - initialize with defaults
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [selectedDex, setSelectedDex] = useState<string>('uniswap');
  const [selectedBaseToken, setSelectedBaseToken] = useState<string>('WETH');
  
  // Buy settings - multi-select trigger types
  const [buyTriggerTypes, setBuyTriggerTypes] = useState<string[]>(['liquidity_add', 'new_pair']);
  const [buyTriggerValue, setBuyTriggerValue] = useState('5');
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [buySlippage, setBuySlippage] = useState('5');
  const [buyGasPrice, setBuyGasPrice] = useState('0');
  const [buyGasLimit, setBuyGasLimit] = useState('250000');
  
  // Sell settings - fully editable
  const [sellSlippage, setSellSlippage] = useState('5');
  const [sellGasPrice, setSellGasPrice] = useState('0');
  const [sellGasLimit, setSellGasLimit] = useState('250000');
  
  // Take Profit settings
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [takeProfitPercent, setTakeProfitPercent] = useState('50');
  const [takeProfitAmount, setTakeProfitAmount] = useState('100');
  
  // Stop Loss settings
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossPercent, setStopLossPercent] = useState('10');
  const [stopLossType, setStopLossType] = useState('fixed');
  
  // Trailing Stop settings
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState('5');
  const [trailingStopActivation, setTrailingStopActivation] = useState('10');
  
  // Sniper-specific settings
  const [minLiquidity, setMinLiquidity] = useState('100');
  const [maxBuyPrice, setMaxBuyPrice] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);
  const [mevProtection, setMevProtection] = useState(true);
  
  // Auto-sweep mode
  const [autoSweepEnabled, setAutoSweepEnabled] = useState(false);
  const [sweepChains, setSweepChains] = useState<string[]>([]);
  const [sweepInterval, setSweepInterval] = useState('30');

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [checkingLiquidity, setCheckingLiquidity] = useState(false);
  
  // Derived state from hook
  const verifiedToken = lastVerifiedToken;
  const liquidityInfo = lastLiquidityInfo;

  // Track if user has manually modified settings (to prevent auto-sync overwriting)
  const [userModifiedSettings, setUserModifiedSettings] = useState(false);
  
  // Track previous config id to avoid unnecessary syncs
  const prevConfigIdRef = useRef<string | null>(null);
  
  // Toggle trigger type selection (multi-select)
  const handleTriggerTypeToggle = useCallback((type: string) => {
    setBuyTriggerTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
    setUserModifiedSettings(true);
  }, []);
  
  // Manual sync from botConfig - only when user clicks "Sync from Config" or on initial load
  const handleSyncFromConfig = useCallback(() => {
    if (!botConfig) return;
    
    queueMicrotask(() => {
      if (botConfig.network) setSelectedChain(botConfig.network);
      if (botConfig.exchange) setSelectedDex(botConfig.exchange);
      if (botConfig.baseToken) setSelectedBaseToken(botConfig.baseToken);
      if (botConfig.buyTriggerType) setBuyTriggerTypes([botConfig.buyTriggerType]);
      if (botConfig.buyTriggerValue) setBuyTriggerValue(botConfig.buyTriggerValue.toString());
      if (botConfig.buyAmount) setBuyAmount(botConfig.buyAmount.toString());
      if (botConfig.buySlippage) setBuySlippage(botConfig.buySlippage.toString());
      if (botConfig.buyGasPrice) setBuyGasPrice(botConfig.buyGasPrice.toString());
      if (botConfig.buyGasLimit) setBuyGasLimit(botConfig.buyGasLimit.toString());
      if (botConfig.sellSlippage) setSellSlippage(botConfig.sellSlippage.toString());
      if (botConfig.sellGasPrice) setSellGasPrice(botConfig.sellGasPrice.toString());
      if (botConfig.sellGasLimit) setSellGasLimit(botConfig.sellGasLimit.toString());
      if (botConfig.takeProfitEnabled !== undefined) setTakeProfitEnabled(botConfig.takeProfitEnabled);
      if (botConfig.takeProfitPercent) setTakeProfitPercent(botConfig.takeProfitPercent.toString());
      if (botConfig.takeProfitAmount) setTakeProfitAmount(botConfig.takeProfitAmount.toString());
      if (botConfig.stopLossEnabled !== undefined) setStopLossEnabled(botConfig.stopLossEnabled);
      if (botConfig.stopLossPercent) setStopLossPercent(botConfig.stopLossPercent.toString());
      if (botConfig.stopLossType) setStopLossType(botConfig.stopLossType);
      if (botConfig.trailingStopEnabled !== undefined) setTrailingStopEnabled(botConfig.trailingStopEnabled);
      if (botConfig.trailingStopPercent) setTrailingStopPercent(botConfig.trailingStopPercent.toString());
      if (botConfig.trailingStopActivation) setTrailingStopActivation(botConfig.trailingStopActivation.toString());
      if (botConfig.autoApprove !== undefined) setAutoApprove(botConfig.autoApprove);
      if (botConfig.mevProtection !== undefined) setMevProtection(botConfig.mevProtection);
      if (botConfig.targetToken) setTokenAddress(botConfig.targetToken);
      setUserModifiedSettings(false);
    });
  }, [botConfig]);
  
  // Initial sync from botConfig on first load only
  useEffect(() => {
    if (botConfig && !prevConfigIdRef.current && !userModifiedSettings) {
      prevConfigIdRef.current = botConfig.id;
      handleSyncFromConfig();
    }
  }, [botConfig?.id, userModifiedSettings, handleSyncFromConfig]);

  // Get available DEXes for selected chain from chain config
  const getAvailableDexes = useCallback((chain: string) => {
    const chainConfig = chainConfigs[chain as ChainName];
    if (chainConfig && 'dexes' in chainConfig && chainConfig.dexes) {
      return chainConfig.dexes;
    }
    return ['uniswap'];
  }, []);

  // Get base tokens for selected chain
  const getBaseTokens = useCallback((chain: string) => {
    const chainConfig = chainConfigs[chain as ChainName];
    return chainConfig?.baseTokens || [{ symbol: 'WETH', address: '' }];
  }, []);

  // Get chain display name
  const getChainName = useCallback((chainKey: string) => {
    const chainConfig = chainConfigs[chainKey as ChainName];
    return chainConfig?.name || chainKey;
  }, []);

  // Get available DEXes and base tokens
  const availableDexes = useMemo(() => getAvailableDexes(selectedChain), [selectedChain, getAvailableDexes]);
  const availableBaseTokens = useMemo(() => getBaseTokens(selectedChain), [selectedChain, getBaseTokens]);
  const defaultBaseToken = availableBaseTokens[0]?.symbol || 'WETH';

  // Handle chain change - reset DEX and base token if needed
  const handleChainChange = useCallback((newChain: string) => {
    setSelectedChain(newChain);
    setUserModifiedSettings(true);
    const newDexes = getAvailableDexes(newChain);
    const newBaseTokens = getBaseTokens(newChain);
    
    if (newDexes.length > 0) setSelectedDex(newDexes[0]);
    if (newBaseTokens.length > 0) setSelectedBaseToken(newBaseTokens[0].symbol);
  }, [getAvailableDexes, getBaseTokens]);

  // Handle auto-sweep chain selection
  const handleSweepChainToggle = useCallback((chainKey: string) => {
    setSweepChains(prev => 
      prev.includes(chainKey)
        ? prev.filter(c => c !== chainKey)
        : [...prev, chainKey]
    );
  }, []);

  // Handle token verification
  const handleVerifyToken = useCallback(() => {
    if (!tokenAddress || tokenAddress.length < 10) return;
    
    setVerifying(true);
    verifyToken(tokenAddress, selectedChain);
    setTimeout(() => setVerifying(false), 5000);
  }, [tokenAddress, selectedChain, verifyToken]);

  // Handle liquidity check
  const handleCheckLiquidity = useCallback(() => {
    if (!tokenAddress || !verifiedToken) return;
    
    setCheckingLiquidity(true);
    checkLiquidity({
      tokenAddress,
      baseToken: selectedBaseToken,
      chain: selectedChain,
      dex: selectedDex,
    });
    setTimeout(() => setCheckingLiquidity(false), 5000);
  }, [tokenAddress, verifiedToken, selectedBaseToken, selectedChain, selectedDex, checkLiquidity]);

  // Handle add sniper target
  const handleAddTarget = useCallback(() => {
    if (!tokenAddress || !verifiedToken) return;

    addTarget({
      tokenAddress,
      tokenSymbol: verifiedToken.symbol,
      tokenName: verifiedToken.name,
      chain: selectedChain,
      dex: selectedDex,
      baseToken: selectedBaseToken,
      buyAmount,
      maxBuyPrice: maxBuyPrice || undefined,
      minLiquidity: minLiquidity || undefined,
      autoApprove,
      // Buy settings - convert array to string for backend compatibility
      buyTriggerType: buyTriggerTypes.join(','),
      buyTriggerValue,
      buySlippage,
      buyGasPrice,
      buyGasLimit,
      // Sell settings
      sellSlippage,
      sellGasPrice,
      sellGasLimit,
      // Take Profit
      takeProfitEnabled,
      takeProfitPercent,
      takeProfitAmount,
      // Stop Loss
      stopLossEnabled,
      stopLossPercent,
      stopLossType,
      // Trailing Stop
      trailingStopEnabled,
      trailingStopPercent,
      trailingStopActivation,
    });

    // Reset token address only, keep all other settings
    setTokenAddress('');
  }, [tokenAddress, verifiedToken, selectedChain, selectedDex, selectedBaseToken, buyAmount, maxBuyPrice, minLiquidity, autoApprove, buyTriggerTypes, buyTriggerValue, buySlippage, buyGasPrice, buyGasLimit, sellSlippage, sellGasPrice, sellGasLimit, takeProfitEnabled, takeProfitPercent, takeProfitAmount, stopLossEnabled, stopLossPercent, stopLossType, trailingStopEnabled, trailingStopPercent, trailingStopActivation, addTarget]);

  // Handle auto-sweep start - passes all current sniper settings
  const handleStartAutoSweep = useCallback(() => {
    if (sweepChains.length === 0) return;
    
    // Store all current settings to use for each chain
    const currentSettings = {
      buyAmount,
      buyTriggerType: buyTriggerTypes.join(','),
      buyTriggerValue,
      buySlippage,
      buyGasPrice,
      buyGasLimit,
      sellSlippage,
      sellGasPrice,
      sellGasLimit,
      takeProfitEnabled,
      takeProfitPercent,
      takeProfitAmount,
      stopLossEnabled,
      stopLossPercent,
      stopLossType,
      trailingStopEnabled,
      trailingStopPercent,
      trailingStopActivation,
      minLiquidity,
      autoApprove,
    };
    
    sweepChains.forEach(chain => {
      const chainConfig = chainConfigs[chain as ChainName];
      if (chainConfig && chainConfig.dexes.length > 0) {
        addTarget({
          tokenAddress: 'SWEEP_MODE',
          tokenSymbol: 'AUTO-SWEEP',
          tokenName: 'Auto Sweep Mode',
          chain,
          dex: chainConfig.dexes[0],
          baseToken: chainConfig.baseTokens[0]?.symbol || 'WETH',
          // Pass all current settings
          ...currentSettings,
        });
      }
    });
    
    // Also configure the backend auto-sweep
    configureAutoSweep({
      enabled: true,
      chains: sweepChains,
      interval: parseInt(sweepInterval) || 30,
    });
  }, [sweepChains, buyAmount, buyTriggerTypes, buyTriggerValue, buySlippage, buyGasPrice, buyGasLimit, sellSlippage, sellGasPrice, sellGasLimit, takeProfitEnabled, takeProfitPercent, takeProfitAmount, stopLossEnabled, stopLossPercent, stopLossType, trailingStopEnabled, trailingStopPercent, trailingStopActivation, minLiquidity, autoApprove, sweepInterval, addTarget, configureAutoSweep]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    getTargets();
  }, [getTargets]);

  // Get status badge variant
  const getStatusBadge = (status: SniperTarget['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'monitoring': return 'default';
      case 'sniping': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: SniperTarget['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'monitoring': return <Eye className="h-3 w-3" />;
      case 'sniping': return <Zap className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      case 'cancelled': return <StopCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Get all chains from config
  const allChains = Object.keys(chainConfigs);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Connection Status */}
      <Card className="md:col-span-2">
        <CardContent className="pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Crosshair className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Sniper Service</span>
              <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
                {connected ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Connected</span>
                    <span className="sm:hidden">On</span>
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Disconnected</span>
                    <span className="sm:hidden">Off</span>
                  </>
                )}
              </Badge>
              {botConfig?.isActive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  <Zap className="mr-1 h-3 w-3 animate-pulse" />
                  <span className="hidden sm:inline">Bot Active</span>
                  <span className="sm:hidden">Active</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {botConfig && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSyncFromConfig} 
                  title="Sync settings from Configuration page"
                  className="min-h-[44px] sm:min-h-0"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sync Config</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="min-h-[44px] sm:min-h-0"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balances - Multi-Chain */}
      {walletConnected && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Wallet className="h-4 w-4" />
                Wallet Balances
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetchBalances()}
                disabled={isLoadingBalances}
                className="min-h-[44px] sm:min-h-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription className="text-xs">
              Your balances across all supported chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[140px] sm:h-[120px]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {SUPPORTED_CHAINS.map((chain) => {
                  const balance = getBalanceForChain(balances, chain.name);
                  const isSelected = selectedChain === chain.name;
                  const hasBalance = balance && parseFloat(balance.balanceFormatted) > 0;
                  
                  return (
                    <div
                      key={chain.id}
                      className={`p-2 sm:p-2 rounded-lg border cursor-pointer transition-all min-h-[56px] sm:min-h-0 ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : hasBalance 
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10' 
                            : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedChain(chain.name);
                        setUserModifiedSettings(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium capitalize truncate max-w-[60px] sm:max-w-none">{chain.name}</span>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-sm font-bold">
                        {isLoadingBalances ? (
                          <span className="text-muted-foreground">...</span>
                        ) : balance ? (
                          <span className={hasBalance ? 'text-green-500' : 'text-muted-foreground'}>
                            {formatBalance(balance.balanceFormatted, 4)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0.00</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{chain.symbol}</div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Selected chain balance warning */}
            {(() => {
              const currentBalance = getBalanceForChain(balances, selectedChain);
              const buyAmountNum = parseFloat(buyAmount) || 0;
              const availableBalance = currentBalance ? parseFloat(currentBalance.balanceFormatted) : 0;
              
              if (buyAmountNum > 0 && availableBalance < buyAmountNum) {
                return (
                  <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-yellow-500">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      Insufficient balance on {selectedChain}. Available: {availableBalance.toFixed(4)} {currentBalance?.symbol || 'ETH'}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Wallet Not Connected Warning */}
      {!walletConnected && (
        <Card className="md:col-span-2 border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-3 sm:pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm sm:text-base text-yellow-500">Wallet Not Connected</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Connect your wallet to view balances and execute trades across multiple chains.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Target */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Sniper Target
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure auto-snipe for a new token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Token Address */}
          <div className="space-y-2">
            <Label htmlFor="sniperTokenAddress" className="text-sm">Token Address</Label>
            <div className="flex gap-2">
              <Input
                id="sniperTokenAddress"
                placeholder="0x... or Solana address"
                value={tokenAddress}
                onChange={(e) => {
                  setTokenAddress(e.target.value);
                  setUserModifiedSettings(true);
                }}
                className={`min-h-[44px] sm:min-h-0 ${verifiedToken ? 'border-green-500' : ''}`}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleVerifyToken}
                disabled={verifying || !tokenAddress}
                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              >
                {verifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {verifiedToken && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle className="h-4 w-4" />
                <span>{verifiedToken.name} ({verifiedToken.symbol})</span>
                {verifiedToken.warnings && verifiedToken.warnings.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                )}
              </div>
            )}
            
            {verifiedToken?.warnings && verifiedToken.warnings.length > 0 && (
              <div className="text-xs text-yellow-600 mt-1">
                {verifiedToken.warnings.map((w, i) => (
                  <div key={i}>⚠️ {w}</div>
                ))}
              </div>
            )}
          </div>

          {/* Chain & DEX Selection */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Chain</Label>
              <Select value={selectedChain} onValueChange={handleChainChange}>
                <SelectTrigger className="min-h-[44px] sm:min-h-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allChains.map((chainKey) => (
                    <SelectItem key={chainKey} value={chainKey}>
                      {getChainName(chainKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">DEX</Label>
              <Select value={selectedDex} onValueChange={setSelectedDex}>
                <SelectTrigger className="min-h-[44px] sm:min-h-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableDexes.map((dex) => (
                    <SelectItem key={dex} value={dex}>
                      {dex.charAt(0).toUpperCase() + dex.slice(1).replace(/-/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Base Token */}
          <div className="space-y-2">
            <Label className="text-sm">Base Token</Label>
            <Select value={selectedBaseToken} onValueChange={setSelectedBaseToken}>
              <SelectTrigger className="min-h-[44px] sm:min-h-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBaseTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buy Amount */}
          <div className="space-y-2">
            <Label htmlFor="buyAmount" className="text-sm">Buy Amount</Label>
            <Input
              id="buyAmount"
              type="number"
              step="0.001"
              value={buyAmount}
              onChange={(e) => {
                setBuyAmount(e.target.value);
                setUserModifiedSettings(true);
              }}
              className="min-h-[44px] sm:min-h-0"
            />
            <p className="text-xs text-muted-foreground">Amount in {defaultBaseToken}</p>
          </div>

          {/* Min Liquidity */}
          <div className="space-y-2">
            <Label htmlFor="minLiquidity" className="text-sm">Min Liquidity (USD)</Label>
            <Input
              id="minLiquidity"
              type="number"
              value={minLiquidity}
              onChange={(e) => {
                setMinLiquidity(e.target.value);
                setUserModifiedSettings(true);
              }}
              className="min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Auto Approve & MEV */}
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Auto Approve Token</Label>
            <Switch 
              checked={autoApprove} 
              onCheckedChange={(checked) => {
                setAutoApprove(checked);
                setUserModifiedSettings(true);
              }} 
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">MEV Protection</Label>
            <Switch 
              checked={mevProtection} 
              onCheckedChange={(checked) => {
                setMevProtection(checked);
                setUserModifiedSettings(true);
              }} 
            />
          </div>

          {/* Check Liquidity Button */}
          <Button
            variant="outline"
            className="w-full min-h-[44px] sm:min-h-0"
            onClick={handleCheckLiquidity}
            disabled={!verifiedToken || checkingLiquidity}
          >
            {checkingLiquidity ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Droplets className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Check Liquidity</span>
            <span className="sm:hidden">Check Liq.</span>
          </Button>

          {/* Liquidity Info */}
          {liquidityInfo && (
            <Alert>
              <Droplets className="h-4 w-4" />
              <AlertTitle>Liquidity Detected</AlertTitle>
              <AlertDescription>
                <div className="text-sm">
                  <p>Pair: {liquidityInfo.pairAddress.slice(0, 10)}...</p>
                  <p>Liquidity: ${liquidityInfo.liquidityUsd.toFixed(2)}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Start Sniping Button */}
          <Button
            className="w-full min-h-[44px] sm:min-h-0 bg-green-600 hover:bg-green-700"
            onClick={handleAddTarget}
            disabled={!verifiedToken || !connected}
          >
            <Crosshair className="mr-2 h-4 w-4" />
            Start Sniping
          </Button>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <div className="space-y-3 sm:space-y-4">
        {/* Buy Settings */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Buy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Buy Trigger Types - Multi-select */}
            <div className="space-y-2">
              <Label className="text-xs">Buy Trigger Types</Label>
              <p className="text-xs text-muted-foreground mb-2">Select multiple triggers for enhanced bot activity</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'price_drop', label: 'Price Drop', desc: 'Buy on significant price decrease' },
                  { value: 'volume_spike', label: 'Volume Spike', desc: 'Buy on unusual volume increase' },
                  { value: 'liquidity_add', label: 'Liquidity Added', desc: 'Buy when liquidity is added' },
                  { value: 'new_pair', label: 'New Pair', desc: 'Buy on new trading pair detection' },
                  { value: 'manual', label: 'Manual Only', desc: 'Only buy on manual trigger' },
                ].map((trigger) => (
                  <div
                    key={trigger.value}
                    className={`flex items-start space-x-2 p-2 rounded-lg border transition-colors cursor-pointer min-h-[60px] sm:min-h-0 ${
                      buyTriggerTypes.includes(trigger.value)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    onClick={() => handleTriggerTypeToggle(trigger.value)}
                  >
                    <Checkbox
                      id={`trigger-${trigger.value}`}
                      checked={buyTriggerTypes.includes(trigger.value)}
                      onCheckedChange={() => handleTriggerTypeToggle(trigger.value)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={`trigger-${trigger.value}`}
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {trigger.label}
                      </label>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{trigger.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              {buyTriggerTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Active:</span>
                  {buyTriggerTypes.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Trigger Value - show if not only manual */}
            {!buyTriggerTypes.includes('manual') && buyTriggerTypes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Trigger Sensitivity</Label>
                  <span className="text-xs text-muted-foreground">{buyTriggerValue}%</span>
                </div>
                <Slider
                  value={[parseFloat(buyTriggerValue) || 0]}
                  onValueChange={([value]) => {
                    setBuyTriggerValue(value.toString());
                    setUserModifiedSettings(true);
                  }}
                  max={50}
                  step={0.5}
                  className="h-2"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Slippage (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={buySlippage}
                  onChange={(e) => {
                    setBuySlippage(e.target.value);
                    setUserModifiedSettings(true);
                  }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gas Price (Gwei)</Label>
                <Input
                  type="number"
                  value={buyGasPrice}
                  onChange={(e) => {
                    setBuyGasPrice(e.target.value);
                    setUserModifiedSettings(true);
                  }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gas Limit</Label>
              <Input
                type="number"
                value={buyGasLimit}
                onChange={(e) => {
                  setBuyGasLimit(e.target.value);
                  setUserModifiedSettings(true);
                }}
                className="min-h-[44px] sm:min-h-0 sm:h-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sell Settings - Fully Editable */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Sell Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Slippage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Slippage (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={sellSlippage}
                  onChange={(e) => {
                    setSellSlippage(e.target.value);
                    setUserModifiedSettings(true);
                  }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gas Price (Gwei)</Label>
                <Input
                  type="number"
                  value={sellGasPrice}
                  onChange={(e) => {
                    setSellGasPrice(e.target.value);
                    setUserModifiedSettings(true);
                  }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
            </div>

            <Separator />

            {/* Take Profit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm font-medium">Take Profit</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">Auto-sell at profit target</p>
                </div>
                <Switch
                  checked={takeProfitEnabled}
                  onCheckedChange={(checked) => {
                    setTakeProfitEnabled(checked);
                    setUserModifiedSettings(true);
                  }}
                />
              </div>
              {takeProfitEnabled && (
                <div className="space-y-3 pl-2 border-l-2 border-green-500/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Take Profit %</Label>
                      <Input
                        type="number"
                        step="1"
                        value={takeProfitPercent}
                        onChange={(e) => {
                          setTakeProfitPercent(e.target.value);
                          setUserModifiedSettings(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="Enter %"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sell Amount %</Label>
                      <Input
                        type="number"
                        step="1"
                        value={takeProfitAmount}
                        onChange={(e) => {
                          setTakeProfitAmount(e.target.value);
                          setUserModifiedSettings(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">TP: {takeProfitPercent}%</Label>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Quick adjust</span>
                    </div>
                    <Slider
                      value={[parseFloat(takeProfitPercent) || 0]}
                      onValueChange={([value]) => {
                        setTakeProfitPercent(value.toString());
                        setUserModifiedSettings(true);
                      }}
                      max={10000}
                      step={1}
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Stop Loss */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm font-medium">Stop Loss</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">Auto-sell at loss limit</p>
                </div>
                <Switch
                  checked={stopLossEnabled}
                  onCheckedChange={(checked) => {
                    setStopLossEnabled(checked);
                    setUserModifiedSettings(true);
                  }}
                />
              </div>
              {stopLossEnabled && (
                <div className="space-y-3 pl-2 border-l-2 border-red-500/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Stop Loss %</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={stopLossPercent}
                        onChange={(e) => {
                          setStopLossPercent(e.target.value);
                          setUserModifiedSettings(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="Enter %"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stop Type</Label>
                      <Select value={stopLossType} onValueChange={(value) => {
                        setStopLossType(value);
                        setUserModifiedSettings(true);
                      }}>
                        <SelectTrigger className="min-h-[44px] sm:min-h-0 sm:h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="trailing">Trailing</SelectItem>
                          <SelectItem value="dynamic">Dynamic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">SL: {stopLossPercent}%</Label>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Quick adjust</span>
                    </div>
                    <Slider
                      value={[parseFloat(stopLossPercent) || 0]}
                      onValueChange={([value]) => {
                        setStopLossPercent(value.toString());
                        setUserModifiedSettings(true);
                      }}
                      max={10000}
                      step={0.5}
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Trailing Stop */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs sm:text-sm font-medium">Trailing Stop</Label>
                  <p className="text-xs text-muted-foreground hidden sm:block">Follow price movements</p>
                </div>
                <Switch
                  checked={trailingStopEnabled}
                  onCheckedChange={(checked) => {
                    setTrailingStopEnabled(checked);
                    setUserModifiedSettings(true);
                  }}
                />
              </div>
              {trailingStopEnabled && (
                <div className="space-y-3 pl-2 border-l-2 border-blue-500/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Trail Distance %</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={trailingStopPercent}
                        onChange={(e) => {
                          setTrailingStopPercent(e.target.value);
                          setUserModifiedSettings(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="Enter %"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Activation %</Label>
                      <Input
                        type="number"
                        step="1"
                        value={trailingStopActivation}
                        onChange={(e) => {
                          setTrailingStopActivation(e.target.value);
                          setUserModifiedSettings(true);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="Enter %"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Trail: {trailingStopPercent}%</Label>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Quick adjust</span>
                    </div>
                    <Slider
                      value={[parseFloat(trailingStopPercent) || 0]}
                      onValueChange={([value]) => {
                        setTrailingStopPercent(value.toString());
                        setUserModifiedSettings(true);
                      }}
                      max={10000}
                      step={0.5}
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Shield className="h-4 w-4 text-blue-500" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">MEV Protection</Label>
              <Switch 
                checked={mevProtection} 
                onCheckedChange={(checked) => {
                  setMevProtection(checked);
                  setUserModifiedSettings(true);
                }} 
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">Auto-Approve</Label>
              <Switch 
                checked={autoApprove} 
                onCheckedChange={(checked) => {
                  setAutoApprove(checked);
                  setUserModifiedSettings(true);
                }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-Sweep Mode */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Radio className="h-4 w-4" />
              Auto-Sweep Mode
            </CardTitle>
            <CardDescription className="text-xs">
              Monitor multiple chains automatically with current settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">Enable Auto-Sweep</Label>
              <Switch
                checked={autoSweepEnabled}
                onCheckedChange={setAutoSweepEnabled}
              />
            </div>

            {autoSweepEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Select Chains</Label>
                  <ScrollArea className="h-[120px] rounded-md border p-2">
                    <div className="space-y-1">
                      {allChains.map((chainKey) => (
                        <div
                          key={chainKey}
                          className="flex items-center space-x-2 p-1.5 sm:p-1 hover:bg-muted/50 rounded cursor-pointer min-h-[44px] sm:min-h-0"
                          onClick={() => handleSweepChainToggle(chainKey)}
                        >
                          <Checkbox
                            checked={sweepChains.includes(chainKey)}
                            onCheckedChange={() => handleSweepChainToggle(chainKey)}
                          />
                          <Label className="text-xs cursor-pointer">{getChainName(chainKey)}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Check Interval (sec)</Label>
                  <Input
                    type="number"
                    value={sweepInterval}
                    onChange={(e) => setSweepInterval(e.target.value)}
                    className="min-h-[44px] sm:min-h-0 sm:h-8"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-0"
                  onClick={handleStartAutoSweep}
                  disabled={!connected || sweepChains.length === 0}
                >
                  <Layers className="mr-2 h-3 w-3" />
                  Start Auto-Sweep ({sweepChains.length} chains)
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Targets */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Eye className="h-4 w-4" />
              Active Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              {targets.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm">
                  No active targets
                </div>
              ) : (
                <div className="space-y-2">
                  {targets.map((target) => (
                    <div
                      key={target.id}
                      className="rounded-lg border p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {target.tokenSymbol || 'Unknown'}
                          </span>
                          <Badge variant={getStatusBadge(target.status)} className="text-xs">
                            {getStatusIcon(target.status)}
                            <span className="ml-1 capitalize hidden sm:inline">{target.status}</span>
                          </Badge>
                        </div>
                        {(target.status === 'monitoring' || target.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-5 sm:w-5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                            onClick={() => cancelTarget(target.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span className="capitalize truncate max-w-[80px] sm:max-w-none">{target.chain}</span>
                        <span>{target.buyAmount} {target.baseToken}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Zap className="h-4 w-4" />
            Sniper Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                No events yet
              </div>
            ) : (
              <div className="space-y-1">
                {events.slice(0, 20).map((event, index) => (
                  <div
                    key={`${event.type}-${index}`}
                    className={`flex items-center gap-2 p-1.5 sm:p-2 rounded text-xs sm:text-sm min-h-[44px] sm:min-h-0 ${
                      event.type.includes('failed') || event.type.includes('error')
                        ? 'bg-red-500/10'
                        : event.type.includes('completed')
                        ? 'bg-green-500/10'
                        : 'bg-muted'
                    }`}
                  >
                    {event.type.includes('completed') ? (
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : event.type.includes('failed') || event.type.includes('error') ? (
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    ) : (
                      <Zap className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="capitalize text-xs truncate">{event.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
