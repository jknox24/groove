import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Groove - Build Better Habits",
  description: "A habit tracking app that helps you understand your patterns, build habit stacks, and leverage real accountability.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Groove",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider>
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
