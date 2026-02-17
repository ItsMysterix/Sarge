import type { Metadata } from "next";
import type React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TrpcReactProvider } from "@/lib/trpc-provider"; 
import { SessionProviderWrapper } from "@/components/providers/session-provider-wrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProjectProvider } from "@/lib/project-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { JsonLd } from "@/components/seo/JsonLd";
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

// Metadata Strategy
export const metadata: Metadata = {
  title: "Sarge | Unified DevOps Command Center & Multi-Cloud Governance",
  description: "Deploy, monitor, and govern your infrastructure across Vercel, AWS, Render, and more from one unified, high-performance dashboard.",
  keywords: ["DevOps", "Infrastructure as Code", "Multi-cloud", "Vercel", "AWS", "Dashboard", "Governance", "Sarge"],
  authors: [{ name: "Sarge Team" }],
  metadataBase: new URL('https://sarge.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Sarge | Unified DevOps Command Center",
    description: "The modern command center for teams who ship to multiple clouds.",
    url: 'https://sarge.app',
    siteName: 'Sarge',
    images: [
      {
        url: '/og-image.png', // Fallback to a representative image
        width: 1200,
        height: 630,
        alt: 'Sarge Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sarge | Unified DevOps Command Center",
    description: "One dashboard for all your cloud providers. Deploy and monitor with zero config.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
                <JsonLd />
              </TrpcReactProvider>
            </ProjectProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}