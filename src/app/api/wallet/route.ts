import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, walletTradeSchema, ethereumAddressSchema } from '@/lib/validation';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100; // Lower limit for wallet operations

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// GET - Fetch wallet status and balances
export async function GET(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const botConfig = await db.botConfig.findFirst();
    
    if (!botConfig) {
      return NextResponse.json({
        success: false,
        error: 'Bot configuration not found',
      }, { status: 404 });
    }

    // Get recent trades for P&L calculation
    const trades = await db.trade.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });

    const totalProfitLoss = trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const totalGasSpent = trades.reduce((sum, trade) => sum + (trade.gasCost || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        isConnected: false, // Will be updated by frontend
        network: botConfig.network,
        exchange: botConfig.exchange,
        isActive: botConfig.isActive,
        stats: {
          totalTrades: trades.length,
          totalProfitLoss,
          totalGasSpent,
          winCount: trades.filter(t => (t.profitLoss || 0) > 0).length,
          lossCount: trades.filter(t => (t.profitLoss || 0) < 0).length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching wallet status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch wallet status',
    }, { status: 500 });
  }
}

// POST - Execute a trade (simulation for demo)
export async function POST(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(walletTradeSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: `Validation error: ${validation.error}`,
      }, { status: 400 });
    }
    
    const { type, tokenAddress, amount, slippage } = validation.data;
    const userAddress = body.userAddress;

    const botConfig = await db.botConfig.findFirst();
    if (!botConfig) {
      return NextResponse.json({
        success: false,
        error: 'Bot configuration not found',
      }, { status: 404 });
    }

    // In production, this would:
    // 1. Validate the transaction parameters
    // 2. Check for sufficient balance
    // 3. Estimate gas costs
    // 4. Create and sign the transaction
    // 5. Submit to the blockchain
    // 6. Monitor for confirmation

    // For demo, simulate the trade
    const simulatedPrice = Math.random() * 100;
    const slippageValue = slippage || 1;
    const simulatedAmountOut = type === 'buy' 
      ? amount * simulatedPrice * (1 - slippageValue / 100)
      : amount / simulatedPrice * (1 - slippageValue / 100);

    const trade = await db.trade.create({
      data: {
        botConfigId: botConfig.id,
        type,
        status: 'completed',
        tokenAddress: tokenAddress || botConfig.targetToken || '0x0000000000000000000000000000000000000000',
        tokenSymbol: botConfig.targetTokenSymbol || 'UNKNOWN',
        tokenName: botConfig.targetTokenName || 'Unknown Token',
        amountIn: amount,
        amountOut: simulatedAmountOut,
        price: simulatedPrice,
        triggerType: 'manual',
        executedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Log the activity
    await db.activityLog.create({
      data: {
        level: 'info',
        category: 'trade',
        message: `${type.toUpperCase()} executed: ${amount} @ ${simulatedPrice.toFixed(4)}`,
        details: JSON.stringify({
          tradeId: trade.id,
          txHash: `0x${Date.now().toString(16)}`,
          userAddress: userAddress ? 'provided' : 'not provided',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        trade,
        txHash: `0x${Date.now().toString(16)}`,
        message: 'Trade executed successfully (simulated)',
      },
    });
  } catch (error) {
    console.error('Error executing trade:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute trade',
    }, { status: 500 });
  }
}

// PUT - Approve token spending
export async function PUT(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { tokenAddress, spender, amount, userAddress } = body;

    // Validate token address
    const tokenValidation = ethereumAddressSchema.safeParse(tokenAddress);
    if (!tokenValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token address format',
      }, { status: 400 });
    }

    // Validate spender address
    const spenderValidation = ethereumAddressSchema.safeParse(spender);
    if (!spenderValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid spender address format',
      }, { status: 400 });
    }

    // In production, this would:
    // 1. Validate token and spender addresses
    // 2. Check current allowance
    // 3. Create approve transaction
    // 4. Submit and monitor

    await db.activityLog.create({
      data: {
        level: 'info',
        category: 'security',
        message: `Token approval requested: ${tokenAddress.slice(0, 10)}... -> ${spender.slice(0, 10)}...`,
        details: JSON.stringify({ 
          tokenAddress: tokenAddress.slice(0, 20) + '...', 
          spender: spender.slice(0, 20) + '...', 
          amount: amount || 'unlimited',
          userAddress: userAddress ? 'provided' : 'not provided',
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        txHash: `0x${Date.now().toString(16)}`,
        message: 'Token approval successful (simulated)',
      },
    });
  } catch (error) {
    console.error('Error approving token:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to approve token',
    }, { status: 500 });
  }
}
