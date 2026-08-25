"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by waiting until mounted on client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0">
        <span>☀️</span>
      </Button>
    )
  }

  const currentEmoji = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted select-none flex items-center justify-center rounded-lg border border-border/40 bg-card/50">
          <span className="text-sm">{currentEmoji}</span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-36 font-sans">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs">☀️</span>
          <span className="text-xs font-medium">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs">🌙</span>
          <span className="text-xs font-medium">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs">💻</span>
          <span className="text-xs font-medium">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
