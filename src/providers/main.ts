import type { Provider } from "../types";
import { createOpenAICompact } from "./openai-compact";

const providers: Record<string, Provider> = {
    "openai": createOpenAICompact({
        name: "openai",
        defaultModel: "gpt-6-luna",
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY!
    }),
    "groq": createOpenAICompact({
        name: "groq",
        defaultModel: "qwen/qwen3.8-27b",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY!
    }),
    "openrouter": createOpenAICompact({
        name: "openrouter",
        defaultModel: "poolside/laguna-xs-2.1:free",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY!,
    })
}

export const getProvider = (name: string): Provider => {
    const provider = providers[name];
    if (!provider) {
        console.error("Provider Not Found");
        process.exit(1);
    }
    return provider;
}