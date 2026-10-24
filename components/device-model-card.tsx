"use client"

import * as React from "react"
import { DownloadIcon, PlayIcon, UploadIcon } from "lucide-react"

import { NativeSelect } from "@/components/fabric"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatBytes } from "@/lib/format"
import type { DeviceStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

// Shows the device's model state and lets an admin push a catalog model to it.
export function DeviceModelCard({
  deviceId,
  status,
  online,
}: {
  deviceId: string
  status?: DeviceStatus
  online: boolean
}) {
  const catalog = usePoll(() => api.catalog(), 30000)
  const models = (catalog.data ?? []).filter((m) => m.enabled !== false)
  const [selected, setSelected] = React.useState("")
  const [pushing, setPushing] = React.useState(false)
  const [result, setResult] = React.useState<{ ok: boolean; text: string }>()

  const choice = selected || models[0]?.modelId || ""
  const installed = new Set(status?.installedModels ?? [])
  const inCatalog = new Set((catalog.data ?? []).map((m) => m.modelId))
  const downloading = status?.downloadModelId
  const uploading = status?.uploadModelId
  const manual = status?.modelMode === "MANUAL"

  // Same command for both buttons: the device loads the model, downloading it first only if it is missing.
  async function push(modelId: string) {
    setPushing(true)
    setResult(undefined)
    try {
      setResult({ ok: true, text: await api.pushModel(deviceId, modelId) })
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : String(e) })
    } finally {
      setPushing(false)
    }
  }

  async function copyToPc(modelId: string) {
    setPushing(true)
    setResult(undefined)
    try {
      setResult({
        ok: true,
        text: await api.copyModelToPlatform(deviceId, modelId),
      })
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : String(e) })
    } finally {
      setPushing(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>
          {status?.modelMode
            ? manual
              ? "Manual mode: the device waits for you to push a model."
              : "Auto mode: the device downloads a model itself when it has none."
            : "Push a catalog model to this device. It downloads from mdm and switches to it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Serving</p>
            <p className="mt-1 font-medium">{status?.loadedModel ?? "–"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mode</p>
            <p className="mt-1 font-medium">
              {status?.modelMode === "MANUAL"
                ? "Manual"
                : status?.modelMode === "AUTO"
                  ? "Auto"
                  : "–"}
            </p>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-muted-foreground">On the device</p>
          {installed.size === 0 ? (
            <p className="mt-1 font-medium">–</p>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {[...installed].map((name) => {
                const serving = status?.loadedModel === name
                const onPc = inCatalog.has(name)
                return (
                  <li
                    key={name}
                    className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-xs">{name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {onPc ? "in catalog" : "phone only"}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {!onPc && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => copyToPc(name)}
                          disabled={!online || pushing || Boolean(uploading)}
                          title="Upload this model to the PC's models folder and add it to the catalog"
                        >
                          <UploadIcon /> Copy to PC
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant={serving ? "ghost" : "outline"}
                        onClick={() => push(name)}
                        disabled={
                          serving || !online || pushing || Boolean(downloading)
                        }
                      >
                        {serving ? (
                          "Serving"
                        ) : (
                          <>
                            <PlayIcon /> Load
                          </>
                        )}
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {downloading && (
          <Progress
            label="Downloading"
            modelId={downloading}
            percent={status?.downloadPercent ?? 0}
          />
        )}
        {uploading && (
          <Progress
            label="Copying to PC"
            modelId={uploading}
            percent={status?.uploadPercent ?? 0}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NativeSelect
            value={choice}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Catalog model"
            className="h-9 sm:min-w-80"
            disabled={models.length === 0}
          >
            {models.length === 0 && <option value="">No catalog models</option>}
            {models.map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.name ?? m.modelId} · {formatBytes(m.sizeBytes)}
                {installed.has(m.modelId) ? " · on device" : ""}
                {status?.loadedModel === m.modelId ? " · serving" : ""}
              </option>
            ))}
          </NativeSelect>
          <Button
            onClick={() => push(choice)}
            disabled={
              !online ||
              pushing ||
              !choice ||
              Boolean(downloading) ||
              status?.loadedModel === choice
            }
          >
            {installed.has(choice) ? <PlayIcon /> : <DownloadIcon />}
            {pushing
              ? "Sending…"
              : status?.loadedModel === choice
                ? "Serving"
                : installed.has(choice)
                  ? "Load model"
                  : "Push to device"}
          </Button>
        </div>
        {!online && (
          <p className="text-sm text-muted-foreground">
            The device is offline. Start its agent to push a model.
          </p>
        )}
        {result && (
          <p
            className={cn(
              "text-sm",
              result.ok ? "text-muted-foreground" : "text-destructive"
            )}
          >
            {result.ok ? `Device: ${result.text}` : result.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Progress({
  label,
  modelId,
  percent,
}: {
  label: string
  modelId: string
  percent: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {label} <span className="font-mono">{modelId}</span>
        </span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
