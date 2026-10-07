import type { Provider } from "../types";
import { createOpenAICompact } from "./openai-compact";

const providerSettings: Record<string, { defaultModel: string, baseURL: string }> = {
    openai: { defaultModel: "gpt-6-luna", baseURL: "https://api.openai.com/v1" },
    groq: { defaultModel: "qwen/qwen3.8-27b", baseURL: "https://api.groq.com/openai/v1" },
    openrouter: { defaultModel: "poolside/laguna-xs-2.1:free", baseURL: "https://openrouter.ai/api/v1" },
    anthropic: { defaultModel: "claude-opus-5-5", baseURL: "https://api.anthropic.com/v1/" },
};

export const getProvider = (name: string, apiKey = ""): Provider => {
    const settings = providerSettings[name];
    if (!settings) {
        console.error("Provider Not Found");
        process.exit(1);
    }
    return createOpenAICompact({ name, ...settings, apiKey });
}
