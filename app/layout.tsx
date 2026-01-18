import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MobileNav from "./components/MobileNav";
import "./globals.css";

const inter = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conversational Agent Builder",
  description: "Build AI Agents That Actually Understand Your Business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </head>
      <body className={inter.className}>
        <nav className="sticky top-0 z-50 bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="font-bold text-gray-900 hidden sm:inline">Agent Builder</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
                <a href="/builder" className="text-gray-600 hover:text-gray-900 transition-colors">Builder</a>
                <a href="/analytics" className="text-gray-600 hover:text-gray-900 transition-colors">Analytics</a>
                <a href="/deploy" className="text-gray-600 hover:text-gray-900 transition-colors">Deploy</a>
              </div>
              
              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
