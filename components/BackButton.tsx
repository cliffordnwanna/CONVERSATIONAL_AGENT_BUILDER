"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

export default function BackButton({ href, onClick, label = "Back" }: BackButtonProps) {
  const buttonClass = "flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0";
  
  if (href) {
    return (
      <Link href={href}>
        <Button variant="outline" size="sm" className={buttonClass}>
          <ArrowLeft className="w-4 h-4" />
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} className={buttonClass}>
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
