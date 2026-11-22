"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/builder", label: "Builder" },
  { href: "/analytics", label: "Analytics" },
  { href: "/deploy", label: "Export" },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Agent Builder
        </Link>
        <nav aria-label="Main" className="-mr-2 flex items-center">
          {links.map(link => {
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${current ? "text-foreground" : "text-muted-foreground"}`}
              >
                <span className={current ? "border-b-2 border-primary pb-px" : "border-b-2 border-transparent pb-px"}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
