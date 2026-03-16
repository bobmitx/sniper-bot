import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WalletProviders } from "@/components/wallet-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sniper Bot - Advanced Cryptocurrency Trading Bot",
  description: "Professional sniper bot for automated cryptocurrency trading with advanced features like take profit, stop loss, and MEV protection.",
  keywords: ["Sniper Bot", "Cryptocurrency", "Trading Bot", "DEX", "DeFi", "EVM", "Ethereum", "PulseChain", "PulseX"],
  authors: [{ name: "Sniper Bot Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Sniper Bot - Advanced Trading Bot",
    description: "Professional sniper bot for automated cryptocurrency trading",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sniper Bot",
    description: "Professional sniper bot for automated cryptocurrency trading",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <WalletProviders>
          {children}
          <Toaster />
        </WalletProviders>
      </body>
    </html>
  );
}
