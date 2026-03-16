import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch open positions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    
    const positions = await db.position.findMany({
      where: { status },
      orderBy: { openedAt: 'desc' },
    });
    
    // Calculate current P&L for each position
    const positionsWithPL = positions.map((position) => {
      const currentValue = position.currentValue || position.valueIn;
      const profitLoss = currentValue - position.valueIn;
      const profitLossPercent = (profitLoss / position.valueIn) * 100;
      
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
  try {
    const body = await request.json();
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
    
    // Create position
    const position = await db.position.create({
      data: {
        botConfigId: botConfig.id,
        tokenAddress: body.tokenAddress || botConfig.targetToken || '0x...',
        tokenSymbol: body.tokenSymbol || botConfig.targetTokenSymbol || 'UNKNOWN',
        tokenName: body.tokenName || botConfig.targetTokenName || 'Unknown Token',
        entryPrice: body.entryPrice || 0,
        entryPriceUsd: body.entryPriceUsd || 0,
        amount: body.amount || 0,
        valueIn: body.valueIn || botConfig.buyAmount,
        currentValue: body.valueIn || botConfig.buyAmount,
        highestPrice: body.entryPrice || 0,
        lowestPrice: body.entryPrice || 0,
        stopLossPrice: body.stopLossPrice || null,
        takeProfitPrice: body.takeProfitPrice || null,
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
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Position ID is required' },
        { status: 400 }
      );
    }
    
    if (action === 'close') {
      // Close the position
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
    
    // Regular update
    const position = await db.position.update({
      where: { id },
      data: {
        ...updateData,
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Position ID is required' },
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
