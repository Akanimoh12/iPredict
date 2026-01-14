import type { Metadata, Viewport } from "next";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/page-transition";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ipredict.app';

export const metadata: Metadata = {
  title: {
    default: "iPredict - Decentralized Prediction Markets",
    template: "%s | iPredict",
  },
  description: "Predict the future. Earn rewards. The premier prediction market on Injective with instant finality, near-zero fees, and gamified rewards.",
  keywords: ["prediction market", "injective", "crypto", "betting", "defi", "web3", "blockchain", "INJ"],
  authors: [{ name: "iPredict Team" }],
  creator: "iPredict",
  publisher: "iPredict",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "iPredict - Decentralized Prediction Markets",
    description: "Predict the future. Earn rewards. The premier prediction market on Injective.",
    url: siteUrl,
    siteName: "iPredict",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "iPredict - Decentralized Prediction Markets",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iPredict - Decentralized Prediction Markets",
    description: "Predict the future. Earn rewards. Powered by Injective.",
    images: ["/og-image.png"],
    creator: "@iPredict",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <Web3Provider>
          <Navigation />
          <main className="pb-16 md:pb-0">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
