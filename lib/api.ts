import type {
  ApiKey,
  CatalogModel,
  ChatCompletion,
  ChatMessage,
  Device,
  InferenceLog,
  NodeStatus,
  OpenAiModelList,
  ResponseMessage,
} from "@/lib/types"

// Proxied to the mdm backend by next.config.ts.
const BASE = "/api/mdm"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    })
  } catch {
    throw new ApiError("Cannot reach the mdm backend", 0)
  }
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    // Not JSON: usually the proxy's own "Internal Server Error" page when mdm is down or too slow.
  }
  if (!response.ok && !(body && typeof body === "object")) {
    throw new ApiError(
      response.status >= 500
        ? `mdm did not answer (HTTP ${response.status}). Is it running? Check the console server log.`
        : `mdm returned HTTP ${response.status}`,
      response.status
    )
  }
  if (body === null && text) {
    throw new ApiError("mdm sent a response that is not JSON", response.status)
  }
  return body as T
}

// mdm wraps most responses in ResponseMessage { code, message, data, error }.
async function unwrap<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await request<ResponseMessage<T>>(path, init)
  if (body.data === null || body.data === undefined) {
    throw new ApiError(body.message || "Request failed", 404)
  }
  return body.data
}

export const api = {
  devices: (filters?: { status?: NodeStatus; model?: string }) => {
    const query = new URLSearchParams()
    if (filters?.status) query.set("status", filters.status)
    if (filters?.model) query.set("model", filters.model)
    const suffix = query.size ? `?${query}` : ""
    return unwrap<Device[]>(`/api/devices${suffix}`)
  },

  device: (deviceId: string) =>
    unwrap<Device>(`/api/devices/${encodeURIComponent(deviceId)}`),

  catalog: () => unwrap<CatalogModel[]>("/api/models"),

  saveModel: (model: CatalogModel, isNew: boolean) =>
    unwrap<CatalogModel>(
      isNew
        ? "/api/models"
        : `/api/models/${encodeURIComponent(model.modelId)}`,
      {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(model),
      }
    ),

  deleteModel: (modelId: string) =>
    request<ResponseMessage<null>>(
      `/api/models/${encodeURIComponent(modelId)}`,
      { method: "DELETE" }
    ),

  // Tells the device to download (if needed) and serve a catalog model. Resolves with the device's answer.
  pushModel: async (deviceId: string, modelId: string) => {
    const body = await request<ResponseMessage<string>>(
      `/api/devices/${encodeURIComponent(deviceId)}/model`,
      { method: "POST", body: JSON.stringify({ modelId }) }
    )
    if (body.code !== "CODE-013") {
      throw new ApiError(
        typeof body.error === "string" ? body.error : body.message,
        400
      )
    }
    return body.data ?? body.message
  },

  // "Copy to PC": the device uploads a stored model to mdm, which adds it to the catalog.
  copyModelToPlatform: async (deviceId: string, modelId: string) => {
    const body = await request<ResponseMessage<string>>(
      `/api/devices/${encodeURIComponent(deviceId)}/models/${encodeURIComponent(modelId)}/copy-to-platform`,
      { method: "POST" }
    )
    if (body.code !== "CODE-015") {
      throw new ApiError(
        typeof body.error === "string" ? body.error : body.message,
        400
      )
    }
    return body.data ?? body.message
  },

  // Console (admin) routes: no API key needed. Public clients use /v1 with a key.
  // Starts the benchmark on a device; the result shows up later in device.aiCapability.benchmark.
  runBenchmark: async (deviceId: string) => {
    const body = await request<ResponseMessage<string>>(
      `/api/devices/${encodeURIComponent(deviceId)}/benchmark`,
      { method: "POST" }
    )
    if (body.code !== "CODE-021") {
      throw new ApiError(
        typeof body.error === "string" ? body.error : body.message,
        400
      )
    }
    return body.data ?? body.message
  },

  loadedModels: () => request<OpenAiModelList>("/api/inference/models"),

  keys: () => unwrap<ApiKey[]>("/api/keys"),

  createKey: (key: { name: string; deviceIds: string[]; models: string[] }) =>
    unwrap<ApiKey>("/api/keys", { method: "POST", body: JSON.stringify(key) }),

  updateKey: (
    keyId: string,
    changes: {
      name?: string
      deviceIds?: string[]
      models?: string[]
      enabled?: boolean
    }
  ) =>
    unwrap<ApiKey>(`/api/keys/${encodeURIComponent(keyId)}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    }),

  deleteKey: (keyId: string) =>
    request<ResponseMessage<null>>(`/api/keys/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
    }),

  inferenceLogs: (limit = 50) =>
    request<InferenceLog[]>(`/api/inference/logs?limit=${limit}`),

  // Every attempt of one request (a failed device, then the one that answered), with messages and reply.
  inferenceLog: (requestId: string) =>
    request<InferenceLog[]>(
      `/api/inference/logs/${encodeURIComponent(requestId)}`
    ),

  chat: (
    body: {
      model: string
      messages: ChatMessage[]
      max_tokens?: number
      temperature?: number
    },
    deviceId?: string
  ) =>
    request<ChatCompletion>("/api/inference/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: deviceId ? { "X-Fabric-Device": deviceId } : undefined,
    }),
}

// Address public clients use for the inference API (mdm itself, not this console).
// Set NEXT_PUBLIC_MDM_PUBLIC_URL once mdm has a public address; otherwise mdm's port on this host.
export function publicApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_MDM_PUBLIC_URL
  if (configured) return configured.replace(/\/$/, "")
  if (typeof window === "undefined") return "http://localhost:8095"
  return `${window.location.protocol}//${window.location.hostname}:8095`
}
