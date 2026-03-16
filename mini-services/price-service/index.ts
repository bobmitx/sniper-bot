import { Server } from 'socket.io';

const PORT = 3003;

// Simulated token prices with realistic values
const TOKENS = {
  WETH: { price: 2450.00, basePrice: 2450.00, volatility: 0.002 },
  ETH: { price: 2450.00, basePrice: 2450.00, volatility: 0.002 },
  USDC: { price: 1.00, basePrice: 1.00, volatility: 0.0001 },
  USDT: { price: 1.00, basePrice: 1.00, volatility: 0.0001 },
  WBTC: { price: 67500.00, basePrice: 67500.00, volatility: 0.003 },
  LINK: { price: 14.25, basePrice: 14.25, volatility: 0.004 },
  UNI: { price: 7.85, basePrice: 7.85, volatility: 0.005 },
  AAVE: { price: 92.50, basePrice: 92.50, volatility: 0.005 },
  MKR: { price: 2850.00, basePrice: 2850.00, volatility: 0.004 },
  PEPE: { price: 0.000012, basePrice: 0.000012, volatility: 0.01 },
  SHIB: { price: 0.00002, basePrice: 0.00002, volatility: 0.008 },
  DOGE: { price: 0.15, basePrice: 0.15, volatility: 0.006 },
};

// Price history for chart data
const priceHistory: Record<string, Array<{ time: number; price: number; volume: number }>> = {};

// Initialize price history
Object.keys(TOKENS).forEach((symbol) => {
  priceHistory[symbol] = [];
  for (let i = 0; i < 60; i++) {
    priceHistory[symbol].push({
      time: Date.now() - (60 - i) * 1000,
      price: TOKENS[symbol as keyof typeof TOKENS].price * (1 + (Math.random() - 0.5) * 0.02),
      volume: Math.random() * 100000,
    });
  }
});

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`Price WebSocket service running on port ${PORT}`);

// Simulate price movements
setInterval(() => {
  Object.keys(TOKENS).forEach((symbol) => {
    const token = TOKENS[symbol as keyof typeof TOKENS];
    
    // Random walk with mean reversion
    const random = (Math.random() - 0.5) * 2;
    const meanReversion = (token.basePrice - token.price) * 0.001;
    const change = token.price * token.volatility * random + meanReversion;
    
    token.price = Math.max(token.price * 0.001, token.price + change);
    
    // Update price history
    const history = priceHistory[symbol];
    if (history) {
      history.push({
        time: Date.now(),
        price: token.price,
        volume: Math.random() * 100000,
      });
      
      // Keep only last 100 data points
      if (history.length > 100) {
        history.shift();
      }
    }
    
    // Emit price update
    io.emit('price_update', {
      symbol,
      price: token.price,
      change: ((token.price - token.basePrice) / token.basePrice) * 100,
      timestamp: Date.now(),
    });
  });
}, 1000);

// Generate trade signals occasionally
setInterval(() => {
  const symbols = Object.keys(TOKENS);
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const token = TOKENS[randomSymbol as keyof typeof TOKENS];
  
  // Random signal type
  const signalTypes = ['buy', 'sell', 'alert'];
  const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)] as 'buy' | 'sell' | 'alert';
  
  const signal = {
    type: signalType,
    symbol: randomSymbol,
    price: token.price,
    confidence: 0.5 + Math.random() * 0.5,
    reason: signalType === 'buy' 
      ? 'Price drop detected - potential entry point'
      : signalType === 'sell'
      ? 'Take profit target reached'
      : 'Unusual volume detected',
    timestamp: Date.now(),
  };
  
  io.emit('trade_signal', signal);
}, 5000 + Math.random() * 10000);

// Handle client connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial data
  socket.emit('connected', {
    message: 'Connected to price service',
    tokens: Object.entries(TOKENS).map(([symbol, data]) => ({
      symbol,
      price: data.price,
      change: ((data.price - data.basePrice) / data.basePrice) * 100,
    })),
  });
  
  // Handle subscription to specific token
  socket.on('subscribe', (symbol: string) => {
    socket.join(`token:${symbol}`);
    
    // Send current price history
    const history = priceHistory[symbol.toUpperCase()];
    if (history) {
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
    const token = TOKENS[data.symbol.toUpperCase() as keyof typeof TOKENS];
    
    if (!token) {
      socket.emit('error', { message: `Unknown token: ${data.symbol}` });
      return;
    }
    
    const trade = {
      id: `sim_${Date.now()}`,
      type: data.type,
      symbol: data.symbol.toUpperCase(),
      amount: data.amount,
      price: token.price,
      total: data.amount * token.price,
      timestamp: Date.now(),
      status: 'simulated',
    };
    
    io.emit('trade_executed', trade);
    console.log(`Simulated trade: ${data.type} ${data.amount} ${data.symbol} @ ${token.price}`);
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
