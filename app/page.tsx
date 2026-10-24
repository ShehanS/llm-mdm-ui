"use client"

import Link from "next/link"
import {
  ActivityIcon,
  BoxesIcon,
  GaugeIcon,
  SmartphoneIcon,
} from "lucide-react"

import {
  EmptyState,
  ErrorNote,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/fabric"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatMs, formatNumber, timeAgo } from "@/lib/format"

export default function OverviewPage() {
  const devices = usePoll(() => api.devices(), 5000)
  const models = usePoll(() => api.loadedModels(), 5000)
  const logs = usePoll(() => api.inferenceLogs(50), 5000)

  const all = devices.data ?? []
  const online = all.filter(
    (d) => d.status?.status === "READY" || d.status?.status === "BUSY"
  )
  const offline = all.filter(
    (d) => !d.status?.status || d.status.status === "OFFLINE"
  )
  const recent = logs.data ?? []
  const succeeded = recent.filter((l) => l.status === "SUCCESS")
  const successRate = recent.length
    ? Math.round((succeeded.length / recent.length) * 100)
    : undefined
  const avgLatency = succeeded.length
    ? Math.round(
        succeeded.reduce((sum, l) => sum + l.latencyMs, 0) / succeeded.length
      )
    : undefined

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live state of the edge fabric: which devices are serving, what they run and how requests are doing."
      />
      <ErrorNote message={devices.error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Devices online"
          value={`${online.length} / ${all.length}`}
          hint={`${offline.length} offline`}
          icon={<SmartphoneIcon />}
        />
        <StatCard
          label="Models served"
          value={models.data?.data.length ?? "–"}
          hint="Loaded on online devices"
          icon={<BoxesIcon />}
        />
        <StatCard
          label="Success rate"
          value={successRate === undefined ? "–" : `${successRate}%`}
          hint={`Last ${recent.length} requests`}
          icon={<ActivityIcon />}
        />
        <StatCard
          label="Avg latency"
          value={formatMs(avgLatency)}
          hint="Successful requests"
          icon={<GaugeIcon />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Online devices</CardTitle>
            <CardDescription>
              Devices that sent a heartbeat in the last 30 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {online.length === 0 ? (
              <EmptyState title="No device is online">
                Start the fabric agent app on a phone.
              </EmptyState>
            ) : (
              online.map((device) => (
                <Link
                  key={device.deviceId}
                  href={`/devices/${device.deviceId}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {device.deviceProfile?.manufacturer}{" "}
                      {device.deviceProfile?.model ?? device.deviceId}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {device.status?.loadedModel ?? "no model"} ·{" "}
                      {formatNumber(
                        device.aiCapability?.benchmark
                          ?.generationTokensPerSecond
                      )}{" "}
                      tok/s
                    </p>
                  </div>
                  <StatusBadge status={device.status?.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Routed through the fabric.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.length === 0 ? (
              <EmptyState title="No requests yet">
                Try the playground.
              </EmptyState>
            ) : (
              recent.slice(0, 7).map((log) => (
                <div
                  key={log.requestId + log.status}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">{log.requestedModel ?? "auto"}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(log.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatMs(log.latencyMs)}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                </div>
              ))
            )}
            <Link
              href="/logs"
              className="block pt-3 text-xs font-medium text-primary hover:underline"
            >
              View all logs
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
