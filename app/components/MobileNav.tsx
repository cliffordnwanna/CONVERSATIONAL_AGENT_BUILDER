"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition"
      >
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
            open ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-opacity duration-300 ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
            open ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Menu Panel */}
      {open && (
        <div className="absolute left-0 top-full w-full border-t border-white/10 bg-slate-900/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-6 space-y-4">
            {/* Brand */}
            <div className="flex items-center gap-2 pb-4 border-b border-white/10">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <span className="font-semibold text-white">
                Conversational Agent Builder
              </span>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-3 pt-2">
              <MobileLink href="/" label="Home" onClick={() => setOpen(false)} />
              <MobileLink
                href="/builder"
                label="Builder"
                onClick={() => setOpen(false)}
              />
              <MobileLink
                href="/analytics"
                label="Analytics"
                onClick={() => setOpen(false)}
              />
              <MobileLink
                href="/deploy"
                label="Deploy"
                onClick={() => setOpen(false)}
              />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
    >
      {label}
    </Link>
  );
}
