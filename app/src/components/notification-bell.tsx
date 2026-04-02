"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  hoursLeft: number;
  isOverdue: boolean;
  isUrgent: boolean;
  severity: string;
  href: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const overdueCount = notifications.filter((n) => n.isOverdue).length;
  const urgentCount = notifications.filter((n) => n.isUrgent).length;
  const badgeCount = overdueCount + urgentCount;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-950 border rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Deadline Alerts</p>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No urgent incidents — all clear.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      n.isOverdue
                        ? "bg-red-500"
                        : n.isUrgent
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p
                      className={`text-xs mt-0.5 ${
                        n.isOverdue
                          ? "text-red-600 dark:text-red-400"
                          : n.isUrgent
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {n.isOverdue
                        ? "OVERDUE — report immediately"
                        : n.hoursLeft < 24
                          ? `${Math.floor(n.hoursLeft)}h ${Math.floor((n.hoursLeft % 1) * 60)}m remaining`
                          : `${Math.floor(n.hoursLeft / 24)}d ${Math.floor(n.hoursLeft % 24)}h remaining`}
                    </p>
                  </div>
                  <Badge
                    className={`text-[9px] shrink-0 ${
                      n.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : n.severity === "major"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {n.severity}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 py-2 border-t">
            <Link
              href="/incidents"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:underline"
            >
              View all incidents →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
