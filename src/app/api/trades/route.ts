import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, tradeCreateSchema, tradeStatusSchema } from '@/lib/validation';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 200;

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

// Maximum allowed values
const MAX_LIMIT = 100;
const MAX_OFFSET = 10000;

// GET - Fetch trade history
export async function GET(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and clamp pagination parameters
    let limit = parseInt(searchParams.get('limit') || '50');
    let offset = parseInt(searchParams.get('offset') || '0');
    
    // Clamp to reasonable limits
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);
    offset = Math.min(Math.max(0, offset), MAX_OFFSET);
    
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    const where: Record<string, unknown> = {};
    
    // Validate status filter
    if (status) {
      const statusValidation = tradeStatusSchema.safeParse(status);
      if (statusValidation.success) {
        where.status = status;
      }
    }
    
    // Validate type filter
    if (type && (type === 'buy' || type === 'sell')) {
      where.type = type;
    }
    
    const trades = await db.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await db.trade.count({ where });
    
    return NextResponse.json({
      success: true,
      data: trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + trades.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST - Create a new trade (simulation)
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
    const validation = validateInput(tradeCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: `Validation error: ${validation.error}` },
        { status: 400 }
      );
    }
    
    const botConfig = await db.botConfig.findFirst();
    
    if (!botConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    // Create a simulated trade with validated data
    const trade = await db.trade.create({
      data: {
        botConfigId: botConfig.id,
        type: validation.data.type,
        status: 'pending',
        tokenAddress: validation.data.tokenAddress,
        tokenSymbol: validation.data.tokenSymbol || botConfig.targetTokenSymbol || 'UNKNOWN',
        tokenName: validation.data.tokenName || botConfig.targetTokenName || 'Unknown Token',
        amountIn: validation.data.amountIn,
        amountOut: validation.data.amountOut || 0,
        price: validation.data.price || 0,
        priceUsd: validation.data.priceUsd || 0,
        triggerType: validation.data.triggerType || 'manual',
        triggerValue: validation.data.triggerValue || 0,
      },
    });
    
    // Log the trade
    await db.activityLog.create({
      data: {
        level: 'info',
        category: 'trade',
        message: `Trade created: ${trade.type.toUpperCase()} ${trade.amountIn} ${botConfig.baseToken}`,
        details: JSON.stringify({ tradeId: trade.id, token: trade.tokenSymbol }),
      },
    });
    
    return NextResponse.json({ success: true, data: trade });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}

// PUT - Update trade status
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
    const { id, ...updateData } = body;
    
    // Validate trade ID
    if (!id || typeof id !== 'string' || id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Valid trade ID is required' },
        { status: 400 }
      );
    }
    
    // Whitelist allowed update fields
    const allowedFields = ['status', 'txHash', 'blockNumber', 'gasUsed', 'gasPrice', 'gasCost', 'amountOut', 'price', 'priceUsd', 'profitLoss', 'profitLossPercent', 'profitLossUsd', 'executedAt', 'completedAt', 'errorMessage'];
    const cleanData: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        if (typeof value === 'number' && isNaN(value)) {
          continue;
        }
        cleanData[key] = value;
      }
    }
    
    // Validate status if provided
    if (cleanData.status) {
      const statusValidation = tradeStatusSchema.safeParse(cleanData.status);
      if (!statusValidation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
    }
    
    const trade = await db.trade.update({
      where: { id },
      data: {
        ...cleanData,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, data: trade });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}
