"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 mb-2">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(opt.value)}
          className={`flex-1 gap-1.5 h-7 text-xs ${
            theme === opt.value
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-transparent"
          }`}
        >
          <opt.icon className="h-3 w-3" />
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
