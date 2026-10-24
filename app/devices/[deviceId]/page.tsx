"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeftIcon, MessageSquareTextIcon } from "lucide-react"

import { DeviceModelCard } from "@/components/device-model-card"
import { ErrorNote, Meter, PageHeader, StatusBadge } from "@/components/fabric"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  timeAgo,
} from "@/lib/format"

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children ?? "–"}</span>
    </div>
  )
}

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const device = usePoll(() => api.device(deviceId), 5000, [deviceId])
  const d = device.data
  const s = d?.status
  const profile = d?.deviceProfile
  const benchmark = d?.aiCapability?.benchmark
  const memory = profile?.memory
  const storage = profile?.storage

  return (
    <>
      <Link
        href="/devices"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Devices
      </Link>
      <PageHeader
        title={
          d
            ? `${profile?.manufacturer ?? ""} ${profile?.model ?? "Device"}`.trim()
            : "Device"
        }
        description={<span className="font-mono">{deviceId}</span>}
        actions={
          <>
            {s?.status && <StatusBadge status={s.status} className="py-1" />}
            <Link href={`/playground?device=${deviceId}`}>
              <Button variant="outline">
                <MessageSquareTextIcon /> Try this device
              </Button>
            </Link>
          </>
        }
      />
      <ErrorNote message={device.error} />

      <DeviceModelCard
        deviceId={deviceId}
        status={s}
        online={Boolean(d?.active) && s?.status !== "OFFLINE"}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Live status</CardTitle>
            <CardDescription>
              Updated {timeAgo(d?.lastHeartbeat)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Row label="Model">{s?.loadedModel}</Row>
            <Row label="Server ready">{s?.serverReady ? "Yes" : "No"}</Row>
            <Row label="Active jobs">{s?.activeJobs ?? 0}</Row>
            <Separator className="my-2" />
            <div className="space-y-2 py-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Battery {s?.charging ? "(charging)" : ""}
                </span>
                <span className="font-medium tabular-nums">
                  {s?.batteryLevel !== undefined
                    ? `${Math.round(s.batteryLevel)}%`
                    : "–"}
                </span>
              </div>
              <Meter value={s?.batteryLevel ?? 0} />
            </div>
            <Row label="Temperature">
              {s?.temperature ? `${formatNumber(s.temperature)} °C` : undefined}
            </Row>
            <Row label="Free RAM">{formatBytes(s?.availableMemoryBytes)}</Row>
            <Row label="Free storage">
              {formatBytes(s?.availableStorageBytes)}
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Latest on-device benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 pb-4">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Generation</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(benchmark?.generationTokensPerSecond)}
                </p>
                <p className="text-xs text-muted-foreground">tokens / s</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Prompt</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(benchmark?.promptTokensPerSecond)}
                </p>
                <p className="text-xs text-muted-foreground">tokens / s</p>
              </div>
            </div>
            <Row label="Benchmark model">{benchmark?.modelId}</Row>
            <Row label="Tested">{formatDateTime(benchmark?.testedAt)}</Row>
            <Row label="Backends">{d?.aiCapability?.backends?.join(", ")}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hardware</CardTitle>
            <CardDescription>Reported at registration</CardDescription>
          </CardHeader>
          <CardContent>
            <Row label="Type">{d?.deviceType}</Row>
            <Row label="OS">
              {profile?.os
                ? `${profile.os} ${profile.osVersion ?? ""}`
                : undefined}
            </Row>
            <Row label="Architecture">{profile?.architecture}</Row>
            <Row label="CPU cores">{profile?.cpus?.length || undefined}</Row>
            <Row label="RAM">{formatBytes(memory?.totalBytes)}</Row>
            <Row label="Storage">{formatBytes(storage?.totalBytes)}</Row>
            <Row label="GPU">{profile?.gpu?.name}</Row>
            <Separator className="my-2" />
            <Row label="Registered">{formatDateTime(d?.createdTime)}</Row>
            <Row label="Updated">{formatDateTime(d?.updatedTime)}</Row>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
