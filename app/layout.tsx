import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
