"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, Sparkles, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Today", icon: Home },
  { href: "/habits", label: "Habits", icon: ListTodo },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/partners", label: "Partners", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px]",
                "transition-colors",
                isActive
                  ? "text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
