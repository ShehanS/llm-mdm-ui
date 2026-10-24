"use client"

import * as React from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { EmptyState, ErrorNote, PageHeader } from "@/components/fabric"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatBytes } from "@/lib/format"
import type { CatalogModel } from "@/lib/types"

const EMPTY: CatalogModel = {
  modelId: "",
  format: "GGUF",
  contextSize: 4096,
  capabilities: ["chat"],
  enabled: true,
}

export default function ModelsPage() {
  const catalog = usePoll(() => api.catalog(), 15000)
  const loaded = usePoll(() => api.loadedModels(), 5000)
  const [editing, setEditing] = React.useState<{
    model: CatalogModel
    isNew: boolean
  } | null>(null)

  const devicesFor = (model: CatalogModel) => {
    const names = [
      model.name,
      model.modelId,
      model.fileName?.replace(/\.gguf$/i, ""),
    ]
      .filter(Boolean)
      .map((n) => n!.toLowerCase())
    return (loaded.data?.data ?? [])
      .filter((m) =>
        names.some(
          (n) =>
            m.id.toLowerCase().includes(n) || n.includes(m.id.toLowerCase())
        )
      )
      .reduce((sum, m) => sum + m.devices, 0)
  }

  async function remove(model: CatalogModel) {
    if (!window.confirm(`Delete ${model.modelId} from the catalog?`)) return
    await api.deleteModel(model.modelId)
    catalog.refresh()
  }

  const list = catalog.data ?? []

  return (
    <>
      <PageHeader
        title="Model catalog"
        description="GGUF models the fabric knows about. Devices report which one they have loaded; the router sends requests to matching devices."
        actions={
          <Button
            onClick={() => setEditing({ model: { ...EMPTY }, isNew: true })}
          >
            <PlusIcon /> Add model
          </Button>
        }
      />
      <ErrorNote message={catalog.error} />

      {(loaded.data?.data.length ?? 0) > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Serving now:</span>
          {loaded.data!.data.map((m) => (
            <Badge key={m.id} variant="secondary" className="font-normal">
              {m.id} · {m.devices} device{m.devices === 1 ? "" : "s"}
            </Badge>
          ))}
        </div>
      )}

      {!catalog.loading && list.length === 0 ? (
        <EmptyState title="The catalog is empty">
          Add the models your devices should run.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((model) => {
            const serving = devicesFor(model)
            return (
              <Card key={model.modelId}>
                <CardHeader>
                  <CardTitle className="truncate">
                    {model.name || model.modelId}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {model.modelId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      model.family,
                      model.parameters,
                      model.quantization,
                      model.format,
                    ]
                      .filter(Boolean)
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    {model.reasoning && (
                      <Badge variant="outline" className="font-normal">
                        reasoning
                      </Badge>
                    )}
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Size</dt>
                      <dd className="font-medium tabular-nums">
                        {formatBytes(model.sizeBytes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Min RAM</dt>
                      <dd className="font-medium tabular-nums">
                        {formatBytes(model.minRamBytes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Context</dt>
                      <dd className="font-medium tabular-nums">
                        {model.contextSize ?? "–"}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={
                          serving
                            ? "size-1.5 rounded-full bg-success"
                            : "size-1.5 rounded-full bg-offline"
                        }
                      />
                      {serving
                        ? `On ${serving} device${serving === 1 ? "" : "s"}`
                        : "Not loaded anywhere"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit"
                        onClick={() =>
                          setEditing({ model: { ...model }, isNew: false })
                        }
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete"
                        onClick={() => remove(model)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ModelDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          catalog.refresh()
        }}
      />
    </>
  )
}

function ModelDialog({
  state,
  onClose,
  onSaved,
}: {
  state: { model: CatalogModel; isNew: boolean } | null
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {state && (
          // Keyed so every open starts from the model being edited.
          <ModelForm
            key={`${state.isNew}-${state.model.modelId}`}
            initial={state.model}
            isNew={state.isNew}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModelForm({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: CatalogModel
  isNew: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = React.useState<CatalogModel>(initial)
  const [error, setError] = React.useState<string>()
  const [saving, setSaving] = React.useState(false)

  const set = <K extends keyof CatalogModel>(key: K, value: CatalogModel[K]) =>
    setForm((f) => ({ ...f, [key]: value }))
  const num = (value: string) => (value === "" ? undefined : Number(value))
  const gb = (bytes?: number) =>
    bytes ? String(+(bytes / 1024 ** 3).toFixed(2)) : ""
  const fromGb = (value: string) =>
    value === "" ? undefined : Math.round(Number(value) * 1024 ** 3)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!form.modelId.trim()) {
      setError("Model ID is required")
      return
    }
    setSaving(true)
    try {
      await api.saveModel({ ...form, modelId: form.modelId.trim() }, isNew)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{isNew ? "Add model" : "Edit model"}</DialogTitle>
        <DialogDescription>
          Catalog entries describe GGUF files devices can download and run.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Model ID" className="col-span-2">
          <Input
            value={form.modelId}
            disabled={!isNew}
            onChange={(e) => set("modelId", e.target.value)}
            placeholder="qwen3-1.7b-q4km"
          />
        </Field>
        <Field label="Display name" className="col-span-2">
          <Input
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Qwen3-1.7B-Q4_K_M"
          />
        </Field>
        <Field label="Family">
          <Input
            value={form.family ?? ""}
            onChange={(e) => set("family", e.target.value)}
            placeholder="qwen"
          />
        </Field>
        <Field label="Parameters">
          <Input
            value={form.parameters ?? ""}
            onChange={(e) => set("parameters", e.target.value)}
            placeholder="1.7B"
          />
        </Field>
        <Field label="Quantization">
          <Input
            value={form.quantization ?? ""}
            onChange={(e) => set("quantization", e.target.value)}
            placeholder="Q4_K_M"
          />
        </Field>
        <Field label="Context size">
          <Input
            type="number"
            value={form.contextSize ?? ""}
            onChange={(e) => set("contextSize", num(e.target.value))}
          />
        </Field>
        <Field label="File size (GB)">
          <Input
            type="number"
            step="0.01"
            value={gb(form.sizeBytes)}
            onChange={(e) => set("sizeBytes", fromGb(e.target.value))}
          />
        </Field>
        <Field label="Min RAM (GB)">
          <Input
            type="number"
            step="0.1"
            value={gb(form.minRamBytes)}
            onChange={(e) => set("minRamBytes", fromGb(e.target.value))}
          />
        </Field>
        <Field label="File name" className="col-span-2">
          <Input
            value={form.fileName ?? ""}
            onChange={(e) => set("fileName", e.target.value)}
            placeholder="Qwen3-1.7B-Q4_K_M.gguf (put the file in mdm's models folder)"
          />
        </Field>
        <Field label="Download URL (optional)" className="col-span-2">
          <Input
            value={form.downloadUrl ?? ""}
            onChange={(e) => set("downloadUrl", e.target.value)}
            placeholder="Leave empty: devices download the file from mdm"
          />
        </Field>
        <Field label="SHA-256" className="col-span-2">
          <Input
            value={form.sha256 ?? ""}
            onChange={(e) => set("sha256", e.target.value)}
            className="font-mono text-xs"
          />
        </Field>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.reasoning ?? false}
            onChange={(e) => set("reasoning", e.target.checked)}
          />
          Reasoning model (has a thinking mode)
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
