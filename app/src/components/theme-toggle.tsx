"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Return nothing on server — avoids any hydration mismatch
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 mb-2">
      {options.map((opt) => {
        const isActive =
          opt.value === "system"
            ? !["light", "dark"].includes(resolvedTheme ?? "")
            : resolvedTheme === opt.value;

        return (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(opt.value)}
            className={`flex-1 gap-1.5 h-7 text-xs ${
              isActive
                ? "bg-white dark:bg-gray-700 shadow-sm"
                : "hover:bg-transparent"
            }`}
          >
            <opt.icon className="h-3 w-3" />
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
