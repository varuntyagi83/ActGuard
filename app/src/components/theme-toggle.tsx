"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const cycle = ["light", "dark", "system"] as const;
type Theme = (typeof cycle)[number];

const icons: Record<Theme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const labels: Record<Theme, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = (cycle.includes(theme as Theme) ? theme : "system") as Theme;
  const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
  const Icon = icons[current];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          onClick={() => setTheme(next)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Icon className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{labels[current]} — click to switch</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
