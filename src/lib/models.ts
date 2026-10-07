import type { Model, ModelsList } from "../types";

export const SUPPORTED_MODELS: ModelsList = {
    "openrouter": [
        { id: "openrouter/free", is_free: true },
        { id: "poolside/laguna-s-2.1:free", is_free: true },
        { id: "google/gemma-4-31b-it:free", is_free: true },

        { id: "deepseek/deepseek-v4.1-flash", is_free: false },
        { id: "z-ai/glm-5.3-flash", is_free: false },
        { id: "xiaomi/mimo-v2.6-flash", is_free: false },

        { id: "openai/gpt-5.6-sol", is_free: false },
        { id: "openai/gpt-5.6-terra", is_free: false },
        { id: "openai/gpt-5.6-luna", is_free: false },

        { id: "anthropic/claude-opus-5", is_free: false },
        { id: "anthropic/claude-sonnet-5", is_free: false },
        { id: "anthropic/claude-opus-4.8", is_free: false },
        { id: "anthropic/claude-sonnet-4.6", is_free: false },
        { id: "anthropic/claude-haiku-4.5", is_free: false },

        { id: "google/gemini-3.1-pro-preview", is_free: false },
        { id: "google/gemini-3-flash-preview", is_free: false },

        { id: "qwen/qwen3.8-27b", is_free: false },
        { id: "meta-llama/llama-4-maverick", is_free: false },
        { id: "moonshotai/kimi-k2.5", is_free: false }
    ],
    "groq": [
        { id: "openai/gpt-oss-120b", is_free: true },
        { id: "openai/gpt-oss-20b", is_free: true },
        { id: "openai/gpt-oss-safeguard-20b", is_free: true },
        { id: "qwen/qwen3.8-27b", is_free: true },
        { id: "minimaxai/minimax-m2.7", is_free: true }
    ],
    "openai": [
        { id: "gpt-5.6-sol", is_free: false },
        { id: "gpt-5.6-terra", is_free: false },
        { id: "gpt-5.6-luna", is_free: false },

        { id: "gpt-5.1", is_free: false },
        { id: "gpt-5", is_free: false },
        { id: "gpt-5-mini", is_free: false },
        { id: "gpt-5-nano", is_free: false },

        { id: "gpt-4.1", is_free: false },
        { id: "gpt-4.1-mini", is_free: false },
        { id: "gpt-4.1-nano", is_free: false },

        { id: "o3", is_free: false },
        { id: "o4-mini", is_free: false }
    ],
    "anthropic": [
        { id: "claude-opus-5", is_free: false },
        { id: "claude-opus-4.8", is_free: false },
        { id: "claude-opus-4.7", is_free: false },
        { id: "claude-opus-4.6", is_free: false },

        { id: "claude-sonnet-5", is_free: false },
        { id: "claude-sonnet-4.6", is_free: false },
        { id: "claude-sonnet-4.5", is_free: false },

        { id: "claude-haiku-4.5", is_free: false }
    ]
}
export const SUPPORTED_PROVIDERS= Object.keys(SUPPORTED_MODELS);


type ModelDetails = {
    provider: string
} & Model;
export const DEFAULT_MODEL: ModelDetails = {
    id: "qwen/qwen3.8-27b",
    is_free: true,
    provider: "groq",
}

export function getModelDetails(id: string, provider: string): ModelDetails {
    const model = SUPPORTED_MODELS[provider]?.find(m => m.id === id)
    return model ?
        { ...model, provider }
        : DEFAULT_MODEL;
}