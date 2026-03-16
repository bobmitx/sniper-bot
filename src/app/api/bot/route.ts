import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch bot configuration
export async function GET() {
  try {
    let config = await db.botConfig.findFirst();
    
    if (!config) {
      // Create default configuration if none exists
      config = await db.botConfig.create({
        data: {
          name: 'Sniper Bot v1',
          isActive: false,
          exchange: 'uniswap',
          network: 'ethereum',
          targetToken: null,
          targetTokenSymbol: null,
          targetTokenName: null,
          baseToken: 'WETH',
          strategy: 'momentum',
          buyTriggerType: 'price_drop',
          buyTriggerValue: 5.0,
          buyAmount: 0.1,
          buySlippage: 5.0,
          sellTriggerType: 'take_profit',
          takeProfitEnabled: true,
          takeProfitPercent: 50.0,
          stopLossEnabled: true,
          stopLossPercent: 15.0,
          trailingStopEnabled: false,
          trailingStopPercent: 10.0,
          positionSizingType: 'fixed',
          positionSizeValue: 0.1,
          maxPositionSize: 1.0,
          maxDailyLoss: 0.5,
          maxDailyTrades: 10,
          maxOpenPositions: 5,
          cooldownPeriod: 300,
          mevProtection: true,
          flashLoanDetection: true,
        },
      });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bot configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update bot configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existingConfig = await db.botConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    // Filter out undefined, null, and NaN values
    const cleanBody: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number' && isNaN(value)) {
          continue; // Skip NaN values
        }
        cleanBody[key] = value;
      }
    }
    
    const updatedConfig = await db.botConfig.update({
      where: { id: existingConfig.id },
      data: {
        ...cleanBody,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error('Error updating bot config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bot configuration' },
      { status: 500 }
    );
  }
}

// POST - Toggle bot active state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const existingConfig = await db.botConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    let updatedConfig;
    
    if (action === 'start') {
      // Log bot start
      await db.activityLog.create({
        data: {
          level: 'info',
          category: 'system',
          message: 'Bot started',
          details: JSON.stringify({ timestamp: new Date().toISOString() }),
        },
      });
      
      updatedConfig = await db.botConfig.update({
        where: { id: existingConfig.id },
        data: { isActive: true },
      });
    } else if (action === 'stop') {
      // Log bot stop
      await db.activityLog.create({
        data: {
          level: 'info',
          category: 'system',
          message: 'Bot stopped',
          details: JSON.stringify({ timestamp: new Date().toISOString() }),
        },
      });
      
      updatedConfig = await db.botConfig.update({
        where: { id: existingConfig.id },
        data: { isActive: false },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error('Error toggling bot state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle bot state' },
      { status: 500 }
    );
  }
}
