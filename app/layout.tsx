import type { Metadata } from "next";
import type React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TrpcReactProvider } from "@/lib/trpc-provider"; 
import { AuthDebug } from "@/components/debug/auth-debug";
import "./globals.css";

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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body className="font-sans antialiased bg-black text-white">
          <TrpcReactProvider>
            {children}
            <AuthDebug />
          </TrpcReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
