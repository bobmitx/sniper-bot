'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { WalletConnection } from '@/components/wallet/wallet-connection';
import { chainConfigs, getPopularTokensForChain, type ChainName } from '@/lib/chain-config';

// Dynamic import for socket.io-client to avoid SSR issues
type SocketType = {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
  connected: boolean;
};

// Client-side only time display to avoid hydration mismatch
function LiveTime() {
  const [time, setTime] = useState<string>('--:--:--');
  
  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return <span>{time}</span>;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Settings,
  BarChart3,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Target,
  Shield,
  RefreshCw,
  Play,
  Square,
  Bot,
  LineChart,
  History,
  Bell,
  Crosshair,
  HelpCircle,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Search,
  Info,
} from 'lucide-react';
import { SniperPanel } from '@/components/trading/sniper-panel';
import { DocumentationPanel } from '@/components/trading/documentation-panel';
import { ThemeToggleCompact } from '@/components/theme-toggle';

export function TradingDashboard() {
  const socketRef = useRef<SocketType | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenSearchResults, setTokenSearchResults] = useState<Array<{symbol: string; name: string; address: string}>>([]);
  const [isSearchingTokens, setIsSearchingTokens] = useState(false);
  const [showRpcSuggestions, setShowRpcSuggestions] = useState(false);
  // Track local input values for better UX (allows typing before saving)
  const [localInputValues, setLocalInputValues] = useState<Record<string, string>>({});
  const {
    botConfig,
    isLoadingConfig,
    trades,
    positions,
    prices,
    activityLogs,
    wsConnected,
    isBotStarting,
    setBotConfig,
    setTrades,
    setPositions,
    setPrice,
    addActivityLog,
    setWsConnected,
    setIsBotStarting,
    setIsLoadingConfig,
    setIsLoadingPositions,
    updatePosition,
  } = useTradingStore();
  
  // Get base tokens for current network
  const currentBaseTokens = useMemo(() => {
    const network = botConfig?.network || 'ethereum';
    return chainConfigs[network as ChainName]?.baseTokens || [{ symbol: 'WETH', address: '' }];
  }, [botConfig?.network]);
  
  // Get RPC URLs for current network
  const currentRpcUrls = useMemo(() => {
    const network = botConfig?.network || 'ethereum';
    return chainConfigs[network as ChainName]?.rpcUrls || [];
  }, [botConfig?.network]);
  
  // Get native token symbol for current network (e.g., ETH, PLS, MATIC, BNB, SOL)
  const nativeTokenSymbol = useMemo(() => {
    const network = botConfig?.network || 'ethereum';
    return chainConfigs[network as ChainName]?.nativeCurrency?.symbol || 'ETH';
  }, [botConfig?.network]);
  
  // Search tokens when query changes
  useEffect(() => {
    if (tokenSearchQuery.length < 2) {
      setTokenSearchResults([]);
      return;
    }
    
    const searchTokens = async () => {
      setIsSearchingTokens(true);
      try {
        const response = await fetch(`/api/tokens?q=${encodeURIComponent(tokenSearchQuery)}&chain=${botConfig?.network || ''}`);
        const data = await response.json();
        if (data.success) {
          setTokenSearchResults(data.data.slice(0, 10));
        }
      } catch {
        setTokenSearchResults([]);
      } finally {
        setIsSearchingTokens(false);
      }
    };
    
    const debounce = setTimeout(searchTokens, 300);
    return () => clearTimeout(debounce);
  }, [tokenSearchQuery, botConfig?.network]);

  // Fetch initial data
  const fetchBotConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch('/api/bot');
      const data = await response.json();
      if (data.success) {
        setBotConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bot config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [setBotConfig, setIsLoadingConfig]);

  const fetchTrades = useCallback(async () => {
    try {
      const response = await fetch('/api/trades?limit=20');
      const data = await response.json();
      if (data.success) {
        setTrades(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  }, [setTrades]);

  const fetchPositions = useCallback(async () => {
    setIsLoadingPositions(true);
    try {
      const response = await fetch('/api/positions?status=open');
      const data = await response.json();
      if (data.success) {
        setPositions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [setPositions, setIsLoadingPositions]);

  // Immediate update bot config (for critical settings like start/stop)
  const updateBotConfigImmediate = async (updates: Partial<typeof botConfig>) => {
    if (!botConfig) return;
    try {
      const response = await fetch('/api/bot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        setBotConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to update bot config:', error);
    }
  };

  // Debounced update bot config (for settings that change frequently)
  const updateBotConfig = useCallback((updates: Record<string, unknown>) => {
    // Immediately update local state for responsive UI using functional update
    setBotConfig((prevConfig) => {
      if (!prevConfig) return prevConfig;
      return { ...prevConfig, ...updates };
    });
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Debounce the API call
    saveTimerRef.current = setTimeout(async () => {
      setIsSavingConfig(true);
      try {
        const response = await fetch('/api/bot', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (data.success) {
          setBotConfig(data.data);
        }
      } catch (error) {
        console.error('Failed to update bot config:', error);
      } finally {
        setIsSavingConfig(false);
      }
    }, 1000); // 1 second debounce for config tab
  }, [setBotConfig]);

  // Helper function to get input display value (uses local value if typing, otherwise config value)
  const getInputDisplayValue = (field: string, configValue: number | undefined): string => {
    // If we have a local value being typed, show that
    if (field in localInputValues) {
      return localInputValues[field];
    }
    return configValue?.toString() ?? '';
  };

  // Handle number input change - stores locally, allows typing freely
  const handleNumberInputChange = (field: string, value: string, min?: number, max?: number) => {
    // Always update local display value so user can see what they type
    setLocalInputValues(prev => ({ ...prev, [field]: value }));
    
    // If empty or just minus/decimal, don't update the config yet
    if (value === '' || value === '-' || value === '.') {
      return;
    }
    
    const num = parseFloat(value);
    if (!isNaN(num)) {
      // For partial numbers like "0.", don't save yet - wait for blur
      if (value.endsWith('.') || value.includes('.') && value.endsWith('0')) {
        return;
      }
      // Clamp to min/max if provided
      const clampedValue = min !== undefined && max !== undefined 
        ? Math.min(max, Math.max(min, num))
        : num;
      updateBotConfig({ [field]: clampedValue });
    }
  };

  // Handle number input blur - save final value and clear local state
  const handleNumberInputBlur = (field: string, defaultValue: number, min?: number, max?: number) => {
    // Get the local value that was typed
    const localValue = localInputValues[field];
    
    // Clear local input state
    setLocalInputValues(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    
    // If empty or invalid, restore to default
    if (localValue === '' || localValue === '-' || localValue === '.') {
      updateBotConfig({ [field]: defaultValue });
      return;
    }
    
    const num = parseFloat(localValue);
    if (isNaN(num)) {
      updateBotConfig({ [field]: defaultValue });
      return;
    }
    
    // Clamp to min/max
    let finalValue = num;
    if (min !== undefined && num < min) {
      finalValue = min;
    } else if (max !== undefined && num > max) {
      finalValue = max;
    }
    updateBotConfig({ [field]: finalValue });
  };

  // Toggle bot
  const toggleBot = async (action: 'start' | 'stop') => {
    setIsBotStarting(true);
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (data.success) {
        setBotConfig(data.data);
        addActivityLog({
          id: `log_${Date.now()}`,
          level: 'info',
          category: 'system',
          message: action === 'start' ? 'Bot started successfully' : 'Bot stopped',
          details: null,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to toggle bot:', error);
    } finally {
      setIsBotStarting(false);
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!socketRef.current) {
      // Dynamic import for socket.io-client
      import('socket.io-client').then(({ io }) => {
        const socket = io('/?XTransformPort=3003', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 10000,
        });
        socketRef.current = socket as unknown as SocketType;

        socket.on('connect', () => {
          setWsConnected(true);
          console.log('WebSocket connected');
        });

        socket.on('disconnect', (reason: string) => {
          setWsConnected(false);
          console.log('WebSocket disconnected:', reason);
        });

        socket.on('connect_error', (error: Error) => {
          console.log('WebSocket connection error:', error.message);
          setWsConnected(false);
        });

        socket.on('price_update', (data: { symbol: string; price: number; change: number; marketCap?: number; volume24h?: number; timestamp?: number }) => {
          setPrice(data.symbol, {
            symbol: data.symbol,
            price: data.price,
            priceChange24h: data.change,
            volume24h: data.volume24h || 0,
            marketCap: data.marketCap || 0,
            lastUpdated: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
          });
        });

        socket.on('trade_signal', (signal: { type: string; symbol: string; price: number }) => {
          addActivityLog({
            id: `signal_${Date.now()}`,
            level: signal.type === 'alert' ? 'warning' : 'info',
            category: 'trade',
            message: `${signal.type.toUpperCase()} Signal: ${signal.symbol} @ $${signal.price.toFixed(4)}`,
            details: JSON.stringify(signal),
            createdAt: new Date().toISOString(),
          });
        });

        socket.on('trade_executed', (trade: { type: string; amount: number; symbol: string }) => {
          addActivityLog({
            id: `trade_${Date.now()}`,
            level: 'info',
            category: 'trade',
            message: `Trade Executed: ${trade.type.toUpperCase()} ${trade.amount} ${trade.symbol}`,
            details: JSON.stringify(trade),
            createdAt: new Date().toISOString(),
          });
        });
      }).catch((error) => {
        console.error('Failed to load socket.io-client:', error);
      });
    }

    return () => {
      // Don't disconnect on unmount to allow reconnection
    };
  }, [setWsConnected, setPrice, addActivityLog]);

  // Fetch initial data
  useEffect(() => {
    fetchBotConfig();
    fetchTrades();
    fetchPositions();
  }, [fetchBotConfig, fetchTrades, fetchPositions]);

  // Update positions with current prices
  useEffect(() => {
    positions.forEach((position) => {
      if (position.tokenSymbol && prices[position.tokenSymbol]) {
        const currentPrice = prices[position.tokenSymbol].price;
        const currentValue = position.amount * currentPrice;
        const profitLoss = currentValue - position.valueIn;
        const profitLossPercent = (profitLoss / position.valueIn) * 100;

        updatePosition(position.id, {
          currentValue,
          profitLoss,
          profitLossPercent,
          highestPrice: Math.max(position.highestPrice || currentPrice, currentPrice),
          lowestPrice: Math.min(position.lowestPrice || currentPrice, currentPrice),
        });
      }
    });
  }, [prices, positions, updatePosition]);

  // Calculate stats
  const totalPnL = positions.reduce((sum, p) => sum + (p.profitLoss || 0), 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || p.valueIn), 0);
  const winRate = trades.filter((t) => t.type === 'sell' && (t.profitLoss || 0) > 0).length /
    Math.max(1, trades.filter((t) => t.type === 'sell').length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <span className="text-lg sm:text-xl font-bold hidden sm:inline">Sniper Bot</span>
            </div>
            {/* Connection status badge - show on larger screens */}
            <Badge 
              variant={wsConnected ? 'default' : 'secondary'} 
              className="hidden sm:inline-flex ml-1 text-xs whitespace-nowrap"
            >
              {wsConnected ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>
            {/* Active badge - hide on mobile */}
            {botConfig?.isActive && (
              <Badge 
                variant="outline" 
                className="bg-green-500/10 text-green-500 border-green-500/20 hidden md:flex whitespace-nowrap"
              >
                <Activity className="mr-1 h-3 w-3 animate-pulse" />
                Active
              </Badge>
            )}
            {/* Saving indicator */}
            {isSavingConfig && (
              <Badge 
                variant="outline" 
                className="bg-blue-500/10 text-blue-500 border-blue-500/20 hidden md:flex whitespace-nowrap"
              >
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleCompact />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsRefreshing(true);
                await Promise.all([fetchBotConfig(), fetchTrades(), fetchPositions()]);
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              disabled={isRefreshing}
              className="h-9 sm:h-9 px-2 sm:px-3 min-h-[44px] sm:min-h-0 transition-all duration-200 hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {botConfig?.isActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={isBotStarting}
                    className="h-9 sm:h-9 px-2 sm:px-3 min-h-[44px] sm:min-h-0 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <Square className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Stop Bot</span>
                    <span className="sm:hidden">Stop</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Stop Trading Bot?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop all automated trading activities. Any open positions will remain open.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toggleBot('stop')}>
                      Stop Bot
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size="sm"
                onClick={() => toggleBot('start')}
                disabled={isBotStarting || !botConfig?.targetToken}
                className="bg-green-600 hover:bg-green-700 h-9 sm:h-9 px-2 sm:px-3 min-h-[44px] sm:min-h-0 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
              >
                {isBotStarting ? (
                  <RefreshCw className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Start Bot</span>
                <span className="sm:hidden">Start</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats Overview */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
          <Card className="border-l-4 border-l-blue-500/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {positions.length} position{positions.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          <Card className={`border-l-4 ${totalPnL >= 0 ? 'border-l-green-500/50' : 'border-l-red-500/50'} hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total P&L</CardTitle>
              {totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Unrealized
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <Progress value={winRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground">
                {trades.filter((t) => t.status === 'completed').length} done
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="grid w-full grid-cols-6 min-w-[600px] sm:min-w-0 sm:w-auto sm:inline-flex">
              <TabsTrigger value="dashboard" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <LineChart className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
              <TabsTrigger value="trading-activity" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Trading Activity</span>
                <span className="sm:hidden">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="sniper" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <Crosshair className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Sniper</span>
              </TabsTrigger>
              <TabsTrigger value="help" className="min-h-[44px] px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                <HelpCircle className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Help</span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Live Prices */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Live Prices
                    </CardTitle>
                    {wsConnected && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Real-time cryptocurrency prices from CoinGecko
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2">
                      {Object.values(prices).filter(p => p.price > 0).slice(0, 10).map((price) => (
                        <div key={price.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-12">{price.symbol}</span>
                            {price.priceChange24h !== undefined && (
                              <Badge
                                variant="outline"
                                className={
                                  price.priceChange24h >= 0
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }
                              >
                                {price.priceChange24h >= 0 ? '+' : ''}
                                {price.priceChange24h.toFixed(2)}%
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-medium">
                              ${price.price < 0.01 ? price.price.toExponential(2) : price.price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: price.price < 1 ? 6 : 2,
                              })}
                            </div>
                            {price.volume24h > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Vol: ${(price.volume24h / 1000000).toFixed(1)}M
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {Object.keys(prices).filter(k => prices[k]?.price > 0).length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          {wsConnected ? (
                            <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="h-6 w-6 animate-spin" />
                              <span>Loading live prices...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <XCircle className="h-6 w-6 text-red-500" />
                              <span>Connecting to price feed...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Open Positions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Open Positions
                  </CardTitle>
                  <CardDescription>Currently active trading positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {positions.slice(0, 5).map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{position.tokenSymbol || 'Unknown'}</span>
                            <Badge variant="outline">{position.amount.toFixed(4)}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Entry: ${position.entryPrice.toFixed(4)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              (position.profitLossPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {(position.profitLossPercent || 0) >= 0 ? '+' : ''}
                            {(position.profitLossPercent || 0).toFixed(2)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${(position.currentValue || position.valueIn).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {positions.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No open positions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] sm:h-[300px]">
                  <div className="space-y-2">
                    {activityLogs.slice(0, 20).map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 sm:gap-3 rounded-lg p-2 ${
                          log.level === 'error'
                            ? 'bg-red-500/10'
                            : log.level === 'warning'
                            ? 'bg-yellow-500/10'
                            : 'bg-muted'
                        }`}
                      >
                        {log.level === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : log.level === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                          {log.category}
                        </Badge>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No recent activity
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Wallet Connection */}
              <WalletConnection />
              
              {/* Supported Wallets Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Supported Wallets
                  </CardTitle>
                  <CardDescription>
                    Connect using your preferred wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'MetaMask', icon: '🦊' },
                      { name: 'Rabby', icon: '🐰' },
                      { name: 'Brave Wallet', icon: '🦁' },
                      { name: 'Trust Wallet', icon: '🛡️' },
                      { name: 'OKX Wallet', icon: '⬛' },
                      { name: 'imToken', icon: '📱' },
                      { name: 'Rainbow', icon: '🌈' },
                      { name: 'WalletConnect', icon: '🔗' },
                      { name: 'Ledger', icon: '🔐' },
                      { name: 'Safe', icon: '🔒' },
                    ].map((wallet) => (
                      <div 
                        key={wallet.name}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                      >
                        <span className="text-lg">{wallet.icon}</span>
                        <span className="text-sm font-medium">{wallet.name}</span>
                      </div>
                    ))}
                  </div>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Security Notice</AlertTitle>
                    <AlertDescription>
                      Your wallet is only used for signing transactions. Private keys are never stored or transmitted.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Supported Networks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Supported Networks & DEXes
                </CardTitle>
                <CardDescription>
                  Multi-chain support with various decentralized exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Supported Chains</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Ethereum', 'PulseChain', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 'Avalanche', 'Fantom', 'Linea', 'zkSync', 'Scroll', 'Mantle', 'Celo', 'Gnosis', 'Moonbeam'].map((chain) => (
                        <Badge key={chain} variant="outline">{chain}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Supported DEXes</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Uniswap', 'PulseX', 'Piteas', 'PancakeSwap', 'SushiSwap', 'QuickSwap', 'BaseSwap', 'Camelot', 'Trader Joe', 'SpookySwap', 'KyberSwap', '1inch', 'Balancer', 'Curve'].map((dex) => (
                        <Badge key={dex} variant="secondary">{dex}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              botConfig && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Target Token */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Target Token
                      </CardTitle>
                      <CardDescription>Configure the token to snipe - search or paste address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Token Search/Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="targetToken">Token Address or Search</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Search className="h-3 w-3 mr-1" />
                                Search
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                              <div className="p-2">
                                <Input
                                  placeholder="Search by name or symbol..."
                                  value={tokenSearchQuery}
                                  onChange={(e) => setTokenSearchQuery(e.target.value)}
                                  className="mb-2"
                                />
                                <ScrollArea className="h-48">
                                  {isSearchingTokens ? (
                                    <div className="flex items-center justify-center py-4">
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    </div>
                                  ) : tokenSearchResults.length > 0 ? (
                                    <div className="space-y-1">
                                      {tokenSearchResults.map((token, index) => (
                                        <button
                                          key={`${token.address}-${index}`}
                                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left"
                                          onClick={() => {
                                            updateBotConfig({ 
                                              targetToken: token.address,
                                              targetTokenSymbol: token.symbol,
                                              targetTokenName: token.name,
                                            });
                                            setTokenSearchQuery('');
                                            setTokenSearchResults([]);
                                          }}
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{token.symbol}</div>
                                            <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                                            {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : tokenSearchQuery.length >= 2 ? (
                                    <div className="text-center text-sm text-muted-foreground py-4">
                                      No tokens found
                                    </div>
                                  ) : (
                                    <div className="text-center text-sm text-muted-foreground py-4">
                                      Type at least 2 characters to search
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Input
                          id="targetToken"
                          placeholder="0x... or paste token address"
                          value={botConfig.targetToken || ''}
                          onChange={(e) => updateBotConfig({ targetToken: e.target.value })}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tokenSymbol">Symbol</Label>
                          <Input
                            id="tokenSymbol"
                            placeholder="TOKEN"
                            value={botConfig.targetTokenSymbol || ''}
                            onChange={(e) => updateBotConfig({ targetTokenSymbol: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="baseToken">Base Token</Label>
                          <Select
                            value={botConfig.baseToken}
                            onValueChange={(value) => updateBotConfig({ baseToken: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currentBaseTokens.map((token) => (
                                <SelectItem key={token.symbol} value={token.symbol}>
                                  {token.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Popular tokens for current chain */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Popular tokens on {chainConfigs[botConfig.network as ChainName]?.name || botConfig.network}</Label>
                        <div className="flex flex-wrap gap-1">
                          {getPopularTokensForChain(botConfig.network as ChainName).slice(0, 6).map((token, index) => (
                            <Button
                              key={`${token.symbol}-${token.address}-${index}`}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => updateBotConfig({
                                targetToken: token.address,
                                targetTokenSymbol: token.symbol,
                                targetTokenName: token.name,
                              })}
                            >
                              {token.symbol}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exchange Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Exchange Settings
                      </CardTitle>
                      <CardDescription>DEX and network configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Exchange</Label>
                          <Select
                            value={botConfig.exchange}
                            onValueChange={(value) => updateBotConfig({ exchange: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(chainConfigs[botConfig.network as ChainName]?.dexes || ['uniswap']).map((dex) => (
                                <SelectItem key={dex} value={dex}>
                                  {dex.charAt(0).toUpperCase() + dex.slice(1).replace(/-/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select
                            value={botConfig.network}
                            onValueChange={(value) => {
                              const chainConfig = chainConfigs[value as ChainName];
                              updateBotConfig({ 
                                network: value,
                                // Auto-select first base token for new chain
                                baseToken: chainConfig?.baseTokens[0]?.symbol || 'WETH',
                                // Auto-select first DEX for new chain
                                exchange: chainConfig?.dexes[0] || 'uniswap',
                                // Clear RPC URL to use default
                                rpcUrl: null,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(chainConfigs).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="rpcUrl">RPC URL (Optional)</Label>
                          <Popover open={showRpcSuggestions} onOpenChange={setShowRpcSuggestions}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Info className="h-3 w-3 mr-1" />
                                Suggestions
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-2" align="end">
                              <div className="space-y-2">
                                <p className="text-xs font-medium">Recommended RPC URLs</p>
                                <ScrollArea className="h-40">
                                  <div className="space-y-1">
                                    {currentRpcUrls.map((url, i) => (
                                      <button
                                        key={i}
                                        className="w-full text-left p-2 rounded hover:bg-muted text-xs font-mono truncate"
                                        onClick={() => {
                                          updateBotConfig({ rpcUrl: url });
                                          setShowRpcSuggestions(false);
                                        }}
                                      >
                                        {url}
                                      </button>
                                    ))}
                                  </div>
                                </ScrollArea>
                                <p className="text-xs text-muted-foreground">
                                  Default: {chainConfigs[botConfig.network as ChainName]?.rpcUrl || 'Auto'}
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Input
                          id="rpcUrl"
                          placeholder={chainConfigs[botConfig.network as ChainName]?.rpcUrl || 'https://...'}
                          value={botConfig.rpcUrl || ''}
                          onChange={(e) => updateBotConfig({ rpcUrl: e.target.value })}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to use default RPC for {chainConfigs[botConfig.network as ChainName]?.name || 'selected chain'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Buy Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Buy Settings
                      </CardTitle>
                      <CardDescription>Configure automatic buy triggers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Buy Trigger Types - Multi-select */}
                      <div className="space-y-2">
                        <Label>Buy Trigger Types</Label>
                        <p className="text-xs text-muted-foreground mb-2">Select multiple triggers for enhanced bot activity</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { value: 'price_drop', label: 'Price Drop', desc: 'Buy on significant price decrease' },
                            { value: 'volume_spike', label: 'Volume Spike', desc: 'Buy on unusual volume increase' },
                            { value: 'liquidity_add', label: 'Liquidity Added', desc: 'Buy when liquidity is added' },
                            { value: 'new_pair', label: 'New Pair', desc: 'Buy on new trading pair detection' },
                            { value: 'manual', label: 'Manual Only', desc: 'Only buy on manual trigger' },
                          ].map((trigger) => {
                            // Parse current trigger types from string (comma-separated)
                            const currentTypes = botConfig.buyTriggerType?.split(',').filter(Boolean) || ['liquidity_add'];
                            const isSelected = currentTypes.includes(trigger.value);
                            
                            const handleToggle = () => {
                              let newTypes: string[];
                              if (isSelected) {
                                // Don't allow deselecting if it's the last one
                                if (currentTypes.length === 1) return;
                                newTypes = currentTypes.filter(t => t !== trigger.value);
                              } else {
                                newTypes = [...currentTypes, trigger.value];
                              }
                              updateBotConfig({ buyTriggerType: newTypes.join(',') });
                            };
                            
                            return (
                              <div
                                key={trigger.value}
                                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer min-h-[60px] sm:min-h-0 ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                                    : 'bg-muted/30 hover:bg-muted/50 border-muted'
                                }`}
                                onClick={handleToggle}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleToggle();
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="mt-0.5 pointer-events-none"
                                />
                                <div className="grid gap-0.5 leading-none flex-1">
                                  <span className="text-sm font-medium leading-none cursor-pointer">
                                    {trigger.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{trigger.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {(() => {
                          const currentTypes = botConfig.buyTriggerType?.split(',').filter(Boolean) || ['liquidity_add'];
                          return currentTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="text-xs text-muted-foreground">Active:</span>
                              {currentTypes.map((t: string) => (
                                <Badge key={t} variant="secondary" className="text-xs">
                                  {t.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Trigger Sensitivity with Input and Slider */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Trigger Sensitivity</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="50"
                              value={getInputDisplayValue('buyTriggerValue', botConfig.buyTriggerValue)}
                              onChange={(e) => handleNumberInputChange('buyTriggerValue', e.target.value, 0.5, 50)}
                              onBlur={() => handleNumberInputBlur('buyTriggerValue', 5, 0.5, 50)}
                              className="w-20 h-8 text-center text-sm"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                        <Slider
                          value={[botConfig.buyTriggerValue]}
                          onValueChange={([value]) => {
                            // Clear local input when using slider
                            setLocalInputValues(prev => {
                              const next = { ...prev };
                              delete next['buyTriggerValue'];
                              return next;
                            });
                            updateBotConfig({ buyTriggerValue: value });
                          }}
                          max={50}
                          step={0.5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lower values = more sensitive (more trades). Higher values = less sensitive (fewer trades).
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Buy Amount ({nativeTokenSymbol})</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={getInputDisplayValue('buyAmount', botConfig.buyAmount)}
                            onChange={(e) => handleNumberInputChange('buyAmount', e.target.value, 0)}
                            onBlur={() => handleNumberInputBlur('buyAmount', 0.1, 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slippage (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={getInputDisplayValue('buySlippage', botConfig.buySlippage)}
                            onChange={(e) => handleNumberInputChange('buySlippage', e.target.value, 0, 100)}
                            onBlur={() => handleNumberInputBlur('buySlippage', 5, 0, 100)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gas Price (Gwei)</Label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={getInputDisplayValue('buyGasPrice', botConfig.buyGasPrice)}
                            onChange={(e) => handleNumberInputChange('buyGasPrice', e.target.value, 0)}
                            onBlur={() => handleNumberInputBlur('buyGasPrice', 0, 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gas Limit</Label>
                          <Input
                            type="number"
                            min="21000"
                            value={getInputDisplayValue('buyGasLimit', botConfig.buyGasLimit)}
                            onChange={(e) => handleNumberInputChange('buyGasLimit', e.target.value, 21000)}
                            onBlur={() => handleNumberInputBlur('buyGasLimit', 250000, 21000)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sell Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        Sell Settings
                      </CardTitle>
                      <CardDescription>Configure automatic sell triggers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Sell Trigger Type</Label>
                        <Select
                          value={botConfig.sellTriggerType}
                          onValueChange={(value) => updateBotConfig({ sellTriggerType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="take_profit">Take Profit</SelectItem>
                            <SelectItem value="stop_loss">Stop Loss</SelectItem>
                            <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
                            <SelectItem value="time_based">Time Based</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Slippage (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={botConfig.sellSlippage ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || val === '.') return;
                            const num = parseFloat(val);
                            if (!isNaN(num) && num >= 0 && num <= 100) {
                              updateBotConfig({ sellSlippage: num });
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val < 0) {
                              updateBotConfig({ sellSlippage: 0 });
                            } else if (val > 100) {
                              updateBotConfig({ sellSlippage: 100 });
                            }
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gas Price (Gwei)</Label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={botConfig.sellGasPrice ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-') return;
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0) {
                                updateBotConfig({ sellGasPrice: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0) {
                                updateBotConfig({ sellGasPrice: 0 });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gas Limit</Label>
                          <Input
                            type="number"
                            min="21000"
                            value={botConfig.sellGasLimit ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-') return;
                              const num = parseInt(val);
                              if (!isNaN(num) && num >= 21000) {
                                updateBotConfig({ sellGasLimit: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 21000) {
                                updateBotConfig({ sellGasLimit: 21000 });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sell Trigger Value</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={botConfig.sellTriggerValue ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || val === '.') return;
                            const num = parseFloat(val);
                            if (!isNaN(num) && num >= 0) {
                              updateBotConfig({ sellTriggerValue: num });
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val < 0) {
                              updateBotConfig({ sellTriggerValue: 0 });
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Take Profit & Stop Loss */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Take Profit & Stop Loss
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Take Profit</Label>
                          <p className="text-sm text-muted-foreground">Auto-sell at profit target</p>
                        </div>
                        <Switch
                          checked={botConfig.takeProfitEnabled}
                          onCheckedChange={(checked) => updateBotConfig({ takeProfitEnabled: checked })}
                        />
                      </div>
                      {botConfig.takeProfitEnabled && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Take Profit %</Label>
                              <Input
                                type="number"
                                step="1"
                                min="0.1"
                                value={getInputDisplayValue('takeProfitPercent', botConfig.takeProfitPercent)}
                                onChange={(e) => handleNumberInputChange('takeProfitPercent', e.target.value)}
                                onBlur={() => handleNumberInputBlur('takeProfitPercent', 50, 0.1)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sell Amount %</Label>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                max="100"
                                value={getInputDisplayValue('takeProfitAmount', botConfig.takeProfitAmount)}
                                onChange={(e) => handleNumberInputChange('takeProfitAmount', e.target.value, 1, 100)}
                                onBlur={() => handleNumberInputBlur('takeProfitAmount', 100, 1, 100)}
                              />
                            </div>
                          </div>
                          <Slider
                            value={[botConfig.takeProfitPercent]}
                            onValueChange={([value]) => {
                              setLocalInputValues(prev => {
                                const next = { ...prev };
                                delete next['takeProfitPercent'];
                                return next;
                              });
                              updateBotConfig({ takeProfitPercent: value });
                            }}
                            max={500}
                            step={1}
                          />
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Stop Loss</Label>
                          <p className="text-sm text-muted-foreground">Auto-sell at loss limit</p>
                        </div>
                        <Switch
                          checked={botConfig.stopLossEnabled}
                          onCheckedChange={(checked) => updateBotConfig({ stopLossEnabled: checked })}
                        />
                      </div>
                      {botConfig.stopLossEnabled && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Stop Loss %</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0.1"
                                max="100"
                                value={getInputDisplayValue('stopLossPercent', botConfig.stopLossPercent)}
                                onChange={(e) => handleNumberInputChange('stopLossPercent', e.target.value, 0.1, 100)}
                                onBlur={() => handleNumberInputBlur('stopLossPercent', 15, 0.1, 100)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Stop Type</Label>
                              <Select
                                value={botConfig.stopLossType}
                                onValueChange={(value) => updateBotConfig({ stopLossType: value })}
                              >
                                <SelectTrigger>
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
                          <Slider
                            value={[botConfig.stopLossPercent]}
                            onValueChange={([value]) => {
                              setLocalInputValues(prev => {
                                const next = { ...prev };
                                delete next['stopLossPercent'];
                                return next;
                              });
                              updateBotConfig({ stopLossPercent: value });
                            }}
                            max={100}
                            step={0.5}
                          />
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Trailing Stop</Label>
                          <p className="text-sm text-muted-foreground">Follow price movements</p>
                        </div>
                        <Switch
                          checked={botConfig.trailingStopEnabled}
                          onCheckedChange={(checked) => updateBotConfig({ trailingStopEnabled: checked })}
                        />
                      </div>
                      {botConfig.trailingStopEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Trail Distance %</Label>
                            <Input
                              type="number"
                              step="0.5"
                              min="0.1"
                              value={getInputDisplayValue('trailingStopPercent', botConfig.trailingStopPercent)}
                              onChange={(e) => handleNumberInputChange('trailingStopPercent', e.target.value, 0.1)}
                              onBlur={() => handleNumberInputBlur('trailingStopPercent', 10, 0.1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Activation %</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={getInputDisplayValue('trailingStopActivation', botConfig.trailingStopActivation)}
                              onChange={(e) => handleNumberInputChange('trailingStopActivation', e.target.value, 0)}
                              onBlur={() => handleNumberInputBlur('trailingStopActivation', 20, 0)}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Risk Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Risk Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Position Sizing</Label>
                        <Select
                          value={botConfig.positionSizingType}
                          onValueChange={(value) => updateBotConfig({ positionSizingType: value })}
                        >
                          <SelectTrigger>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Position ({nativeTokenSymbol})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={botConfig.maxPositionSize ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-' || val === '.') return;
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0) {
                                updateBotConfig({ maxPositionSize: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0) {
                                updateBotConfig({ maxPositionSize: 0 });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily Loss ({nativeTokenSymbol})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={botConfig.maxDailyLoss ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-' || val === '.') return;
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0) {
                                updateBotConfig({ maxDailyLoss: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0) {
                                updateBotConfig({ maxDailyLoss: 0 });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Daily Trades</Label>
                          <Input
                            type="number"
                            min="1"
                            value={botConfig.maxDailyTrades ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-') return;
                              const num = parseInt(val);
                              if (!isNaN(num) && num >= 1) {
                                updateBotConfig({ maxDailyTrades: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 1) {
                                updateBotConfig({ maxDailyTrades: 1 });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Open Positions</Label>
                          <Input
                            type="number"
                            min="1"
                            value={botConfig.maxOpenPositions ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-') return;
                              const num = parseInt(val);
                              if (!isNaN(num) && num >= 1) {
                                updateBotConfig({ maxOpenPositions: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 1) {
                                updateBotConfig({ maxOpenPositions: 1 });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cooldown Period (sec)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={botConfig.cooldownPeriod ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-') return;
                              const num = parseInt(val);
                              if (!isNaN(num) && num >= 0) {
                                updateBotConfig({ cooldownPeriod: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < 0) {
                                updateBotConfig({ cooldownPeriod: 0 });
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Min Position Size ({nativeTokenSymbol})</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={botConfig.minPositionSize ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-' || val === '.') return;
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0) {
                                updateBotConfig({ minPositionSize: num });
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || val < 0) {
                                updateBotConfig({ minPositionSize: 0 });
                              }
                            }}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>MEV Protection</Label>
                          <Switch
                            checked={botConfig.mevProtection}
                            onCheckedChange={(checked) => updateBotConfig({ mevProtection: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Flash Loan Detection</Label>
                          <Switch
                            checked={botConfig.flashLoanDetection}
                            onCheckedChange={(checked) => updateBotConfig({ flashLoanDetection: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Auto-Approve Tokens</Label>
                          <Switch
                            checked={botConfig.autoApprove}
                            onCheckedChange={(checked) => updateBotConfig({ autoApprove: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </TabsContent>

          {/* Trading Activity Tab - Merged Positions, History, and Activity */}
          <TabsContent value="trading-activity" className="space-y-4">
            {/* Page Title */}
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold">Trading Activity</h2>
            </div>

            {/* Open Positions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Open Positions
                </CardTitle>
                <CardDescription>
                  Manage your current trading positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table className="min-w-[700px] sm:min-w-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Entry Price</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead className="hidden sm:table-cell">Stop Loss</TableHead>
                        <TableHead className="hidden sm:table-cell">Take Profit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">
                            {position.tokenSymbol || 'Unknown'}
                          </TableCell>
                          <TableCell>{position.amount.toFixed(4)}</TableCell>
                          <TableCell>${position.entryPrice.toFixed(6)}</TableCell>
                          <TableCell>
                            ${(position.currentValue || position.valueIn).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                (position.profitLossPercent || 0) >= 0
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }
                            >
                              {(position.profitLossPercent || 0) >= 0 ? '+' : ''}
                              {(position.profitLossPercent || 0).toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {position.stopLossPrice
                              ? `$${position.stopLossPrice.toFixed(6)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {position.takeProfitPrice
                              ? `$${position.takeProfitPrice.toFixed(6)}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="min-h-[44px] sm:min-h-0">
                                  Close
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Close Position?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will sell all {position.tokenSymbol} tokens at market price.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      await fetch('/api/positions', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          id: position.id,
                                          action: 'close',
                                        }),
                                      });
                                      fetchPositions();
                                    }}
                                  >
                                    Close Position
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {positions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No open positions
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Trade History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Trade History
                </CardTitle>
                <CardDescription>All executed trades</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[700px] sm:min-w-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Token</TableHead>
                          <TableHead>Amount In</TableHead>
                          <TableHead>Amount Out</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="hidden sm:table-cell">Status</TableHead>
                          <TableHead>P&L</TableHead>
                          <TableHead className="hidden md:table-cell">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              <Badge
                                variant={trade.type === 'buy' ? 'default' : 'secondary'}
                                className={
                                  trade.type === 'buy'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                }
                              >
                                {trade.type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {trade.tokenSymbol || 'Unknown'}
                            </TableCell>
                            <TableCell>{trade.amountIn.toFixed(4)}</TableCell>
                            <TableCell>{trade.amountOut.toFixed(4)}</TableCell>
                            <TableCell>${trade.price.toFixed(6)}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge
                                variant="outline"
                                className={
                                  trade.status === 'completed'
                                    ? 'bg-green-500/10 text-green-500'
                                    : trade.status === 'failed'
                                    ? 'bg-red-500/10 text-red-500'
                                    : trade.status === 'pending'
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : ''
                                }
                              >
                                {trade.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {trade.profitLoss !== null ? (
                                <span
                                  className={
                                    trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                                  }
                                >
                                  {trade.profitLoss >= 0 ? '+' : ''}
                                  {trade.profitLoss.toFixed(4)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">
                              {new Date(trade.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {trades.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No trade history
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Activity Log Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>All bot activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 ${
                          log.level === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : log.level === 'warning'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : log.level === 'debug'
                            ? 'bg-muted/50'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {log.level === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : log.level === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : log.level === 'debug' ? (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-medium text-sm sm:text-base">{log.message}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                          </div>
                          {log.details && (
                            <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(JSON.parse(log.details), null, 2)}
                            </pre>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No activity logs yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sniper Tab */}
          <TabsContent value="sniper" className="space-y-4">
            <SniperPanel />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Getting Started */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>Quick guide to start using the Sniper Bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">1</div>
                      <div>
                        <p className="font-medium">Connect Your Wallet</p>
                        <p className="text-sm text-muted-foreground">Go to the Wallet tab and connect your preferred wallet. Supports MetaMask, Rabby, Brave Wallet, Trust Wallet, OKX Wallet, Rainbow, WalletConnect, Ledger, and more.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="font-medium">Select Network & DEX</p>
                        <p className="text-sm text-muted-foreground">Choose your target blockchain network and preferred DEX. The bot supports 18+ chains including Ethereum, PulseChain, Base, Arbitrum, Optimism, Polygon, BSC, and more.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">3</div>
                      <div>
                        <p className="font-medium">Configure Trading Parameters</p>
                        <p className="text-sm text-muted-foreground">Set up your buy amount, slippage tolerance, gas settings, and risk management (Take Profit, Stop Loss, Trailing Stop) in the Config or Sniper tab.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">4</div>
                      <div>
                        <p className="font-medium">Add Sniper Targets</p>
                        <p className="text-sm text-muted-foreground">Enter token contract addresses to monitor. The bot will automatically verify tokens and check for liquidity before executing trades.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">5</div>
                      <div>
                        <p className="font-medium">Start the Bot</p>
                        <p className="text-sm text-muted-foreground">Click the Start Bot button in the header to begin automated trading. Monitor positions and activity in real-time from the Dashboard.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Features Overview
                  </CardTitle>
                  <CardDescription>Key features of the Sniper Bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Crosshair className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Multi-Chain Sniper</p>
                      <p className="text-sm text-muted-foreground">Monitor and snipe tokens across 18+ chains including Ethereum, PulseChain, Base, Arbitrum, and more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Target className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Auto-Sweep Mode</p>
                      <p className="text-sm text-muted-foreground">Automatically scan multiple chains for new liquidity and snipe opportunities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Risk Management</p>
                      <p className="text-sm text-muted-foreground">Take Profit, Stop Loss, and Trailing Stop features to protect your investments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Activity className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Real-Time Monitoring</p>
                      <p className="text-sm text-muted-foreground">Live price feeds, position tracking, and activity logs for complete visibility</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DEX Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Supported DEXes
                  </CardTitle>
                  <CardDescription>Trade on your favorite decentralized exchanges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Ethereum</p>
                      <p className="text-xs text-muted-foreground">Uniswap, SushiSwap, 1inch, KyberSwap</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">PulseChain</p>
                      <p className="text-xs text-muted-foreground">PulseX, Piteas, 9inch</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Base</p>
                      <p className="text-xs text-muted-foreground">Uniswap, BaseSwap, Aerodrome</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Arbitrum</p>
                      <p className="text-xs text-muted-foreground">Uniswap, Camelot, Ramses</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">BSC</p>
                      <p className="text-xs text-muted-foreground">PancakeSwap, BiSwap, Thena</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Polygon</p>
                      <p className="text-xs text-muted-foreground">QuickSwap, SushiSwap, Dystopia</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Avalanche</p>
                      <p className="text-xs text-muted-foreground">Trader Joe, Pangolin, Lydia</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-medium">Solana</p>
                      <p className="text-xs text-muted-foreground">Raydium, Jupiter, Orca</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>Common questions and answers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-medium">What is Auto-Sweep mode?</p>
                    <p className="text-sm text-muted-foreground">Auto-Sweep automatically scans selected chains for new token pairs and liquidity additions, executing snipes based on your configured parameters. Perfect for finding new opportunities across multiple chains simultaneously.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">How do Take Profit and Stop Loss work?</p>
                    <p className="text-sm text-muted-foreground">Take Profit automatically sells when your position reaches a target profit percentage. Stop Loss sells when the price drops to limit losses. Trailing Stop follows price movements upward while protecting gains.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">What is MEV Protection?</p>
                    <p className="text-sm text-muted-foreground">MEV Protection helps prevent front-running and sandwich attacks by using private transaction pools or flashbots when available. This ensures your trades execute at the expected price.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">Are my private keys safe?</p>
                    <p className="text-sm text-muted-foreground">Yes! Your wallet is only used for signing transactions. Private keys are never stored or transmitted to our servers. All sensitive operations happen locally in your browser.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">What slippage should I use?</p>
                    <p className="text-sm text-muted-foreground">For stable coins: 0.1-0.5%. For established tokens: 0.5-2%. For new/volatile tokens: 3-10%. Higher slippage increases success rate but may result in worse prices.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">Why did my transaction fail?</p>
                    <p className="text-sm text-muted-foreground">Common causes: insufficient gas, slippage too low, front-running, or token contract restrictions. Check the Activity tab for detailed error messages. Try increasing slippage or gas price.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Management Guide
                  </CardTitle>
                  <CardDescription>Protect your investments with proper risk controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="font-medium">Take Profit Strategies</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">Set TP at 20-50% for quick profits on volatile tokens. Use partial sells (25-50% of position) to secure gains while keeping exposure. For longer holds, consider 100-500% TP targets.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <p className="font-medium">Stop Loss Best Practices</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">Set SL at 10-20% below entry for new tokens. Use trailing stops (5-15% trail) to lock in profits on winning positions. Consider fixed SL for less volatile tokens.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <p className="font-medium">Position Sizing</p>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">Never risk more than 1-5% of your portfolio per trade. Use Kelly Criterion for optimal sizing. Set max daily loss limits to prevent cascade failures.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Troubleshooting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Troubleshooting
                  </CardTitle>
                  <CardDescription>Common issues and solutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <p className="font-medium text-sm">Wallet Not Connecting</p>
                    <p className="text-xs text-muted-foreground mt-1">Refresh the page, clear browser cache, or try a different browser. Ensure you have the wallet extension installed and unlocked.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <p className="font-medium text-sm">Transactions Pending Too Long</p>
                    <p className="text-xs text-muted-foreground mt-1">Network congestion may be high. Try increasing gas price or use a custom RPC endpoint. Check the network status in the footer.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <p className="font-medium text-sm">Insufficient Balance Error</p>
                    <p className="text-xs text-muted-foreground mt-1">Ensure you have enough native tokens for gas (ETH, MATIC, BNB, etc.) plus the trade amount. Check the Wallet tab for balances across chains.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <p className="font-medium text-sm">Price Not Updating</p>
                    <p className="text-xs text-muted-foreground mt-1">WebSocket connection may be interrupted. Click the Refresh button in the header to reconnect. Check the connection status badge.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Best Practices</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Never share your seed phrase or private keys with anyone</li>
                  <li>Always verify token addresses before trading - scammers create fake tokens</li>
                  <li>Start with small amounts to test your configuration</li>
                  <li>Use hardware wallets (Ledger, Trezor) for larger amounts</li>
                  <li>Be cautious of tokens with unusual warnings or no audit</li>
                  <li>Double-check URLs to avoid phishing sites</li>
                  <li>Revoke token approvals after trading on unfamiliar DEXes</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Keyboard Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="flex-shrink-0">Sync</Badge>
                    <span className="text-muted-foreground">Click &quot;Sync Config&quot; in Sniper tab to import settings from Config tab</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="flex-shrink-0">Auto</Badge>
                    <span className="text-muted-foreground">Enable &quot;Auto Approve&quot; to skip manual token approvals for faster sniping</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="flex-shrink-0">Multi</Badge>
                    <span className="text-muted-foreground">Click on wallet balance cards to quickly switch chains in Sniper tab</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Need More Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Documentation
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://discord.gg/example" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Discord Community
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://github.com/bobmitx/sniper-bot" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GitHub Repository
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comprehensive Documentation */}
            <Separator className="my-6" />
            <DocumentationPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 mt-auto border-t bg-background py-3 sm:py-4">
        <div className="container flex items-center justify-between px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground gap-2">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span className="whitespace-nowrap">Sniper Bot v1.0</span>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <span className="hidden sm:inline whitespace-nowrap">Network: {botConfig?.network || 'N/A'}</span>
            <Separator orientation="vertical" className="h-4 hidden md:block" />
            <span className="hidden md:inline whitespace-nowrap">Exchange: {botConfig?.exchange || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <LiveTime />
          </div>
        </div>
      </footer>
    </div>
  );
}
