import type { Metadata } from "next";
import localFont from "next/font/local";
import { Web3Provider } from "@/components/providers/Web3Provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "iPredict - Decentralized Prediction Markets",
  description: "Predict the future. Earn rewards. Powered by Injective.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#09090B] text-white min-h-screen`}
      >
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
