import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simulated token prices for demo purposes
const TOKEN_PRICES: Record<string, { price: number; change24h: number; volume: number; marketCap: number }> = {
  'WETH': { price: 2450.00, change24h: 2.5, volume: 1250000000, marketCap: 295000000000 },
  'ETH': { price: 2450.00, change24h: 2.5, volume: 1250000000, marketCap: 295000000000 },
  'USDC': { price: 1.00, change24h: 0.01, volume: 3500000000, marketCap: 42000000000 },
  'USDT': { price: 1.00, change24h: 0.02, volume: 4200000000, marketCap: 95000000000 },
  'DAI': { price: 1.00, change24h: 0.01, volume: 280000000, marketCap: 5300000000 },
  'WBTC': { price: 67500.00, change24h: 1.8, volume: 380000000, marketCap: 10500000000 },
  'LINK': { price: 14.25, change24h: -1.2, volume: 450000000, marketCap: 8500000000 },
  'UNI': { price: 7.85, change24h: 3.5, volume: 180000000, marketCap: 4800000000 },
  'AAVE': { price: 92.50, change24h: 4.2, volume: 125000000, marketCap: 1400000000 },
  'MKR': { price: 2850.00, change24h: -0.8, volume: 85000000, marketCap: 2600000000 },
};

// GET - Fetch market data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const simulate = searchParams.get('simulate') === 'true';
    
    if (token) {
      // Fetch specific token data
      const tokenData = TOKEN_PRICES[token.toUpperCase()];
      
      if (!tokenData) {
        // Generate random data for unknown tokens
        const randomPrice = 0.001 + Math.random() * 10;
        const randomChange = (Math.random() - 0.5) * 20;
        
        return NextResponse.json({
          success: true,
          data: {
            symbol: token.toUpperCase(),
            price: randomPrice,
            priceChange24h: randomChange,
            volume24h: Math.random() * 1000000,
            marketCap: randomPrice * 1000000,
            liquidity: Math.random() * 500000,
            lastUpdated: new Date(),
          },
        });
      }
      
      // Add some randomness to simulate live prices
      const priceVariation = simulate ? (Math.random() - 0.5) * 0.02 : 0;
      const price = tokenData.price * (1 + priceVariation);
      
      return NextResponse.json({
        success: true,
        data: {
          symbol: token.toUpperCase(),
          price,
          priceChange24h: tokenData.change24h,
          volume24h: tokenData.volume,
          marketCap: tokenData.marketCap,
          liquidity: tokenData.volume * 0.1,
          lastUpdated: new Date(),
        },
      });
    }
    
    // Fetch all market data
    const marketData = Object.entries(TOKEN_PRICES).map(([symbol, data]) => ({
      symbol,
      price: data.price * (simulate ? 1 + (Math.random() - 0.5) * 0.01 : 1),
      priceChange24h: data.change24h,
      volume24h: data.volume,
      marketCap: data.marketCap,
    }));
    
    return NextResponse.json({
      success: true,
      data: marketData,
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

// POST - Subscribe to price updates (stores in database)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAddress, symbol } = body;
    
    if (!tokenAddress) {
      return NextResponse.json(
        { success: false, error: 'Token address is required' },
        { status: 400 }
      );
    }
    
    // Store or update market data
    const existingData = await db.marketData.findUnique({
      where: { tokenAddress },
    });
    
    const priceData = TOKEN_PRICES[symbol?.toUpperCase() || ''] || {
      price: 0.001 + Math.random() * 10,
      change24h: (Math.random() - 0.5) * 20,
      volume: Math.random() * 1000000,
      marketCap: Math.random() * 10000000,
    };
    
    if (existingData) {
      const updated = await db.marketData.update({
        where: { tokenAddress },
        data: {
          symbol: symbol?.toUpperCase(),
          price: priceData.price,
          priceChange24h: priceData.change24h,
          volume24h: priceData.volume,
          marketCap: priceData.marketCap,
          lastUpdated: new Date(),
        },
      });
      
      return NextResponse.json({ success: true, data: updated });
    }
    
    const created = await db.marketData.create({
      data: {
        tokenAddress,
        symbol: symbol?.toUpperCase(),
        price: priceData.price,
        priceChange24h: priceData.change24h,
        volume24h: priceData.volume,
        marketCap: priceData.marketCap,
      },
    });
    
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Error storing market data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store market data' },
      { status: 500 }
    );
  }
}
