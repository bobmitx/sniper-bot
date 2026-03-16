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
} from 'lucide-react';

export function TradingDashboard() {
  const socketRef = useRef<SocketType | null>(null);
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
        });
        socketRef.current = socket as unknown as SocketType;

        socket.on('connect', () => {
          setWsConnected(true);
          console.log('WebSocket connected');
        });

        socket.on('disconnect', () => {
          setWsConnected(false);
          console.log('WebSocket disconnected');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Sniper Bot</span>
            </div>
            <Badge variant={wsConnected ? 'default' : 'secondary'} className="ml-2">
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
            {botConfig?.isActive && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Activity className="mr-1 h-3 w-3 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBotConfig();
                fetchTrades();
                fetchPositions();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {botConfig?.isActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isBotStarting}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Bot
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
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Bot
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across {positions.length} positions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(4)} ETH
              </div>
              <p className="text-xs text-muted-foreground">
                Unrealized profit/loss
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <Progress value={winRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground">
                {trades.filter((t) => t.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">
              <LineChart className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="wallet">
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="positions">
              <Target className="mr-2 h-4 w-4" />
              Positions
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Bell className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Live Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Live Prices
                  </CardTitle>
                  <CardDescription>Real-time cryptocurrency prices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(prices).slice(0, 8).map((price) => (
                      <div key={price.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{price.symbol}</span>
                          {price.priceChange24h !== undefined && (
                            <Badge
                              variant="outline"
                              className={
                                price.priceChange24h >= 0
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-red-500/10 text-red-500'
                              }
                            >
                              {price.priceChange24h >= 0 ? '+' : ''}
                              {price.priceChange24h.toFixed(2)}%
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono">
                          ${price.price < 0.01 ? price.price.toExponential(2) : price.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: price.price < 1 ? 6 : 2,
                          })}
                        </span>
                      </div>
                    ))}
                    {Object.keys(prices).length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        Waiting for price data...
                      </div>
                    )}
                  </div>
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
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {activityLogs.slice(0, 20).map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 rounded-lg p-2 ${
                          log.level === 'error'
                            ? 'bg-red-500/10'
                            : log.level === 'warning'
                            ? 'bg-yellow-500/10'
                            : 'bg-muted'
                        }`}
                      >
                        {log.level === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        ) : log.level === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
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
                      <CardDescription>Configure the token to snipe</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetToken">Token Address</Label>
                        <Input
                          id="targetToken"
                          placeholder="0x..."
                          value={botConfig.targetToken || ''}
                          onChange={(e) => updateBotConfig({ targetToken: e.target.value })}
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
                              <SelectItem value="radioshack">RadioShack</SelectItem>
                              <SelectItem value="kyberswap">KyberSwap</SelectItem>
                              <SelectItem value="1inch">1inch</SelectItem>
                              <SelectItem value="balancer">Balancer</SelectItem>
                              <SelectItem value="curve">Curve Finance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select
                            value={botConfig.network}
                            onValueChange={(value) => updateBotConfig({ network: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                              <SelectItem value="moonriver">Moonriver</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rpcUrl">RPC URL (Optional)</Label>
                        <Input
                          id="rpcUrl"
                          placeholder="https://..."
                          value={botConfig.rpcUrl || ''}
                          onChange={(e) => updateBotConfig({ rpcUrl: e.target.value })}
                        />
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
                      <div className="space-y-2">
                        <Label>Buy Trigger Type</Label>
                        <Select
                          value={botConfig.buyTriggerType}
                          onValueChange={(value) => updateBotConfig({ buyTriggerType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price_drop">Price Drop</SelectItem>
                            <SelectItem value="volume_spike">Volume Spike</SelectItem>
                            <SelectItem value="liquidity_add">Liquidity Added</SelectItem>
                            <SelectItem value="new_pair">New Pair</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Trigger Value: {botConfig.buyTriggerValue}%</Label>
                        <Slider
                          value={[botConfig.buyTriggerValue]}
                          onValueChange={([value]) => updateBotConfig({ buyTriggerValue: value })}
                          max={50}
                          step={0.5}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Buy Amount (ETH)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={botConfig.buyAmount}
                            onChange={(e) => updateBotConfig({ buyAmount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slippage (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={botConfig.buySlippage}
                            onChange={(e) => updateBotConfig({ buySlippage: parseFloat(e.target.value) || 0 })}
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
                            value={botConfig.buyGasPrice}
                            onChange={(e) => updateBotConfig({ buyGasPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gas Limit</Label>
                          <Input
                            type="number"
                            min="21000"
                            value={botConfig.buyGasLimit}
                            onChange={(e) => updateBotConfig({ buyGasLimit: parseInt(e.target.value) || 21000 })}
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
                          value={botConfig.sellSlippage}
                          onChange={(e) => updateBotConfig({ sellSlippage: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gas Price (Gwei)</Label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={botConfig.sellGasPrice}
                            onChange={(e) => updateBotConfig({ sellGasPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gas Limit</Label>
                          <Input
                            type="number"
                            min="21000"
                            value={botConfig.sellGasLimit}
                            onChange={(e) => updateBotConfig({ sellGasLimit: parseInt(e.target.value) || 21000 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sell Trigger Value</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={botConfig.sellTriggerValue}
                          onChange={(e) => updateBotConfig({ sellTriggerValue: parseFloat(e.target.value) || 0 })}
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
                                value={botConfig.takeProfitPercent}
                                onChange={(e) => updateBotConfig({ takeProfitPercent: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sell Amount %</Label>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                max="100"
                                value={botConfig.takeProfitAmount}
                                onChange={(e) => updateBotConfig({ takeProfitAmount: parseFloat(e.target.value) || 100 })}
                              />
                            </div>
                          </div>
                          <Slider
                            value={[botConfig.takeProfitPercent]}
                            onValueChange={([value]) => updateBotConfig({ takeProfitPercent: value })}
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
                                value={botConfig.stopLossPercent}
                                onChange={(e) => updateBotConfig({ stopLossPercent: parseFloat(e.target.value) || 0 })}
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
                            onValueChange={([value]) => updateBotConfig({ stopLossPercent: value })}
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
                              value={botConfig.trailingStopPercent}
                              onChange={(e) => updateBotConfig({ trailingStopPercent: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Activation %</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={botConfig.trailingStopActivation}
                              onChange={(e) => updateBotConfig({ trailingStopActivation: parseFloat(e.target.value) || 0 })}
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
                          <Label>Max Position (ETH)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={botConfig.maxPositionSize}
                            onChange={(e) => updateBotConfig({ maxPositionSize: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Daily Loss (ETH)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={botConfig.maxDailyLoss}
                            onChange={(e) => updateBotConfig({ maxDailyLoss: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Daily Trades</Label>
                          <Input
                            type="number"
                            min="1"
                            value={botConfig.maxDailyTrades}
                            onChange={(e) => updateBotConfig({ maxDailyTrades: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Open Positions</Label>
                          <Input
                            type="number"
                            min="1"
                            value={botConfig.maxOpenPositions}
                            onChange={(e) => updateBotConfig({ maxOpenPositions: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cooldown Period (sec)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={botConfig.cooldownPeriod}
                            onChange={(e) => updateBotConfig({ cooldownPeriod: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Min Position Size (ETH)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={botConfig.minPositionSize}
                            onChange={(e) => updateBotConfig({ minPositionSize: parseFloat(e.target.value) || 0 })}
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

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
                <CardDescription>
                  Manage your current trading positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Stop Loss</TableHead>
                      <TableHead>Take Profit</TableHead>
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
                        <TableCell>
                          {position.stopLossPrice
                            ? `$${position.stopLossPrice.toFixed(6)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {position.takeProfitPrice
                            ? `$${position.takeProfitPrice.toFixed(6)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>All executed trades</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount In</TableHead>
                        <TableHead>Amount Out</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>Time</TableHead>
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
                          <TableCell>
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
                          <TableCell className="text-muted-foreground">
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
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>All bot activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 rounded-lg p-3 ${
                          log.level === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : log.level === 'warning'
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : log.level === 'debug'
                            ? 'bg-muted/50'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="mt-0.5">
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.message}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                          </div>
                          {log.details && (
                            <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
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
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 mt-auto border-t bg-background py-4">
        <div className="container flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Sniper Bot v1.0</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Network: {botConfig?.network || 'Not configured'}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Exchange: {botConfig?.exchange || 'Not configured'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <LiveTime />
          </div>
        </div>
      </footer>
    </div>
  );
}
