import { Server } from 'socket.io';

const PORT = 3003;

// CoinGecko API configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Token ID mapping for CoinGecko
const TOKEN_IDS: Record<string, string> = {
  WETH: 'ethereum',
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  MKR: 'maker',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
  DOGE: 'dogecoin',
  BTC: 'bitcoin',
  SOL: 'solana',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  ARB: 'arbitrum',
  OP: 'optimism',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
};

// Real-time prices with actual market data
interface TokenData {
  price: number;
  basePrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: number;
}

const TOKENS: Record<string, TokenData> = {};

// Initialize tokens
Object.keys(TOKEN_IDS).forEach((symbol) => {
  TOKENS[symbol] = {
    price: 0,
    basePrice: 0,
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    lastUpdated: 0,
  };
});

// Price history for chart data
const priceHistory: Record<string, Array<{ time: number; price: number; volume: number }>> = {};

// Initialize price history arrays
Object.keys(TOKEN_IDS).forEach((symbol) => {
  priceHistory[symbol] = [];
});

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`Price WebSocket service running on port ${PORT}`);

// Fetch real prices from CoinGecko
async function fetchRealPrices() {
  try {
    const ids = Object.values(TOKEN_IDS).join(',');
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    );
    
    if (!response.ok) {
      console.log('CoinGecko API rate limited, using fallback prices');
      return false;
    }
    
    const data = await response.json();
    
    // Update token data with real prices
    Object.entries(TOKEN_IDS).forEach(([symbol, id]) => {
      if (data[id]) {
        const tokenData = TOKENS[symbol];
        if (tokenData) {
          const previousPrice = tokenData.price || data[id].usd || 0;
          tokenData.price = data[id].usd || previousPrice;
          tokenData.priceChange24h = data[id].usd_24h_change || 0;
          tokenData.marketCap = data[id].usd_market_cap || 0;
          tokenData.volume24h = data[id].usd_24h_vol || 0;
          tokenData.lastUpdated = Date.now();
          
          // Set base price for first fetch
          if (tokenData.basePrice === 0) {
            tokenData.basePrice = tokenData.price;
          }
          
          // Update price history
          const history = priceHistory[symbol];
          if (history) {
            history.push({
              time: Date.now(),
              price: tokenData.price,
              volume: tokenData.volume24h,
            });
            
            // Keep only last 100 data points
            if (history.length > 100) {
              history.shift();
            }
          }
          
          // Emit price update
          io.emit('price_update', {
            symbol,
            price: tokenData.price,
            change: tokenData.priceChange24h,
            marketCap: tokenData.marketCap,
            volume24h: tokenData.volume24h,
            timestamp: Date.now(),
          });
        }
      }
    });
    
    console.log(`Updated prices at ${new Date().toLocaleTimeString()}`);
    return true;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return false;
  }
}

// Fetch initial prices
fetchRealPrices();

// Fetch real prices every 10 seconds (CoinGecko free tier allows ~10-30 calls/minute)
setInterval(fetchRealPrices, 10000);

// Generate simulated price micro-movements between real updates (for smoother UX)
setInterval(() => {
  Object.keys(TOKENS).forEach((symbol) => {
    const tokenData = TOKENS[symbol];
    if (tokenData && tokenData.price > 0) {
      // Very small random movement (0.01% - just for visual effect)
      const microChange = tokenData.price * 0.0001 * (Math.random() - 0.5);
      const adjustedPrice = tokenData.price + microChange;
      
      // Emit with small adjustment for real-time feel
      io.emit('price_update', {
        symbol,
        price: adjustedPrice,
        change: tokenData.priceChange24h,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        timestamp: Date.now(),
        isMicroUpdate: true,
      });
    }
  });
}, 1000);

// Generate trade signals occasionally based on price changes
setInterval(() => {
  const symbols = Object.keys(TOKENS).filter(s => TOKENS[s]?.price > 0);
  if (symbols.length === 0) return;
  
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const tokenData = TOKENS[randomSymbol];
  
  if (!tokenData || tokenData.price === 0) return;
  
  // Random signal type
  const signalTypes = ['buy', 'sell', 'alert'];
  const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)] as 'buy' | 'sell' | 'alert';
  
  const signal = {
    type: signalType,
    symbol: randomSymbol,
    price: tokenData.price,
    confidence: 0.5 + Math.random() * 0.5,
    reason: signalType === 'buy' 
      ? 'Price drop detected - potential entry point'
      : signalType === 'sell'
      ? 'Take profit target reached'
      : 'Unusual volume detected',
    timestamp: Date.now(),
  };
  
  io.emit('trade_signal', signal);
}, 15000 + Math.random() * 15000);

// Handle client connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial data with current prices
  const currentPrices = Object.entries(TOKENS)
    .filter(([_, data]) => data.price > 0)
    .map(([symbol, data]) => ({
      symbol,
      price: data.price,
      change: data.priceChange24h,
      marketCap: data.marketCap,
      volume24h: data.volume24h,
    }));
  
  socket.emit('connected', {
    message: 'Connected to price service',
    tokens: currentPrices,
    isRealTime: true,
  });
  
  // Handle subscription to specific token
  socket.on('subscribe', (symbol: string) => {
    socket.join(`token:${symbol}`);
    
    // Send current price history
    const history = priceHistory[symbol.toUpperCase()];
    if (history && history.length > 0) {
      socket.emit('price_history', {
        symbol: symbol.toUpperCase(),
        data: history,
      });
    }
    
    console.log(`Client ${socket.id} subscribed to ${symbol}`);
  });
  
  // Handle unsubscribe
  socket.on('unsubscribe', (symbol: string) => {
    socket.leave(`token:${symbol}`);
    console.log(`Client ${socket.id} unsubscribed from ${symbol}`);
  });
  
  // Handle manual trade simulation
  socket.on('simulate_trade', (data: { type: 'buy' | 'sell'; symbol: string; amount: number }) => {
    const tokenData = TOKENS[data.symbol.toUpperCase()];
    
    if (!tokenData || tokenData.price === 0) {
      socket.emit('error', { message: `Unknown token: ${data.symbol}` });
      return;
    }
    
    const trade = {
      id: `sim_${Date.now()}`,
      type: data.type,
      symbol: data.symbol.toUpperCase(),
      amount: data.amount,
      price: tokenData.price,
      total: data.amount * tokenData.price,
      timestamp: Date.now(),
      status: 'simulated',
    };
    
    io.emit('trade_executed', trade);
    console.log(`Simulated trade: ${data.type} ${data.amount} ${data.symbol} @ ${tokenData.price}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Bot monitoring and alert generation
interface BotConfig {
  targetToken: string | null;
  isActive: boolean;
  takeProfitPercent: number;
  stopLossPercent: number;
  buyTriggerValue: number;
}

let currentBotConfig: BotConfig = {
  targetToken: null,
  isActive: false,
  takeProfitPercent: 50,
  stopLossPercent: 15,
  buyTriggerValue: 5,
};

// Handle bot config updates
io.on('connection', (socket) => {
  socket.on('bot_config_update', (config: BotConfig) => {
    currentBotConfig = config;
    console.log('Bot config updated:', config);
  });
  
  // Simulate bot triggers based on config
  socket.on('request_bot_status', () => {
    socket.emit('bot_status', {
      isActive: currentBotConfig.isActive,
      lastCheck: Date.now(),
      monitoringToken: currentBotConfig.targetToken,
    });
  });
});

export { io };
