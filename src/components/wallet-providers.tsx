'use client';

import dynamic from 'next/dynamic';

// Dynamic import of Providers with SSR disabled to avoid indexedDB errors
export const WalletProviders = dynamic(
  () => import('@/components/providers').then((mod) => mod.Providers),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Wallet Provider...</p>
        </div>
      </div>
    ),
  }
);
