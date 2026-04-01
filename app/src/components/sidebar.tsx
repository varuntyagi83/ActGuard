"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield,
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/systems", label: "AI Systems", icon: Cpu },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  orgName: string;
}

export function Sidebar({ user, orgName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-950 border-r h-full">
      {/* Logo + Org */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">ActGuard</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{orgName}</p>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User + Theme */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-600 dark:text-gray-400"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
