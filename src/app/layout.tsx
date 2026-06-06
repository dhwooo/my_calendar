import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PWARegistrar } from "@/components/PWARegistrar";

export const metadata: Metadata = {
  title: "Private Calendar",
  description: "Codex × Apple 풍의 정제된 개인 캘린더. 일정 · 체중 · 자산 · 갤러리 · 위키.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Prv. CAL",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0e" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-[100dvh] font-sans">
        <Providers>{children}</Providers>
        <PWARegistrar />
      </body>
    </html>
  );
}
