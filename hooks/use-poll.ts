"use client"

import * as React from "react"

export interface PollState<T> {
  data: T | undefined
  error: string | undefined
  loading: boolean
  refresh: () => void
}

// Loads `fetcher` now and then every `intervalMs`; pauses while the tab is hidden.
// `loading` is true only until the first response; later refreshes keep showing the previous data.
export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs = 5000,
  deps: React.DependencyList = []
): PollState<T> {
  const [data, setData] = React.useState<T>()
  const [error, setError] = React.useState<string>()
  const [loading, setLoading] = React.useState(true)
  const fetcherRef = React.useRef(fetcher)

  React.useLayoutEffect(() => {
    fetcherRef.current = fetcher
  })

  const load = React.useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const first = window.setTimeout(load, 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load()
    }, intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, intervalMs, ...deps])

  return { data, error, loading, refresh: load }
}
