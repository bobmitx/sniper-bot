'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { WalletConnection } from '@/components/wallet/wallet-connection';

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
  Sparkles,
  Gauge,
  Coins,
} from 'lucide-react';
import { SniperPanel } from '@/components/trading/sniper-panel';
import { DocumentationPanel } from '@/components/trading/documentation-panel';

// Enhanced Stats Card Component
function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  gradient 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ElementType; 
  trend?: 'up' | 'down' | 'neutral';
  gradient: string;
}) {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-lg ${gradient}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs sm:text-sm font-medium text-white/90">{title}</CardTitle>
        <div className="rounded-full bg-white/10 p-1.5 sm:p-2">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2">
          <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-300" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-300" />}
        </div>
        {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// Enhanced Button with loading state
function ActionButton({ 
  children, 
  variant, 
  onClick, 
  disabled, 
  loading,
  className,
  icon: Icon,
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ElementType;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative overflow-hidden transition-all duration-300 ${
        loading ? 'pointer-events-none' : ''
      } ${className || ''}`}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4 sm:mr-2" />
      ) : null}
      <span className="hidden sm:inline">{children}</span>
      <span className="sm:hidden">{children}</span>
    </Button>
  );
}

export function TradingDashboard() {
  const socketRef = useRef<SocketType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [botToggling, setBotToggling] = useState<'start' | 'stop' | null>(null);
  
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

  // Refresh all data with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBotConfig(), fetchTrades(), fetchPositions()]);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [fetchBotConfig, fetchTrades, fetchPositions]);

  // Update bot config
  const updateBotConfig = async (updates: Partial<typeof botConfig>) => {
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

  // Toggle bot
  const toggleBot = async (action: 'start' | 'stop') => {
    setBotToggling(action);
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
      setTimeout(() => setBotToggling(null), 300);
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!socketRef.current) {
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

        socket.on('price_update', (data: { symbol: string; price: number; change: number }) => {
          setPrice(data.symbol, {
            symbol: data.symbol,
            price: data.price,
            priceChange24h: data.change,
            volume24h: 0,
            marketCap: 0,
            lastUpdated: new Date().toISOString(),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 p-2 rounded-xl">
                <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Sniper Bot
              </span>
              <div className="flex items-center gap-2">
                <LiveTime />
                <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">v2.0</span>
              </div>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              wsConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <span className={`relative flex h-2 w-2 ${wsConnected ? 'bg-emerald-500' : 'bg-red-500'} rounded-full`}>
                {wsConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
              </span>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            {botConfig?.isActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/20">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Bot Active
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300"
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
                    className="h-10 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25 transition-all duration-300"
                  >
                    {botToggling === 'stop' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Stop Bot</span>
                    <span className="sm:hidden">Stop</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Stop Trading Bot?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      This will stop all automated trading activities. Any open positions will remain open.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => toggleBot('stop')}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
                    >
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
                className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {botToggling === 'start' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
      <main className="container px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8">
          <StatsCard
            title="Total Value"
            value={`$${totalValue.toFixed(2)}`}
            subtitle={`${positions.length} position${positions.length !== 1 ? 's' : ''}`}
            icon={Wallet}
            gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
          />
          <StatsCard
            title="Total P&L"
            value={`${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toFixed(2)}`}
            subtitle="Unrealized"
            icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
            trend={totalPnL >= 0 ? 'up' : 'down'}
            gradient={totalPnL >= 0 
              ? 'bg-gradient-to-br from-emerald-600 to-green-600' 
              : 'bg-gradient-to-br from-red-600 to-rose-600'
            }
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subtitle="Success rate"
            icon={Target}
            gradient="bg-gradient-to-br from-purple-600 to-pink-600"
          />
          <StatsCard
            title="Total Trades"
            value={trades.length.toString()}
            subtitle={`${trades.filter((t) => t.status === 'completed').length} completed`}
            icon={BarChart3}
            gradient="bg-gradient-to-br from-orange-600 to-amber-600"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="relative">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-12 items-center justify-start gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <LineChart className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="wallet"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <Wallet className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Wallet</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="config"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="trading-activity"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Trading Activity</span>
                  <span className="sm:hidden">Activity</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sniper"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <Crosshair className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sniper</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="help"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2 rounded-lg transition-all duration-300"
                >
                  <HelpCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Help</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Live Prices */}
              <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
                      <DollarSign className="h-5 w-5 text-cyan-400" />
                    </div>
                    Live Prices
                  </CardTitle>
                  <CardDescription className="text-slate-400">Real-time cryptocurrency prices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(prices).slice(0, 8).map((price) => (
                      <div key={price.symbol} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{price.symbol}</span>
                          {price.priceChange24h !== undefined && (
                            <Badge
                              variant="outline"
                              className={
                                price.priceChange24h >= 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }
                            >
                              {price.priceChange24h >= 0 ? '+' : ''}
                              {price.priceChange24h.toFixed(2)}%
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-white">
                          ${price.price < 0.01 ? price.price.toExponential(2) : price.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: price.price < 1 ? 6 : 2,
                          })}
                        </span>
                      </div>
                    ))}
                    {Object.keys(prices).length === 0 && (
                      <div className="text-center text-slate-400 py-8">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                        Waiting for price data...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Open Positions */}
              <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                    </div>
                    Open Positions
                  </CardTitle>
                  <CardDescription className="text-slate-400">Currently active trading positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {positions.slice(0, 5).map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-700/30 p-4 hover:bg-slate-700/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{position.tokenSymbol || 'Unknown'}</span>
                            <Badge variant="outline" className="border-white/10 text-slate-300">{position.amount.toFixed(4)}</Badge>
                          </div>
                          <div className="text-sm text-slate-400">
                            Entry: ${position.entryPrice.toFixed(4)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${
                              (position.profitLossPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {(position.profitLossPercent || 0) >= 0 ? '+' : ''}
                            {(position.profitLossPercent || 0).toFixed(2)}%
                          </div>
                          <div className="text-sm text-slate-400">
                            ${(position.currentValue || position.valueIn).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {positions.length === 0 && (
                      <div className="text-center text-slate-400 py-8">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No open positions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20">
                    <Activity className="h-5 w-5 text-orange-400" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {activityLogs.slice(0, 20).map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                          log.level === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : log.level === 'warning'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : 'bg-slate-700/30 border border-white/5'
                        }`}
                      >
                        {log.level === 'error' ? (
                          <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        ) : log.level === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{log.message}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs border-white/10 text-slate-300 hidden sm:inline-flex">
                          {log.category}
                        </Badge>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="text-center text-slate-400 py-8">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No recent activity
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Wallet Connection */}
              <WalletConnection />
              
              {/* Supported Wallets Info */}
              <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                      <Shield className="h-5 w-5 text-purple-400" />
                    </div>
                    Supported Wallets
                  </CardTitle>
                  <CardDescription className="text-slate-400">
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
                        className="flex items-center gap-2 p-3 rounded-lg border border-white/5 bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-lg">{wallet.icon}</span>
                        <span className="text-sm font-medium text-white">{wallet.name}</span>
                      </div>
                    ))}
                  </div>
                  <Alert className="bg-slate-700/30 border-white/5">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <AlertTitle className="text-white">Security Notice</AlertTitle>
                    <AlertDescription className="text-slate-400">
                      Your wallet is only used for signing transactions. Private keys are never stored or transmitted.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* Supported Networks */}
            <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                    <Activity className="h-5 w-5 text-cyan-400" />
                  </div>
                  Supported Networks & DEXes
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Multi-chain support with various decentralized exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3 text-white">Supported Chains</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Ethereum', 'PulseChain', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 'Avalanche', 'Fantom', 'Linea', 'zkSync', 'Scroll', 'Mantle', 'Celo', 'Gnosis', 'Moonbeam'].map((chain) => (
                        <Badge key={chain} variant="outline" className="border-white/10 text-slate-300 bg-slate-700/30">{chain}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-white">Supported DEXes</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Uniswap', 'PulseX', 'Piteas', 'PancakeSwap', 'SushiSwap', 'QuickSwap', 'BaseSwap', 'Camelot', 'Trader Joe', 'SpookySwap', 'KyberSwap', '1inch', 'Balancer', 'Curve'].map((dex) => (
                        <Badge key={dex} variant="secondary" className="bg-slate-700/50 text-slate-300">{dex}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-10 w-10 animate-spin text-cyan-400" />
                  <span className="text-slate-400">Loading configuration...</span>
                </div>
              </div>
            ) : (
              botConfig && (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Target Token */}
                  <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20">
                          <Target className="h-5 w-5 text-red-400" />
                        </div>
                        Target Token
                      </CardTitle>
                      <CardDescription className="text-slate-400">Configure the token to snipe</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetToken" className="text-white">Token Address</Label>
                        <Input
                          id="targetToken"
                          placeholder="0x..."
                          value={botConfig.targetToken || ''}
                          onChange={(e) => updateBotConfig({ targetToken: e.target.value })}
                          className="bg-slate-700/30 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tokenSymbol" className="text-white">Symbol</Label>
                          <Input
                            id="tokenSymbol"
                            placeholder="TOKEN"
                            value={botConfig.targetTokenSymbol || ''}
                            onChange={(e) => updateBotConfig({ targetTokenSymbol: e.target.value })}
                            className="bg-slate-700/30 border-white/10 text-white placeholder:text-slate-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="baseToken" className="text-white">Base Token</Label>
                          <Select
                            value={botConfig.baseToken}
                            onValueChange={(value) => updateBotConfig({ baseToken: value })}
                          >
                            <SelectTrigger className="bg-slate-700/30 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                              <SelectItem value="WETH">WETH</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                              <SelectItem value="USDT">USDT</SelectItem>
                              <SelectItem value="DAI">DAI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exchange Settings */}
                  <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
                          <Zap className="h-5 w-5 text-yellow-400" />
                        </div>
                        Exchange Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400">DEX and network configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Exchange</Label>
                          <Select
                            value={botConfig.exchange}
                            onValueChange={(value) => updateBotConfig({ exchange: value })}
                          >
                            <SelectTrigger className="bg-slate-700/30 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                              <SelectItem value="uniswap">Uniswap</SelectItem>
                              <SelectItem value="sushiswap">SushiSwap</SelectItem>
                              <SelectItem value="pancakeswap">PancakeSwap</SelectItem>
                              <SelectItem value="quickswap">QuickSwap</SelectItem>
                              <SelectItem value="pulsex">PulseX</SelectItem>
                              <SelectItem value="piteas">Piteas</SelectItem>
                              <SelectItem value="baseswap">BaseSwap</SelectItem>
                              <SelectItem value="camelot">Camelot</SelectItem>
                              <SelectItem value="traderjoe">Trader Joe</SelectItem>
                              <SelectItem value="spookyswap">SpookySwap</SelectItem>
                              <SelectItem value="kyberswap">KyberSwap</SelectItem>
                              <SelectItem value="1inch">1inch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Network</Label>
                          <Select
                            value={botConfig.network}
                            onValueChange={(value) => updateBotConfig({ network: value })}
                          >
                            <SelectTrigger className="bg-slate-700/30 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10 max-h-[200px]">
                              <SelectItem value="ethereum">Ethereum</SelectItem>
                              <SelectItem value="pulsechain">PulseChain</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="arbitrum">Arbitrum</SelectItem>
                              <SelectItem value="optimism">Optimism</SelectItem>
                              <SelectItem value="polygon">Polygon</SelectItem>
                              <SelectItem value="bsc">BSC (BNB Chain)</SelectItem>
                              <SelectItem value="avalanche">Avalanche</SelectItem>
                              <SelectItem value="fantom">Fantom</SelectItem>
                              <SelectItem value="linea">Linea</SelectItem>
                              <SelectItem value="zksync">zkSync Era</SelectItem>
                              <SelectItem value="scroll">Scroll</SelectItem>
                              <SelectItem value="mantle">Mantle</SelectItem>
                              <SelectItem value="celo">Celo</SelectItem>
                              <SelectItem value="gnosis">Gnosis</SelectItem>
                              <SelectItem value="moonbeam">Moonbeam</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rpcUrl" className="text-white">RPC URL (Optional)</Label>
                        <Input
                          id="rpcUrl"
                          placeholder="https://..."
                          value={botConfig.rpcUrl || ''}
                          onChange={(e) => updateBotConfig({ rpcUrl: e.target.value })}
                          className="bg-slate-700/30 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Buy Settings */}
                  <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                        Buy Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400">Configure automatic buy triggers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Buy Trigger Types - Multi-select */}
                      <div className="space-y-2">
                        <Label className="text-white">Buy Trigger Types</Label>
                        <p className="text-xs text-slate-400 mb-2">Select multiple triggers for enhanced bot activity</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'price_drop', label: 'Price Drop', desc: 'Buy on significant price decrease' },
                            { value: 'volume_spike', label: 'Volume Spike', desc: 'Buy on unusual volume increase' },
                            { value: 'liquidity_add', label: 'Liquidity Added', desc: 'Buy when liquidity is added' },
                            { value: 'new_pair', label: 'New Pair', desc: 'Buy on new trading pair detection' },
                            { value: 'manual', label: 'Manual Only', desc: 'Only buy on manual trigger' },
                          ].map((trigger) => {
                            const currentTypes = botConfig.buyTriggerType?.split(',').filter(Boolean) || ['liquidity_add'];
                            const isSelected = currentTypes.includes(trigger.value);
                            
                            const handleToggle = () => {
                              let newTypes: string[];
                              if (isSelected) {
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
                                className={`flex items-start space-x-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-500/10 border-cyan-500/50'
                                    : 'bg-slate-700/30 border-white/5 hover:bg-slate-700/50'
                                }`}
                                onClick={handleToggle}
                              >
                                <Checkbox
                                  id={`config-trigger-${trigger.value}`}
                                  checked={isSelected}
                                  onCheckedChange={handleToggle}
                                  className="mt-0.5 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <div className="grid gap-0.5 leading-none">
                                  <label
                                    htmlFor={`config-trigger-${trigger.value}`}
                                    className="text-xs font-medium text-white cursor-pointer"
                                  >
                                    {trigger.label}
                                  </label>
                                  <span className="text-xs text-slate-400 hidden sm:inline">{trigger.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="buyAmount" className="text-white">Buy Amount</Label>
                          <Input
                            id="buyAmount"
                            type="number"
                            step="0.001"
                            value={botConfig.buyAmount || 0.1}
                            onChange={(e) => updateBotConfig({ buyAmount: parseFloat(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="buySlippage" className="text-white">Slippage (%)</Label>
                          <Input
                            id="buySlippage"
                            type="number"
                            step="0.1"
                            value={botConfig.buySlippage || 5}
                            onChange={(e) => updateBotConfig({ buySlippage: parseFloat(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sell Settings */}
                  <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-rose-500/20">
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        </div>
                        Sell Settings
                      </CardTitle>
                      <CardDescription className="text-slate-400">Configure automatic sell triggers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Take Profit */}
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                          <Label className="text-white">Take Profit</Label>
                          <p className="text-xs text-slate-400">Auto-sell at profit target</p>
                        </div>
                        <Switch
                          checked={botConfig.takeProfitEnabled || false}
                          onCheckedChange={(checked) => updateBotConfig({ takeProfitEnabled: checked })}
                        />
                      </div>
                      {botConfig.takeProfitEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-green-500/50">
                          <div className="space-y-2">
                            <Label className="text-white">Take Profit %</Label>
                            <Input
                              type="number"
                              value={botConfig.takeProfitPercent || 50}
                              onChange={(e) => updateBotConfig({ takeProfitPercent: parseFloat(e.target.value) })}
                              className="bg-slate-700/30 border-white/10 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Sell Amount %</Label>
                            <Input
                              type="number"
                              value={botConfig.takeProfitAmount || 100}
                              onChange={(e) => updateBotConfig({ takeProfitAmount: parseFloat(e.target.value) })}
                              className="bg-slate-700/30 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      )}

                      <Separator className="bg-white/5" />

                      {/* Stop Loss */}
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                          <Label className="text-white">Stop Loss</Label>
                          <p className="text-xs text-slate-400">Auto-sell at loss limit</p>
                        </div>
                        <Switch
                          checked={botConfig.stopLossEnabled || false}
                          onCheckedChange={(checked) => updateBotConfig({ stopLossEnabled: checked })}
                        />
                      </div>
                      {botConfig.stopLossEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-red-500/50">
                          <div className="space-y-2">
                            <Label className="text-white">Stop Loss %</Label>
                            <Input
                              type="number"
                              value={botConfig.stopLossPercent || 15}
                              onChange={(e) => updateBotConfig({ stopLossPercent: parseFloat(e.target.value) })}
                              className="bg-slate-700/30 border-white/10 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Type</Label>
                            <Select
                              value={botConfig.stopLossType || 'fixed'}
                              onValueChange={(value) => updateBotConfig({ stopLossType: value })}
                            >
                              <SelectTrigger className="bg-slate-700/30 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="fixed">Fixed</SelectItem>
                                <SelectItem value="trailing">Trailing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <Separator className="bg-white/5" />

                      {/* Trailing Stop */}
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                          <Label className="text-white">Trailing Stop</Label>
                          <p className="text-xs text-slate-400">Dynamic stop that follows price</p>
                        </div>
                        <Switch
                          checked={botConfig.trailingStopEnabled || false}
                          onCheckedChange={(checked) => updateBotConfig({ trailingStopEnabled: checked })}
                        />
                      </div>
                      {botConfig.trailingStopEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-purple-500/50">
                          <div className="space-y-2">
                            <Label className="text-white">Trail %</Label>
                            <Input
                              type="number"
                              value={botConfig.trailingStopPercent || 5}
                              onChange={(e) => updateBotConfig({ trailingStopPercent: parseFloat(e.target.value) })}
                              className="bg-slate-700/30 border-white/10 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Activation %</Label>
                            <Input
                              type="number"
                              value={botConfig.trailingStopActivation || 10}
                              onChange={(e) => updateBotConfig({ trailingStopActivation: parseFloat(e.target.value) })}
                              className="bg-slate-700/30 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Risk Management */}
                  <Card className="md:col-span-2 bg-slate-800/50 border-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20">
                          <Shield className="h-5 w-5 text-orange-400" />
                        </div>
                        Risk Management
                      </CardTitle>
                      <CardDescription className="text-slate-400">Protect your capital with smart limits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label className="text-white">Max Position Size</Label>
                          <Input
                            type="number"
                            value={botConfig.maxPositionSize || 1}
                            onChange={(e) => updateBotConfig({ maxPositionSize: parseFloat(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Max Daily Loss</Label>
                          <Input
                            type="number"
                            value={botConfig.maxDailyLoss || 0.5}
                            onChange={(e) => updateBotConfig({ maxDailyLoss: parseFloat(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Max Daily Trades</Label>
                          <Input
                            type="number"
                            value={botConfig.maxDailyTrades || 10}
                            onChange={(e) => updateBotConfig({ maxDailyTrades: parseInt(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Max Open Positions</Label>
                          <Input
                            type="number"
                            value={botConfig.maxOpenPositions || 5}
                            onChange={(e) => updateBotConfig({ maxOpenPositions: parseInt(e.target.value) })}
                            className="bg-slate-700/30 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={botConfig.mevProtection || false}
                            onCheckedChange={(checked) => updateBotConfig({ mevProtection: checked })}
                          />
                          <Label className="text-white text-sm">MEV Protection</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={botConfig.autoApprove || false}
                            onCheckedChange={(checked) => updateBotConfig({ autoApprove: checked })}
                          />
                          <Label className="text-white text-sm">Auto Approve</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={botConfig.flashLoanDetection || false}
                            onCheckedChange={(checked) => updateBotConfig({ flashLoanDetection: checked })}
                          />
                          <Label className="text-white text-sm">Flash Loan Detection</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </TabsContent>

          {/* Trading Activity Tab */}
          <TabsContent value="trading-activity" className="space-y-6">
            {/* Trades Table */}
            <Card className="bg-slate-800/50 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                    <History className="h-5 w-5 text-blue-400" />
                  </div>
                  Trade History
                </CardTitle>
                <CardDescription className="text-slate-400">Recent trades executed by the bot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-white/5 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-slate-700/30">
                        <TableHead className="text-slate-400">Type</TableHead>
                        <TableHead className="text-slate-400">Token</TableHead>
                        <TableHead className="text-slate-400">Amount</TableHead>
                        <TableHead className="text-slate-400">Price</TableHead>
                        <TableHead className="text-slate-400">P&L</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.slice(0, 10).map((trade) => (
                        <TableRow key={trade.id} className="border-white/5 hover:bg-slate-700/30">
                          <TableCell>
                            <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'} className={`${trade.type === 'buy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {trade.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{trade.tokenSymbol || 'Unknown'}</TableCell>
                          <TableCell className="text-white font-mono">{trade.amountIn}</TableCell>
                          <TableCell className="text-white font-mono">${trade.price?.toFixed(4) || '-'}</TableCell>
                          <TableCell className={`font-mono ${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profitLoss ? `${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trade.status === 'completed' ? 'default' : 'secondary'} className={`${trade.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {trade.executedAt ? new Date(trade.executedAt).toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {trades.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                            No trades yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sniper Tab */}
          <TabsContent value="sniper" className="space-y-6">
            <SniperPanel />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <DocumentationPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm py-4 mt-auto">
        <div className="container flex items-center justify-between px-4 sm:px-6 text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <span>Sniper Bot v2.0</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Multi-chain DEX Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-500">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            </span>
            <span className="hidden sm:inline">System Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
