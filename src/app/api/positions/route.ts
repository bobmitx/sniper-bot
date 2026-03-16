import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, positionCreateSchema } from '@/lib/validation';

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

// Valid position statuses
const VALID_STATUSES = ['open', 'closing', 'closed'];

// GET - Fetch positions
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
    const status = searchParams.get('status') || 'open';
    
    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status parameter' },
        { status: 400 }
      );
    }
    
    const positions = await db.position.findMany({
      where: { status },
      orderBy: { openedAt: 'desc' },
    });
    
    // Calculate current P&L for each position
    const positionsWithPL = positions.map((position) => {
      const currentValue = position.currentValue || position.valueIn;
      const profitLoss = currentValue - position.valueIn;
      const profitLossPercent = position.valueIn > 0 ? (profitLoss / position.valueIn) * 100 : 0;
      
      return {
        ...position,
        currentValue,
        profitLoss,
        profitLossPercent,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: positionsWithPL,
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// POST - Open a new position
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
    const validation = validateInput(positionCreateSchema, body);
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
    
    // Check max open positions
    const openPositions = await db.position.count({
      where: { status: 'open' },
    });
    
    if (openPositions >= botConfig.maxOpenPositions) {
      return NextResponse.json(
        { success: false, error: 'Maximum open positions reached' },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Create position with validated data
    const position = await db.position.create({
      data: {
        botConfigId: botConfig.id,
        tokenAddress: data.tokenAddress,
        tokenSymbol: data.tokenSymbol || botConfig.targetTokenSymbol || 'UNKNOWN',
        tokenName: data.tokenName || botConfig.targetTokenName || 'Unknown Token',
        entryPrice: data.entryPrice,
        entryPriceUsd: data.entryPriceUsd || null,
        amount: data.amount,
        valueIn: data.valueIn,
        currentValue: data.valueIn,
        highestPrice: data.entryPrice,
        lowestPrice: data.entryPrice,
        stopLossPrice: data.stopLossPrice || null,
        takeProfitPrice: data.takeProfitPrice || null,
        status: 'open',
      },
    });
    
    // Log the position
    await db.activityLog.create({
      data: {
        level: 'info',
        category: 'trade',
        message: `Position opened: ${position.tokenSymbol}`,
        details: JSON.stringify({
          positionId: position.id,
          entryPrice: position.entryPrice,
          valueIn: position.valueIn,
        }),
      },
    });
    
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create position' },
      { status: 500 }
    );
  }
}

// PUT - Update position
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
    const { id, action, ...updateData } = body;
    
    // Validate position ID
    if (!id || typeof id !== 'string' || id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Valid position ID is required' },
        { status: 400 }
      );
    }
    
    // Handle close action
    if (action === 'close') {
      const position = await db.position.update({
        where: { id },
        data: {
          status: 'closed',
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      // Log the close
      await db.activityLog.create({
        data: {
          level: 'info',
          category: 'trade',
          message: `Position closed: ${position.tokenSymbol}`,
          details: JSON.stringify({
            positionId: position.id,
            finalValue: position.currentValue,
          }),
        },
      });
      
      return NextResponse.json({ success: true, data: position });
    }
    
    // Regular update - whitelist allowed fields
    const allowedFields = [
      'currentValue', 'highestPrice', 'lowestPrice',
      'stopLossPrice', 'takeProfitPrice', 'trailingStopPrice', 'status'
    ];
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
    if (cleanData.status && !VALID_STATUSES.includes(cleanData.status as string)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const position = await db.position.update({
      where: { id },
      data: {
        ...cleanData,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

// DELETE - Delete closed position
export async function DELETE(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Validate ID
    if (!id || typeof id !== 'string' || id.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Valid position ID is required' },
        { status: 400 }
      );
    }
    
    // Check if position exists and is closed
    const position = await db.position.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    
    if (!position) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }
    
    if (position.status === 'open') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete open position' },
        { status: 400 }
      );
    }
    
    await db.position.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}
