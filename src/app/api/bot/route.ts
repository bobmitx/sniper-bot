import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, botConfigUpdateSchema } from '@/lib/validation';

// Allowed fields for bot configuration update (whitelist)
const ALLOWED_CONFIG_FIELDS = new Set([
  'name', 'isActive', 'exchange', 'network', 'rpcUrl',
  'targetToken', 'targetTokenSymbol', 'targetTokenName', 'baseToken',
  'strategy', 'strategyParams', 'buyTriggerType', 'buyTriggerValue',
  'buyAmount', 'buySlippage', 'buyGasPrice', 'buyGasLimit',
  'minLiquidity', 'maxBuyPrice',
  'sellTriggerType', 'sellTriggerValue', 'sellSlippage', 'sellGasPrice', 'sellGasLimit',
  'takeProfitEnabled', 'takeProfitPercent', 'takeProfitAmount',
  'stopLossEnabled', 'stopLossPercent', 'stopLossType',
  'trailingStopEnabled', 'trailingStopPercent', 'trailingStopActivation',
  'positionSizingType', 'positionSizeValue', 'maxPositionSize', 'minPositionSize',
  'maxDailyLoss', 'maxDailyTrades', 'maxOpenPositions', 'cooldownPeriod',
  'autoApprove', 'mevProtection', 'flashLoanDetection',
  // Auto-Sweep settings
  'autoSweepEnabled', 'sweepChains', 'sweepInterval',
]);

// Rate limiting store (in-memory, resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

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

// GET - Fetch bot configuration
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

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
  // Rate limiting
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
    const validation = validateInput(botConfigUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: `Validation error: ${validation.error}` },
        { status: 400 }
      );
    }
    
    const existingConfig = await db.botConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    // Filter to only allowed fields (additional security layer)
    const cleanBody: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validation.data)) {
      if (ALLOWED_CONFIG_FIELDS.has(key) && value !== undefined && value !== null) {
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
  // Rate limiting
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;
    
    // Validate action
    if (action !== 'start' && action !== 'stop') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
    
    const existingConfig = await db.botConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Bot configuration not found' },
        { status: 404 }
      );
    }
    
    // Log the action
    await db.activityLog.create({
      data: {
        level: 'info',
        category: 'system',
        message: `Bot ${action}ed`,
        details: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          previousState: existingConfig.isActive,
        }),
      },
    });
    
    const updatedConfig = await db.botConfig.update({
      where: { id: existingConfig.id },
      data: { isActive: action === 'start' },
    });
    
    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error('Error toggling bot state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle bot state' },
      { status: 500 }
    );
  }
}
