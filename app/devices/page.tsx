"use client"

import * as React from "react"
import Link from "next/link"
import { BatteryChargingIcon, BatteryIcon, ThermometerIcon } from "lucide-react"

import {
  EmptyState,
  ErrorNote,
  NativeSelect,
  PageHeader,
  StatusBadge,
} from "@/components/fabric"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatBytes, formatNumber, timeAgo } from "@/lib/format"
import type { NodeStatus } from "@/lib/types"

const STATUSES: NodeStatus[] = [
  "READY",
  "BUSY",
  "JOINING",
  "BENCHMARKING",
  "COOLING",
  "PAUSED",
  "OFFLINE",
  "ERROR",
]

export default function DevicesPage() {
  const [status, setStatus] = React.useState<NodeStatus | "">("")
  const [model, setModel] = React.useState("")
  const devices = usePoll(
    () =>
      api.devices({ status: status || undefined, model: model || undefined }),
    5000,
    [status, model]
  )
  const list = devices.data ?? []

  return (
    <>
      <PageHeader
        title="Devices"
        description="Every phone, board and edge node registered with the platform. Status comes from heartbeats sent every 10 seconds."
        actions={
          <>
            <Input
              placeholder="Filter by model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-44"
            />
            <NativeSelect
              value={status}
              onChange={(e) => setStatus(e.target.value as NodeStatus | "")}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />
      <ErrorNote message={devices.error} />

      {!devices.loading && list.length === 0 ? (
        <EmptyState title="No devices match">
          Install the fabric agent app on a device to register it.
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Loaded model</TableHead>
                <TableHead className="text-right">Speed</TableHead>
                <TableHead>Power</TableHead>
                <TableHead className="text-right">Free RAM</TableHead>
                <TableHead className="pr-5 text-right">
                  Last heartbeat
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((device) => {
                const s = device.status
                return (
                  <TableRow key={device.deviceId}>
                    <TableCell className="pl-5">
                      <Link
                        href={`/devices/${device.deviceId}`}
                        className="block hover:underline"
                      >
                        <span className="block font-medium">
                          {device.deviceProfile?.manufacturer}{" "}
                          {device.deviceProfile?.model ?? "Unknown device"}
                        </span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {device.deviceId}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s?.status} />
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {s?.loadedModel ?? (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(
                        device.aiCapability?.benchmark
                          ?.generationTokensPerSecond
                      )}
                      <span className="text-muted-foreground"> tok/s</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          {s?.charging ? (
                            <BatteryChargingIcon className="size-3.5 text-success" />
                          ) : (
                            <BatteryIcon className="size-3.5" />
                          )}
                          {s?.batteryLevel !== undefined
                            ? `${Math.round(s.batteryLevel)}%`
                            : "–"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThermometerIcon className="size-3.5" />
                          {s?.temperature
                            ? `${formatNumber(s.temperature)}°`
                            : "–"}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(s?.availableMemoryBytes)}
                    </TableCell>
                    <TableCell className="pr-5 text-right text-muted-foreground">
                      {timeAgo(device.lastHeartbeat)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
