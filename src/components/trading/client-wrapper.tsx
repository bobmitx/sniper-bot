'use client';

import dynamic from 'next/dynamic';

export const TradingDashboard = dynamic(
  () => import('./trading-dashboard').then((mod) => mod.TradingDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Sniper Bot...</p>
        </div>
      </div>
    ),
  }
);
