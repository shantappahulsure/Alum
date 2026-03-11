import { SpeedInsights } from "@vercel/speed-insights/next";
import type React from "react";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";

const fontInter = FontSans({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Alum",
  description: "Connect with Aluminis and get referrals for your dream job",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontInter.variable
        )}
      >
        <SpeedInsights />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>

          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}