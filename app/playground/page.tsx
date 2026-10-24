"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SendIcon, SmartphoneIcon, Trash2Icon } from "lucide-react"

import { EmptyState, NativeSelect, PageHeader } from "@/components/fabric"
import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatMs, formatNumber } from "@/lib/format"
import type { ChatCompletion, ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Turn extends ChatMessage {
  meta?: ChatCompletion["fabric"] & { tokensPerSecond?: number }
  failed?: boolean
}

export default function PlaygroundPage() {
  return (
    <React.Suspense>
      <Playground />
    </React.Suspense>
  )
}

function Playground() {
  const searchParams = useSearchParams()
  const models = usePoll(() => api.loadedModels(), 5000)
  const devices = usePoll(() => api.devices(), 10000)
  const [model, setModel] = React.useState("auto")
  const [deviceId, setDeviceId] = React.useState(
    searchParams.get("device") ?? ""
  )
  const [input, setInput] = React.useState("")
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [sending, setSending] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Block body on purpose: newer browsers return a Promise from scrollIntoView, and an effect
  // that returns a non-function crashes React.
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns, sending])

  const online = (devices.data ?? []).filter(
    (d) => d.status?.status === "READY" || d.status?.status === "BUSY"
  )

  // Catalog models no online phone has loaded: shown greyed out, since a chat cannot reach them.
  const catalog = usePoll(() => api.catalog(), 30000)
  const loadedIds = new Set(models.data?.data.map((m) => m.id))
  const unloaded = (catalog.data ?? []).filter(
    (m) => m.enabled !== false && !loadedIds.has(m.modelId)
  )
  const storedOn = (modelId: string) =>
    (devices.data ?? [])
      .filter((d) => d.status?.installedModels?.includes(modelId))
      .map((d) => d.deviceProfile?.model ?? d.deviceId)

  async function send(event?: React.FormEvent) {
    event?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    const history: ChatMessage[] = [
      ...turns
        .filter((t) => !t.failed)
        .map(({ role, content }) => ({ role, content })),
      { role: "user", content: text },
    ]
    setTurns((t) => [...t, { role: "user", content: text }])
    setInput("")
    setSending(true)
    try {
      const reply = await api.chat(
        { model, messages: history, max_tokens: 256 },
        deviceId || undefined
      )
      const content = reply.choices?.[0]?.message?.content?.trim()
      if (content) {
        setTurns((t) => [
          ...t,
          {
            role: "assistant",
            content,
            meta: reply.fabric && {
              ...reply.fabric,
              tokensPerSecond: reply.timings?.predicted_per_second,
            },
          },
        ])
      } else {
        setTurns((t) => [
          ...t,
          {
            role: "assistant",
            content: reply.error?.message ?? "No answer",
            failed: true,
          },
        ])
      }
    } catch (e) {
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : String(e),
          failed: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Playground"
        description="Chat with the fabric. Requests go through mdm's router to an online device, exactly like any OpenAI client would."
        actions={
          <>
            <NativeSelect
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Model"
            >
              <option value="auto">Any model</option>
              {models.data?.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
              {unloaded.length > 0 && (
                <optgroup label="Not loaded – push from a device page">
                  {unloaded.map((m) => {
                    const stored = storedOn(m.modelId)
                    return (
                      <option key={m.modelId} value={m.modelId} disabled>
                        {m.name ?? m.modelId}
                        {stored.length > 0
                          ? ` · stored on ${stored.join(", ")}`
                          : " · not on any phone"}
                      </option>
                    )
                  })}
                </optgroup>
              )}
            </NativeSelect>
            <NativeSelect
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              aria-label="Device"
            >
              <option value="">Router picks device</option>
              {online.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.deviceProfile?.model ?? d.deviceId}
                </option>
              ))}
            </NativeSelect>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear chat"
              onClick={() => setTurns([])}
              disabled={turns.length === 0}
            >
              <Trash2Icon />
            </Button>
          </>
        }
      />

      <Card className="py-0">
        <CardContent className="flex h-[min(60vh,620px)] flex-col gap-4 overflow-y-auto px-5 py-6 md:px-8">
          {turns.length === 0 && !sending && (
            <div className="m-auto w-full max-w-md">
              <EmptyState title="Ask something">
                Short tasks suit small phone models best: summaries,
                classification, extraction, quick facts.
              </EmptyState>
            </div>
          )}
          {turns.map((turn, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-1.5",
                turn.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  turn.role === "user"
                    ? "rounded-br-md bg-primary whitespace-pre-wrap text-primary-foreground"
                    : turn.failed
                      ? "rounded-bl-md border border-destructive/30 bg-destructive/5 whitespace-pre-wrap text-destructive"
                      : "rounded-bl-md bg-muted"
                )}
              >
                {turn.role === "assistant" && !turn.failed ? (
                  <Markdown>{turn.content}</Markdown>
                ) : (
                  turn.content
                )}
              </div>
              {turn.meta && (
                <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <SmartphoneIcon className="size-3" />
                  {turn.meta.deviceId} · {formatMs(turn.meta.latencyMs)}
                  {turn.meta.tokensPerSecond
                    ? ` · ${formatNumber(turn.meta.tokensPerSecond)} tok/s`
                    : ""}
                </span>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary" />{" "}
              Waiting for a device…
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <form
          onSubmit={send}
          className="flex items-end gap-3 border-t border-border p-4"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Message the fabric…  (Enter to send, Shift+Enter for a new line)"
            className="max-h-40 min-h-11 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={sending || !input.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </Button>
        </form>
      </Card>
      {unloaded.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {unloaded.map((m) => m.name ?? m.modelId).join(", ")}{" "}
          {unloaded.length === 1 ? "is" : "are"} in the catalog but not loaded
          on any online phone. To chat with{" "}
          {unloaded.length === 1 ? "it" : "one"}, open{" "}
          <Link href="/devices" className="underline underline-offset-2">
            Devices
          </Link>
          , pick a phone and use{" "}
          <span className="font-medium">Push to device</span>.
        </p>
      )}
    </>
  )
}
