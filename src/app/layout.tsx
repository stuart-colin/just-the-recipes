import type { Metadata } from "next";
import Link from 'next/link';
import { Geist, Geist_Mono, Cabin_Sketch } from "next/font/google"; // Import Cabin_Sketch
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cabinSketch = Cabin_Sketch({ // Initialize Cabin Sketch
  variable: "--font-cabin-sketch",
  weight: ['400', '700'], // Specify the weights you need
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Just the Recipes",
  description: "All of the Marshmallow, None of the Fluff",
  manifest: '/manifest.json',
  themeColor: '#49d0ae',
  icons: {
    icon: '/favicon.svg', // Main favicon (ensure favicon.ico is in /public)
    apple: '/favicon.svg', // Apple touch icon (ensure apple-touch-icon.png is in /public)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${cabinSketch.variable} antialiased`} >
        <main className="container mx-auto px-4 py-8">
          <header className="text-center">
            <h1
              className="text-5xl mb-2 font-bold"
              style={{
                color: '#49d0ae',
                fontFamily: "var(--font-cabin-sketch), sans-serif",
              }}
            >
              <Link href="/">Just the Recipes.</Link>
            </h1>
            <p className="text-gray-600 font-sans italic">
              All of the marshmallow, none of the fluff.
            </p>
          </header>
          {children}
        </main>
      </body>
    </html >
  );
}
