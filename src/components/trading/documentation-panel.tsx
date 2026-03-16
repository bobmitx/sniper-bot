'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  Settings,
  DollarSign,
  Percent,
  Clock,
  Wallet,
  Activity,
  BookOpen,
} from 'lucide-react';

export function DocumentationPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Documentation</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Complete guide to configuring your trading bot</p>
        </div>
      </div>

      {/* Quick Start */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Quick Start Guide</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Connect your wallet in the Wallet tab</li>
            <li>Configure your target token address in Configuration</li>
            <li>Set your buy/sell parameters</li>
            <li>Click &quot;Start Bot&quot; to begin automated trading</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Main Documentation Accordion */}
      <Accordion type="multiple" className="space-y-3">
        {/* Target Token Section */}
        <AccordionItem value="target-token" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Target Token</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Required</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The target token is the cryptocurrency you want the bot to monitor and trade. This is the core setting that determines what asset the bot will snipe.
              </p>
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Settings className="h-4 w-4" />
                  Configuration Fields
                </h4>
                
                <div className="grid gap-3 pl-4 sm:pl-6">
                  <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                    <h5 className="font-medium text-sm">Token Address</h5>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      The contract address of the token you want to trade (e.g., <code className="bg-muted px-1 rounded text-xs">0x1234...abcd</code>).
                      This is the unique identifier for any token on the blockchain. You can find token addresses on block explorers like 
                      Etherscan, PulseScan, or BscScan.
                    </p>
                    <Alert className="mt-2" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Always verify token addresses to avoid scam tokens with similar names!
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                    <h5 className="font-medium text-sm">Symbol</h5>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      A short identifier for the token (e.g., ETH, USDC, PLS). This is for display purposes only and helps you 
                      identify the token in the dashboard.
                    </p>
                  </div>
                  
                  <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                    <h5 className="font-medium text-sm">Base Token</h5>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      The token you&apos;re trading <strong>with</strong> (not for). Options include WETH, USDC, USDT, or DAI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h5 className="font-medium mb-2 text-sm">Best Practices</h5>
                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 text-muted-foreground">
                  <li>Verify the token address on the official project website</li>
                  <li>Check token liquidity before setting as target</li>
                  <li>For new tokens, wait for liquidity to be added before sniping</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Exchange Settings Section */}
        <AccordionItem value="exchange-settings" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Exchange Settings</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Network</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure which decentralized exchange (DEX) and blockchain network the bot will use for trading operations.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-base">Exchange Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Choose the DEX where your target token is traded:
                    </p>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between"><span>Uniswap</span><Badge variant="secondary" className="text-xs">Ethereum</Badge></div>
                      <div className="flex justify-between"><span>PulseX</span><Badge variant="secondary" className="text-xs">PulseChain</Badge></div>
                      <div className="flex justify-between"><span>PancakeSwap</span><Badge variant="secondary" className="text-xs">BSC</Badge></div>
                      <div className="flex justify-between"><span>SushiSwap</span><Badge variant="secondary" className="text-xs">Multi-chain</Badge></div>
                      <div className="flex justify-between"><span>BaseSwap</span><Badge variant="secondary" className="text-xs">Base</Badge></div>
                      <div className="flex justify-between"><span>Camelot</span><Badge variant="secondary" className="text-xs">Arbitrum</Badge></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-base">Network Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      Select the blockchain network (17+ supported):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {['Ethereum', 'PulseChain', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 'Avalanche', 'Fantom'].map(n => (
                        <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                <h5 className="font-medium text-sm">Custom RPC URL (Optional)</h5>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Override the default RPC endpoint with your own for faster transactions or better reliability.
                  Services like Alchemy, Infura, or QuickNode provide dedicated RPC access.
                </p>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Using a private RPC can reduce latency and improve sniping success rates significantly.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Buy Settings Section */}
        <AccordionItem value="buy-settings" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Buy Settings</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Entry</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure how and when the bot automatically buys the target token.
              </p>

              <div className="border-l-2 border-green-500/50 pl-3 sm:pl-4">
                <h5 className="font-medium text-sm">Buy Trigger Types</h5>
                <div className="space-y-2 mt-2">
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Price Drop</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Buy when price drops by a specified percentage.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Liquidity Added</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Buy when liquidity is added to the pool. Essential for new token sniping.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">New Pair</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Automatically snipe new trading pairs. Fastest for new launches.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="border-l-2 border-green-500/50 pl-3 sm:pl-4">
                  <h5 className="font-medium flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Buy Amount
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    The amount of base token to spend per buy order. Determines position size for each trade.
                  </p>
                </div>

                <div className="border-l-2 border-green-500/50 pl-3 sm:pl-4">
                  <h5 className="font-medium flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4" />
                    Slippage (%)
                  </h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Maximum acceptable price difference. Recommended: 1-5% for liquid tokens, 5-15% for volatile tokens.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sell Settings Section */}
        <AccordionItem value="sell-settings" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Sell Settings</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Exit</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure how and when the bot automatically sells to secure profits or limit losses.
              </p>

              <div className="border-l-2 border-red-500/50 pl-3 sm:pl-4">
                <h5 className="font-medium text-sm">Sell Trigger Types</h5>
                <div className="space-y-2 mt-2">
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Take Profit</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Sell when profit reaches your target percentage.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Stop Loss</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Sell when loss exceeds your limit. Prevents catastrophic losses.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Trailing Stop</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Follow price up and sell when it drops by a percentage from peak.</p>
                  </div>
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 p-3 sm:p-4 rounded-lg">
                <h5 className="font-medium text-destructive flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Important Warning
                </h5>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Always configure stop loss to protect your capital. Without it, you could lose your entire position.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Risk Management Section */}
        <AccordionItem value="risk-management" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Risk Management</span>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Protection</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Advanced settings to protect your trading capital and manage exposure.
              </p>

              <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                <h5 className="font-medium text-sm">Position Sizing Methods</h5>
                <div className="space-y-2 mt-2">
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Fixed Amount</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Use a fixed amount per trade. Simplest method.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Portfolio %</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Risk a percentage of your total portfolio per trade.</p>
                  </div>
                  <div className="bg-muted/50 p-2 sm:p-3 rounded">
                    <span className="font-medium text-sm">Kelly Criterion</span>
                    <p className="text-xs sm:text-sm text-muted-foreground">Mathematical formula based on win rate. Optimal for experienced traders.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                  <h5 className="font-medium text-sm">Max Position Size</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Maximum amount for a single position. Prevents over-exposure.
                  </p>
                </div>
                <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                  <h5 className="font-medium text-sm">Max Daily Loss</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Stop trading if losses exceed this amount per day.
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-primary/50 pl-3 sm:pl-4">
                <h5 className="font-medium flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Cooldown Period
                </h5>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Minimum time between trades. Recommended: 300-600 seconds (5-10 minutes).
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Security Features Section */}
        <AccordionItem value="security" className="border rounded-lg">
          <AccordionTrigger className="px-3 sm:px-4 hover:no-underline min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Security Features</span>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">Protection</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 sm:px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Built-in security measures to protect your trades from malicious actors.
              </p>

              <div className="space-y-3">
                <div className="border-l-2 border-green-500/50 pl-3 sm:pl-4">
                  <h5 className="font-medium text-sm">MEV Protection</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Protects against front-running attacks where bots profit from your trades. Uses private mempools and flashbots.
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">Recommended: ON</Badge>
                </div>

                <div className="border-l-2 border-green-500/50 pl-3 sm:pl-4">
                  <h5 className="font-medium text-sm">Flash Loan Detection</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Detects potential flash loan attacks where attackers borrow massive amounts to manipulate prices temporarily.
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">Recommended: ON</Badge>
                </div>

                <div className="border-l-2 border-yellow-500/50 pl-3 sm:pl-4">
                  <h5 className="font-medium text-sm">Auto-Approve Tokens</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatically approve token spending. Enables faster trading but use with caution.
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">Optional</Badge>
                </div>
              </div>

              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertTitle className="text-sm">Wallet Security</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  Your private keys are <strong>never</strong> stored or transmitted. The bot only requests transaction signatures 
                  from your connected wallet.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="h-5 w-5" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Check the Activity tab for real-time bot logs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Review your positions in the Positions tab</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Use the Refresh button to sync latest data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Always test with small amounts first</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
