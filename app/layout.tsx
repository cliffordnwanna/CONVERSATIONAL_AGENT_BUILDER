import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import MobileNav from "./components/MobileNav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conversational Agent Builder",
  description: "Build AI Agents That Actually Understand Your Business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>"
        />
      </head>

      <body
        className={`${geist.className} min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white`}
      >
        {/* Global Navigation */}
        <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur bg-white/5">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <span className="font-semibold text-sm sm:text-base text-white">
                  Conversational Agent Builder
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/builder"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Builder
                </Link>
                <Link
                  href="/analytics"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/deploy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Deploy
                </Link>
              </div>

              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
