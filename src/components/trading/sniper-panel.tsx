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
import { formatUsd, formatAmount } from '@/lib/format';

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
  const { botConfig, setBotConfig } = useTradingStore();

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
  
  // Risk Management settings
  const [positionSizingType, setPositionSizingType] = useState('fixed');
  const [maxPositionSize, setMaxPositionSize] = useState('1.0');
  const [minPositionSize, setMinPositionSize] = useState('0.01');
  const [maxDailyLoss, setMaxDailyLoss] = useState('0.5');
  const [maxDailyTrades, setMaxDailyTrades] = useState('10');
  const [maxOpenPositions, setMaxOpenPositions] = useState('5');
  const [cooldownPeriod, setCooldownPeriod] = useState('300');
  const [flashLoanDetection, setFlashLoanDetection] = useState(true);
  
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
  
  // Debounced save timer for auto-persisting settings
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Use refs to store latest state values for the save function (avoids stale closures)
  const stateRef = useRef({
    selectedChain,
    selectedDex,
    selectedBaseToken,
    buyTriggerTypes,
    buyTriggerValue,
    buyAmount,
    buySlippage,
    buyGasPrice,
    buyGasLimit,
    minLiquidity,
    maxBuyPrice,
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
    autoApprove,
    mevProtection,
    positionSizingType,
    maxPositionSize,
    minPositionSize,
    maxDailyLoss,
    maxDailyTrades,
    maxOpenPositions,
    cooldownPeriod,
    flashLoanDetection,
    autoSweepEnabled,
    sweepChains,
    sweepInterval,
  });

  // Keep refs updated with latest state
  useEffect(() => {
    stateRef.current = {
      selectedChain,
      selectedDex,
      selectedBaseToken,
      buyTriggerTypes,
      buyTriggerValue,
      buyAmount,
      buySlippage,
      buyGasPrice,
      buyGasLimit,
      minLiquidity,
      maxBuyPrice,
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
      autoApprove,
      mevProtection,
      positionSizingType,
      maxPositionSize,
      minPositionSize,
      maxDailyLoss,
      maxDailyTrades,
      maxOpenPositions,
      cooldownPeriod,
      flashLoanDetection,
      autoSweepEnabled,
      sweepChains,
      sweepInterval,
    };
  }, [selectedChain, selectedDex, selectedBaseToken, buyTriggerTypes, buyTriggerValue, buyAmount, buySlippage, buyGasPrice, buyGasLimit, minLiquidity, maxBuyPrice, sellSlippage, sellGasPrice, sellGasLimit, takeProfitEnabled, takeProfitPercent, takeProfitAmount, stopLossEnabled, stopLossPercent, stopLossType, trailingStopEnabled, trailingStopPercent, trailingStopActivation, autoApprove, mevProtection, positionSizingType, maxPositionSize, minPositionSize, maxDailyLoss, maxDailyTrades, maxOpenPositions, cooldownPeriod, flashLoanDetection, autoSweepEnabled, sweepChains, sweepInterval]);

  // Save settings to database - uses refs to avoid stale closures
  const saveSettingsToDatabase = useCallback(async () => {
    if (!botConfig?.id) return;
    
    const state = stateRef.current;
    setIsSaving(true);
    try {
      const response = await fetch('/api/bot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: state.selectedChain,
          exchange: state.selectedDex,
          baseToken: state.selectedBaseToken,
          buyTriggerType: state.buyTriggerTypes.join(','),
          buyTriggerValue: parseFloat(state.buyTriggerValue) || 5,
          buyAmount: parseFloat(state.buyAmount) || 0.1,
          buySlippage: parseFloat(state.buySlippage) || 5,
          buyGasPrice: parseFloat(state.buyGasPrice) || 0,
          buyGasLimit: parseInt(state.buyGasLimit) || 250000,
          minLiquidity: parseFloat(state.minLiquidity) || 100,
          maxBuyPrice: state.maxBuyPrice ? parseFloat(state.maxBuyPrice) : null,
          sellSlippage: parseFloat(state.sellSlippage) || 5,
          sellGasPrice: parseFloat(state.sellGasPrice) || 0,
          sellGasLimit: parseInt(state.sellGasLimit) || 250000,
          takeProfitEnabled: state.takeProfitEnabled,
          takeProfitPercent: parseFloat(state.takeProfitPercent) || 50,
          takeProfitAmount: parseFloat(state.takeProfitAmount) || 100,
          stopLossEnabled: state.stopLossEnabled,
          stopLossPercent: parseFloat(state.stopLossPercent) || 10,
          stopLossType: state.stopLossType,
          trailingStopEnabled: state.trailingStopEnabled,
          trailingStopPercent: parseFloat(state.trailingStopPercent) || 5,
          trailingStopActivation: parseFloat(state.trailingStopActivation) || 10,
          autoApprove: state.autoApprove,
          mevProtection: state.mevProtection,
          // Risk Management settings
          positionSizingType: state.positionSizingType,
          maxPositionSize: parseFloat(state.maxPositionSize) || 1.0,
          minPositionSize: parseFloat(state.minPositionSize) || 0.01,
          maxDailyLoss: parseFloat(state.maxDailyLoss) || 0.5,
          maxDailyTrades: parseInt(state.maxDailyTrades) || 10,
          maxOpenPositions: parseInt(state.maxOpenPositions) || 5,
          cooldownPeriod: parseInt(state.cooldownPeriod) || 300,
          flashLoanDetection: state.flashLoanDetection,
          // Auto-Sweep settings
          autoSweepEnabled: state.autoSweepEnabled,
          sweepChains: state.sweepChains.join(','),
          sweepInterval: parseInt(state.sweepInterval) || 30,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update the Zustand store so other components see the changes
          setBotConfig(data.data);
          console.log('✅ Settings saved to database');
        }
      } else {
        console.error('❌ Failed to save settings:', await response.text());
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [botConfig?.id, setBotConfig]);
  
  // Debounced save - saves 2 seconds after last change
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveSettingsToDatabase();
    }, 2000);
  }, [saveSettingsToDatabase]);
  
  // Helper to mark settings as modified and trigger debounced save
  const markModifiedAndSave = useCallback(() => {
    setUserModifiedSettings(true);
    debouncedSave();
  }, [debouncedSave]);

  // Helper function to validate and set default for numeric inputs on blur
  const handleNumericBlur = useCallback((
    value: string,
    setter: (val: string) => void,
    defaultValue: string,
    min?: number,
    max?: number
  ) => {
    if (value === '' || value === '-') {
      // If empty or just a minus sign, set to default
      setter(defaultValue);
      markModifiedAndSave();
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      setter(defaultValue);
      markModifiedAndSave();
      return;
    }
    // Apply min/max constraints
    let finalValue = num;
    if (min !== undefined && finalValue < min) finalValue = min;
    if (max !== undefined && finalValue > max) finalValue = max;
    setter(finalValue.toString());
    // Always save on blur, regardless of whether value was corrected
    markModifiedAndSave();
  }, [markModifiedAndSave]);

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
    markModifiedAndSave();
  }, [markModifiedAndSave]);

  // Helper to sync state from a config object
  const syncStateFromConfig = useCallback((config: typeof botConfig) => {
    if (!config) return;
    queueMicrotask(() => {
      if (config.network) setSelectedChain(config.network);
      if (config.exchange) setSelectedDex(config.exchange);
      if (config.baseToken) setSelectedBaseToken(config.baseToken);
      if (config.buyTriggerType) {
        const types = config.buyTriggerType.split(',').filter(Boolean);
        setBuyTriggerTypes(types.length > 0 ? types : ['liquidity_add']);
      }
      if (config.buyTriggerValue !== undefined) setBuyTriggerValue(config.buyTriggerValue.toString());
      if (config.buyAmount !== undefined) setBuyAmount(config.buyAmount.toString());
      if (config.buySlippage !== undefined) setBuySlippage(config.buySlippage.toString());
      if (config.buyGasPrice !== undefined) setBuyGasPrice(config.buyGasPrice.toString());
      if (config.buyGasLimit !== undefined) setBuyGasLimit(config.buyGasLimit.toString());
      if (config.minLiquidity !== undefined) setMinLiquidity(config.minLiquidity.toString());
      if (config.maxBuyPrice) setMaxBuyPrice(config.maxBuyPrice.toString());
      if (config.sellSlippage !== undefined) setSellSlippage(config.sellSlippage.toString());
      if (config.sellGasPrice !== undefined) setSellGasPrice(config.sellGasPrice.toString());
      if (config.sellGasLimit !== undefined) setSellGasLimit(config.sellGasLimit.toString());
      if (config.takeProfitEnabled !== undefined) setTakeProfitEnabled(config.takeProfitEnabled);
      if (config.takeProfitPercent !== undefined) setTakeProfitPercent(config.takeProfitPercent.toString());
      if (config.takeProfitAmount !== undefined) setTakeProfitAmount(config.takeProfitAmount.toString());
      if (config.stopLossEnabled !== undefined) setStopLossEnabled(config.stopLossEnabled);
      if (config.stopLossPercent !== undefined) setStopLossPercent(config.stopLossPercent.toString());
      if (config.stopLossType) setStopLossType(config.stopLossType);
      if (config.trailingStopEnabled !== undefined) setTrailingStopEnabled(config.trailingStopEnabled);
      if (config.trailingStopPercent !== undefined) setTrailingStopPercent(config.trailingStopPercent.toString());
      if (config.trailingStopActivation !== undefined) setTrailingStopActivation(config.trailingStopActivation.toString());
      if (config.autoApprove !== undefined) setAutoApprove(config.autoApprove);
      if (config.mevProtection !== undefined) setMevProtection(config.mevProtection);
      if (config.positionSizingType) setPositionSizingType(config.positionSizingType);
      if (config.maxPositionSize !== undefined) setMaxPositionSize(config.maxPositionSize.toString());
      if (config.minPositionSize !== undefined) setMinPositionSize(config.minPositionSize.toString());
      if (config.maxDailyLoss !== undefined) setMaxDailyLoss(config.maxDailyLoss.toString());
      if (config.maxDailyTrades !== undefined) setMaxDailyTrades(config.maxDailyTrades.toString());
      if (config.maxOpenPositions !== undefined) setMaxOpenPositions(config.maxOpenPositions.toString());
      if (config.cooldownPeriod !== undefined) setCooldownPeriod(config.cooldownPeriod.toString());
      if (config.flashLoanDetection !== undefined) setFlashLoanDetection(config.flashLoanDetection);
      if (config.targetToken) setTokenAddress(config.targetToken);
      if (config.autoSweepEnabled !== undefined) setAutoSweepEnabled(config.autoSweepEnabled);
      if (config.sweepChains) {
        const chains = config.sweepChains.split(',').filter(Boolean);
        setSweepChains(chains);
      }
      if (config.sweepInterval !== undefined) setSweepInterval(config.sweepInterval.toString());
      setUserModifiedSettings(false);
    });
  }, []);

  // Fetch fresh config from database and sync state
  const fetchAndSyncConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/bot');
      const data = await response.json();
      if (data.success && data.data) {
        setUserModifiedSettings(false);
        prevConfigIdRef.current = null;
        syncStateFromConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  }, [syncStateFromConfig]);

  // Initial load - fetch config on mount
  useEffect(() => {
    fetchAndSyncConfig();
  }, [fetchAndSyncConfig]);

  // Manual sync from botConfig - only when user clicks "Sync from Config" or on initial load
  const handleSyncFromConfig = useCallback(() => {
    if (!botConfig) return;
    syncStateFromConfig(botConfig);
  }, [botConfig, syncStateFromConfig]);

  // Initial sync from botConfig on first load only (backup method)
  useEffect(() => {
    if (botConfig && !prevConfigIdRef.current && !userModifiedSettings) {
      prevConfigIdRef.current = botConfig.id;
      handleSyncFromConfig();
    }
  }, [botConfig?.id, userModifiedSettings, handleSyncFromConfig]);

  // Re-sync settings when page becomes visible again (handles tab switching and navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any pending save to prevent conflicts
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        // Fetch and sync from database
        fetchAndSyncConfig();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAndSyncConfig]);

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
    markModifiedAndSave();
    const newDexes = getAvailableDexes(newChain);
    const newBaseTokens = getBaseTokens(newChain);
    
    if (newDexes.length > 0) setSelectedDex(newDexes[0]);
    if (newBaseTokens.length > 0) setSelectedBaseToken(newBaseTokens[0].symbol);
  }, [getAvailableDexes, getBaseTokens]);

  // Handle auto-sweep chain selection
  const handleSweepChainToggle = useCallback((chainKey: string) => {
    setSweepChains(prev => {
      const newChains = prev.includes(chainKey)
        ? prev.filter(c => c !== chainKey)
        : [...prev, chainKey];
      return newChains;
    });
    markModifiedAndSave();
  }, [markModifiedAndSave]);

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
              {isSaving && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">...</span>
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
                        markModifiedAndSave();
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
                      Insufficient balance on {selectedChain}. Available: {formatAmount(availableBalance, { decimals: 4 })} {currentBalance?.symbol || 'ETH'}
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
                  markModifiedAndSave();
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
              <Select value={selectedDex} onValueChange={(value) => { setSelectedDex(value); markModifiedAndSave(); }}>
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
            <Select value={selectedBaseToken} onValueChange={(value) => { setSelectedBaseToken(value); markModifiedAndSave(); }}>
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
              }}
              onBlur={() => {
                handleNumericBlur(buyAmount, setBuyAmount, '0.1', 0.001);
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
              }}
              onBlur={() => {
                handleNumericBlur(minLiquidity, setMinLiquidity, '100', 0);
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
                markModifiedAndSave();
              }} 
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">MEV Protection</Label>
            <Switch 
              checked={mevProtection} 
              onCheckedChange={(checked) => {
                setMevProtection(checked);
                markModifiedAndSave();
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
                  <p>Liquidity: {formatUsd(liquidityInfo.liquidityUsd)}</p>
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
                      checked={buyTriggerTypes.includes(trigger.value)}
                      className="mt-0.5 pointer-events-none"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <span className="text-xs font-medium leading-none cursor-pointer">
                        {trigger.label}
                      </span>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      value={buyTriggerValue}
                      onChange={(e) => {
                        setBuyTriggerValue(e.target.value);
                      }}
                      onBlur={() => {
                        handleNumericBlur(buyTriggerValue, setBuyTriggerValue, '5', 0.5, 50);
                      }}
                      className="w-16 h-8 text-center text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <Slider
                  value={[parseFloat(buyTriggerValue) || 0]}
                  onValueChange={([value]) => {
                    setBuyTriggerValue(value.toString());
                    markModifiedAndSave();
                  }}
                  max={50}
                  step={0.5}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values = more sensitive (more trades). Higher values = less sensitive (fewer trades).
                </p>
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
                  }}
                  onBlur={() => {
                    handleNumericBlur(buySlippage, setBuySlippage, '5', 0, 100);
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
                  }}
                  onBlur={() => {
                    handleNumericBlur(buyGasPrice, setBuyGasPrice, '0', 0);
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
                }}
                onBlur={() => {
                  handleNumericBlur(buyGasLimit, setBuyGasLimit, '250000', 21000);
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
                  }}
                  onBlur={() => {
                    handleNumericBlur(sellSlippage, setSellSlippage, '5', 0, 100);
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
                  }}
                  onBlur={() => {
                    handleNumericBlur(sellGasPrice, setSellGasPrice, '0', 0);
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
                    markModifiedAndSave();
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
                        }}
                        onBlur={() => {
                          handleNumericBlur(takeProfitPercent, setTakeProfitPercent, '50', 0);
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
                        }}
                        onBlur={() => {
                          handleNumericBlur(takeProfitAmount, setTakeProfitAmount, '100', 0, 100);
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
                        markModifiedAndSave();
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
                    markModifiedAndSave();
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
                        }}
                        onBlur={() => {
                          handleNumericBlur(stopLossPercent, setStopLossPercent, '10', 0);
                        }}
                        className="min-h-[44px] sm:min-h-0 sm:h-8"
                        placeholder="Enter %"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stop Type</Label>
                      <Select value={stopLossType} onValueChange={(value) => {
                        setStopLossType(value);
                        markModifiedAndSave();
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
                        markModifiedAndSave();
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
                    markModifiedAndSave();
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
                        }}
                        onBlur={() => {
                          handleNumericBlur(trailingStopPercent, setTrailingStopPercent, '5', 0);
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
                        }}
                        onBlur={() => {
                          handleNumericBlur(trailingStopActivation, setTrailingStopActivation, '10', 0);
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
                        markModifiedAndSave();
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
            {/* Position Sizing */}
            <div className="space-y-2">
              <Label className="text-xs">Position Sizing</Label>
              <Select value={positionSizingType} onValueChange={(value) => { setPositionSizingType(value); markModifiedAndSave(); }}>
                <SelectTrigger className="min-h-[44px] sm:min-h-0 sm:h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Portfolio %</SelectItem>
                  <SelectItem value="kelly">Kelly Criterion</SelectItem>
                  <SelectItem value="risk_parity">Risk Parity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max Position</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={maxPositionSize}
                  onChange={(e) => { setMaxPositionSize(e.target.value); }}
                  onBlur={() => { handleNumericBlur(maxPositionSize, setMaxPositionSize, '1.0', 0.001); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Position</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={minPositionSize}
                  onChange={(e) => { setMinPositionSize(e.target.value); }}
                  onBlur={() => { handleNumericBlur(minPositionSize, setMinPositionSize, '0.01', 0); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max Daily Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={maxDailyLoss}
                  onChange={(e) => { setMaxDailyLoss(e.target.value); }}
                  onBlur={() => { handleNumericBlur(maxDailyLoss, setMaxDailyLoss, '0.5', 0); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Daily Trades</Label>
                <Input
                  type="number"
                  value={maxDailyTrades}
                  onChange={(e) => { setMaxDailyTrades(e.target.value); }}
                  onBlur={() => { handleNumericBlur(maxDailyTrades, setMaxDailyTrades, '10', 1, 1000); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Max Positions</Label>
                <Input
                  type="number"
                  value={maxOpenPositions}
                  onChange={(e) => { setMaxOpenPositions(e.target.value); }}
                  onBlur={() => { handleNumericBlur(maxOpenPositions, setMaxOpenPositions, '5', 1, 100); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cooldown (sec)</Label>
                <Input
                  type="number"
                  value={cooldownPeriod}
                  onChange={(e) => { setCooldownPeriod(e.target.value); }}
                  onBlur={() => { handleNumericBlur(cooldownPeriod, setCooldownPeriod, '300', 0); }}
                  className="min-h-[44px] sm:min-h-0 sm:h-8"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">MEV Protection</Label>
              <Switch 
                checked={mevProtection} 
                onCheckedChange={(checked) => {
                  setMevProtection(checked);
                  markModifiedAndSave();
                }} 
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">Flash Loan Detection</Label>
              <Switch 
                checked={flashLoanDetection} 
                onCheckedChange={(checked) => {
                  setFlashLoanDetection(checked);
                  markModifiedAndSave();
                }} 
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs sm:text-sm">Auto-Approve</Label>
              <Switch 
                checked={autoApprove} 
                onCheckedChange={(checked) => {
                  setAutoApprove(checked);
                  markModifiedAndSave();
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
                onCheckedChange={(checked) => {
                  setAutoSweepEnabled(checked);
                  markModifiedAndSave();
                }}
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
                            className="pointer-events-none"
                          />
                          <span className="text-xs cursor-pointer">{getChainName(chainKey)}</span>
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
                    onChange={(e) => {
                      setSweepInterval(e.target.value);
                    }}
                    onBlur={() => {
                      handleNumericBlur(sweepInterval, setSweepInterval, '30', 5, 3600);
                    }}
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
