"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50">
          <div className="p-4 space-y-3">
            <a href="/" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Home
            </a>
            <a href="/builder" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Builder
            </a>
            <a href="/analytics" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Analytics
            </a>
            <a href="/deploy" className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Deploy
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
