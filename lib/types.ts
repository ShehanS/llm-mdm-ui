// Shapes of the mdm backend responses (com.s3.mdm.dtos / entities).

export type NodeStatus =
  | "OFFLINE"
  | "JOINING"
  | "BENCHMARKING"
  | "MODEL_DOWNLOADING"
  | "READY"
  | "BUSY"
  | "DRAINING"
  | "COOLING"
  | "PAUSED"
  | "ERROR"

export type DeviceType = "MOBILE" | "IOT_BOARDS" | "PC"

export interface ResponseMessage<T> {
  code: string
  message: string
  data: T | null
  error: unknown
}

export interface DeviceProfile {
  deviceName?: string
  manufacturer?: string
  model?: string
  mac?: string
  serial?: string
  os?: string
  osVersion?: string
  architecture?: string
  storage?: { totalBytes: number; freeBytes: number; usedBytes: number }
  memory?: { totalBytes: number; availableBytes: number; usedBytes: number }
  cpus?: {
    coreId?: string
    maxFrequency: number
    currentFrequency: number
    utilization: number
  }[]
  gpu?: {
    name?: string
    vendor?: string
    vulkanSupported: boolean
    openCLSupported: boolean
    memoryBytes: number
  }
}

export interface DeviceStatus {
  status?: NodeStatus
  batteryLevel?: number
  charging?: boolean
  temperature?: number
  cpuUsage?: number
  availableMemoryBytes?: number
  availableStorageBytes?: number
  activeJobs?: number
  queuedJobs?: number
  lastUpdated?: string
  loadedModel?: string | null
  serverReady?: boolean
  // AUTO downloads a model itself when the device has none; MANUAL waits for an admin push.
  modelMode?: "AUTO" | "MANUAL" | null
  downloadModelId?: string | null
  downloadPercent?: number | null
  installedModels?: string[] | null
  // Set while the device uploads a model to mdm ("Copy to PC").
  uploadModelId?: string | null
  uploadPercent?: number | null
  // True while the device runs a benchmark.
  benchmarking?: boolean | null
}

export interface Benchmark {
  modelId?: string
  promptTokensPerSecond: number
  generationTokensPerSecond: number
  testedMemoryUsageBytes: number
  testedAt?: string
}

export interface Device {
  deviceId: string
  deviceType?: DeviceType
  deviceProfile?: DeviceProfile
  status?: DeviceStatus
  aiCapability?: {
    backends?: string[]
    recommendedMaxModelSizeBytes?: number
    maxContextSize?: number
    benchmark?: Benchmark | null
  }
  models?: {
    modelId?: string
    modelName?: string
    quantization?: string
    sizeBytes?: number
    status?: string
  }[]
  createdTime?: string
  updatedTime?: string
  lastHeartbeat?: string
  active?: boolean
}

export interface CatalogModel {
  modelId: string
  name?: string
  family?: string
  parameters?: string
  quantization?: string
  format?: string
  fileName?: string
  sizeBytes?: number
  minRamBytes?: number
  contextSize?: number
  downloadUrl?: string
  sha256?: string
  capabilities?: string[]
  reasoning?: boolean
  enabled?: boolean
  createdTime?: string
  updatedTime?: string
}

export interface InferenceLog {
  requestId: string
  requestedModel?: string
  deviceId?: string
  servedModel?: string
  location?: string
  status: "SUCCESS" | "FAILED" | "DEVICE_ERROR" | "NO_DEVICE" | string
  latencyMs: number
  promptTokens?: number
  completionTokens?: number
  tokensPerSecond?: number
  error?: string
  // API key that made the request; empty for console requests.
  apiKeyName?: string | null
  createdAt: string
  // Recorded conversation; only in the detail (api.inferenceLog), not in the list.
  messagesRecorded?: boolean
  requestMessages?: { role: string; content: string }[] | null
  requestOptions?: Record<string, string | number | boolean | null> | null
  responseContent?: string | null
  finishReason?: string | null
  truncated?: boolean
}

// Client API key for the inference API. key (the secret) is only present right after creation.
export interface ApiKey {
  keyId: string
  name: string
  keyPrefix: string
  deviceIds: string[]
  models: string[]
  enabled: boolean
  createdTime?: string
  lastUsedTime?: string | null
  requestCount: number
  key?: string | null
}

export interface OpenAiModelList {
  object: "list"
  data: { id: string; object: "model"; owned_by: string; devices: number }[]
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatCompletion {
  choices?: { message: ChatMessage; finish_reason?: string }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timings?: { predicted_per_second?: number; prompt_per_second?: number }
  fabric?: {
    requestId: string
    deviceId: string
    location: string
    latencyMs: number
  }
  error?: { message: string; type?: string; code?: string }
}
