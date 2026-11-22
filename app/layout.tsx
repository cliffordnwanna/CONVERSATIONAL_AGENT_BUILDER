import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SiteNav from "./components/SiteNav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conversational Agent Builder",
  description: "Add documents, ask questions, and see exactly which passages produced each answer.",
};

export const viewport: Viewport = { themeColor: "#f7f7f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-dvh bg-background text-foreground`}>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
