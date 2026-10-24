"use client"

import * as React from "react"
import Link from "next/link"

import {
  EmptyState,
  ErrorNote,
  NativeSelect,
  PageHeader,
  StatusBadge,
} from "@/components/fabric"
import { LogDetailDialog } from "@/components/log-detail-dialog"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePoll } from "@/hooks/use-poll"
import { api } from "@/lib/api"
import { formatDateTime, formatMs, formatNumber } from "@/lib/format"

export default function LogsPage() {
  const [limit, setLimit] = React.useState(100)
  const logs = usePoll(() => api.inferenceLogs(limit), 5000, [limit])
  const list = logs.data ?? []
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <>
      <PageHeader
        title="Inference logs"
        description="Every request the router handled: which device ran it, how long it took and how many tokens it used. Click a row to see the messages and the reply."
        actions={
          <NativeSelect
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Rows"
          >
            {[50, 100, 250, 500].map((n) => (
              <option key={n} value={n}>
                Last {n}
              </option>
            ))}
          </NativeSelect>
        }
      />
      <ErrorNote message={logs.error} />

      {!logs.loading && list.length === 0 ? (
        <EmptyState title="No requests logged yet">
          Send a message from the playground.
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Tokens in / out</TableHead>
                <TableHead className="pr-5 text-right">Speed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((log, index) => (
                <TableRow
                  key={`${log.requestId}-${index}`}
                  className="cursor-pointer"
                  onClick={() => setSelected(log.requestId)}
                >
                  <TableCell className="pl-5 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.error ? (
                      <Tooltip>
                        <TooltipTrigger render={<span />}>
                          <StatusBadge status={log.status} />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          {log.error}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <StatusBadge status={log.status} />
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    {log.servedModel ?? log.requestedModel ?? "auto"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.deviceId ? (
                      <Link
                        href={`/devices/${log.deviceId}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.deviceId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-36 truncate text-muted-foreground">
                    {log.apiKeyName ?? "console"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMs(log.latencyMs)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {log.promptTokens ?? "–"} / {log.completionTokens ?? "–"}
                  </TableCell>
                  <TableCell className="pr-5 text-right tabular-nums">
                    {log.tokensPerSecond
                      ? `${formatNumber(log.tokensPerSecond)} tok/s`
                      : "–"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <LogDetailDialog requestId={selected} onClose={() => setSelected(null)} />
    </>
  )
}
