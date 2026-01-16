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
  if (href) {
    return (
      <Link href={href}>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} className="flex items-center gap-2">
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
