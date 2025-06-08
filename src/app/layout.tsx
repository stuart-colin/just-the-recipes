import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Just the Recipes",
  description: "All of the Marshmallow, None of the Fluff",
  manifest: '/manifest.json', // Link to your web app manifest
  themeColor: '#49d0ae',   // Set the theme color for browser UI
  icons: {
    icon: '/icon.svg', // Main favicon (ensure favicon.ico is in /public)
    apple: '/apple-touch-icon.png', // Apple touch icon (ensure apple-touch-icon.png is in /public)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
