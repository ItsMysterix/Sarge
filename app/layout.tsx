import type { Metadata } from "next";
import type React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TrpcReactProvider } from "@/lib/trpc-provider"; 
import { AuthDebug } from "@/components/debug/auth-debug";
import { SessionProviderWrapper } from "@/components/providers/session-provider-wrapper";
import "./globals.css";

// Force dynamic rendering for all pages (no static generation)
export const dynamic = 'force-dynamic';

// Font setup
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Metadata
export const metadata: Metadata = {
  title: "Sarge - DevOps Command Center",
  description: "Cyberpunk-inspired DevOps dashboard",
};

// Layout Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-black text-white">
        <SessionProviderWrapper>
          <TrpcReactProvider>
            {children}
            <AuthDebug />
          </TrpcReactProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}