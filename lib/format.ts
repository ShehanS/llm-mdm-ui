export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || bytes <= 0) return "–"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "never"
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  )
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "–"
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function formatMs(ms?: number | null): string {
  if (ms === undefined || ms === null) return "–"
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

export function formatNumber(value?: number | null, digits = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "–"
  return value.toFixed(digits)
}
