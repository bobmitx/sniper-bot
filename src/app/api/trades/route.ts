import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch trade history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
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
  try {
    const body = await request.json();
    const botConfig = await db.botConfig.findFirst();
    
    if (!botConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    // Create a simulated trade
    const trade = await db.trade.create({
      data: {
        botConfigId: botConfig.id,
        type: body.type || 'buy',
        status: 'pending',
        tokenAddress: body.tokenAddress || botConfig.targetToken || '0x...',
        tokenSymbol: body.tokenSymbol || botConfig.targetTokenSymbol || 'UNKNOWN',
        tokenName: body.tokenName || botConfig.targetTokenName || 'Unknown Token',
        amountIn: body.amountIn || botConfig.buyAmount,
        amountOut: body.amountOut || 0,
        price: body.price || 0,
        priceUsd: body.priceUsd || 0,
        triggerType: body.triggerType || 'manual',
        triggerValue: body.triggerValue || 0,
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
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Trade ID is required' },
        { status: 400 }
      );
    }
    
    const trade = await db.trade.update({
      where: { id },
      data: {
        ...updateData,
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
