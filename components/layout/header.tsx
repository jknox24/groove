"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, Sparkles, Users } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

const navItems = [
  { href: "/", label: "Today" },
  { href: "/habits", label: "Habits" },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/partners", label: "Partners", icon: Users },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold text-lg text-primary">
            Groove
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-background text-text"
                    : "text-text-secondary hover:text-text hover:bg-background"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-text-secondary">
              {user.displayName}
            </span>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
