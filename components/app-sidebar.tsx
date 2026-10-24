"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BoxesIcon,
  KeyRoundIcon,
  LayoutGridIcon,
  MessageSquareTextIcon,
  MoonIcon,
  ScrollTextIcon,
  SmartphoneIcon,
  SunIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGridIcon },
  { href: "/devices", label: "Devices", icon: SmartphoneIcon },
  { href: "/models", label: "Model catalog", icon: BoxesIcon },
  { href: "/playground", label: "Playground", icon: MessageSquareTextIcon },
  { href: "/logs", label: "Inference logs", icon: ScrollTextIcon },
  { href: "/keys", label: "API keys", icon: KeyRoundIcon },
]

// The server can't know the theme, so both icons are rendered and the .dark class picks one
// (rendering only one from resolvedTheme causes a hydration mismatch).
function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={className}
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const health = usePoll(() => api.loadedModels(), 10000)
  const reachable = !health.error && health.data !== undefined

  return (
    <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-64 md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-5 py-5 md:px-6 md:py-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
            N
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              NCINGA Fabric
            </span>
            <span className="block text-xs text-muted-foreground">
              Edge AI console
            </span>
          </span>
        </Link>
        <ThemeToggle className="md:hidden" />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-4 md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto hidden items-center justify-between px-6 py-6 md:flex">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              reachable
                ? "bg-success"
                : health.loading
                  ? "bg-warning"
                  : "bg-destructive"
            )}
          />
          {reachable
            ? "mdm connected"
            : health.loading
              ? "Connecting…"
              : "mdm unreachable"}
        </span>
        <ThemeToggle />
      </div>
    </aside>
  )
}
