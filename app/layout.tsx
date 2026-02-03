import type { Metadata } from "next";
import type React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TrpcReactProvider } from "@/lib/trpc-provider"; 
import { AuthDebug } from "@/components/debug/auth-debug";
import { SessionProviderWrapper } from "@/components/providers/session-provider-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProjectProvider } from "@/lib/project-context";
import "./globals.css";

// Force dynamic rendering for all pages (no static generation)
export const dynamic = 'force-dynamic';

// Font setup - Inter with tight tracking for modern infra aesthetic
const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Metadata
export const metadata: Metadata = {
  title: "Sarge - DevOps Command Center",
  description: "Cyberpunk-inspired DevOps dashboard",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

// Layout Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SessionProviderWrapper>
            <ProjectProvider>
              <TrpcReactProvider>
                {children}
                <AuthDebug />
              </TrpcReactProvider>
            </ProjectProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}