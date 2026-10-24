"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { NodeStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

// Shared building blocks for the console pages.

const STATUS_STYLE: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  READY: { dot: "bg-success", text: "text-success", label: "Ready" },
  BUSY: { dot: "bg-info", text: "text-info", label: "Busy" },
  JOINING: { dot: "bg-warning", text: "text-warning", label: "Joining" },
  BENCHMARKING: {
    dot: "bg-warning",
    text: "text-warning",
    label: "Benchmarking",
  },
  MODEL_DOWNLOADING: {
    dot: "bg-warning",
    text: "text-warning",
    label: "Downloading model",
  },
  COOLING: { dot: "bg-warning", text: "text-warning", label: "Cooling" },
  PAUSED: { dot: "bg-offline", text: "text-muted-foreground", label: "Paused" },
  DRAINING: {
    dot: "bg-offline",
    text: "text-muted-foreground",
    label: "Draining",
  },
  OFFLINE: {
    dot: "bg-offline",
    text: "text-muted-foreground",
    label: "Offline",
  },
  ERROR: { dot: "bg-destructive", text: "text-destructive", label: "Error" },
  SUCCESS: { dot: "bg-success", text: "text-success", label: "Success" },
  FAILED: { dot: "bg-destructive", text: "text-destructive", label: "Failed" },
  DEVICE_ERROR: {
    dot: "bg-destructive",
    text: "text-destructive",
    label: "Device error",
  },
  NO_DEVICE: { dot: "bg-warning", text: "text-warning", label: "No device" },
}

export function StatusBadge({
  status,
  className,
}: {
  status?: NodeStatus | string
  className?: string
}) {
  const style = STATUS_STYLE[status ?? ""] ?? {
    dot: "bg-offline",
    text: "text-muted-foreground",
    label: status ?? "Unknown",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        style.text,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-accent p-2.5 text-accent-foreground [&_svg]:size-5">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}. Is mdm running and reachable at MDM_API_URL?
    </div>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {children && (
        <div className="mt-1.5 text-sm text-muted-foreground">{children}</div>
      )}
    </div>
  )
}

export function Meter({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full",
          clamped < 20
            ? "bg-destructive"
            : clamped < 50
              ? "bg-warning"
              : "bg-success"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
