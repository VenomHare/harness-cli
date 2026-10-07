import OpenAI from "openai";
import type { ContentBlock, CreateOpenAICompactProviderParams, Message, Provider, StopReason, Usage } from "../types";

function toOpenAIMessages(messages: Message[]): OpenAI.ChatCompletionMessageParam[] {
    return messages.map((m): OpenAI.ChatCompletionMessageParam => {
        if (m.role === "user") {
            return { role: "user", content: m.content }
        }
        else if (m.role === "assistant") {
            const text = m.content.filter((b) => b.type === "text").map(b => b.text).join(" ");
            const calls = m.content.filter((b) => b.type === "toolCall");
            return {
                role: "assistant",
                content: text || null,
                tool_calls: calls.length ?
                    calls.map((c) => ({
                        id: c.id,
                        type: "function",
                        function: { name: c.name, arguments: JSON.stringify(c.arguments) }
                    }))
                    : undefined
            }
        }
        else if (m.role == "toolResult") {
            return {
                role: "tool",
                content: m.content,
                tool_call_id: m.toolCallId
            }
        }
        return m
    })
}

export const createOpenAICompact = ({ name, defaultModel, apiKey, baseURL }: CreateOpenAICompactProviderParams): Provider => {
    return {
        name,
        defaultModel,
        async *stream({ messages, model, maxTokens, system, tools = [], onExit }) {
            // Create the SDK client only when a request is made. The app can
            // safely render its key-entry screen while a provider is still
            // unconfigured; OpenAI validates credentials in its constructor.
            const client = new OpenAI({
                baseURL,
                apiKey
            });
            const chat = toOpenAIMessages(messages);

            // Create AbortController for process exit handling
            const abortController = new AbortController();
            const handleExit = () => {
                abortController.abort();
                if (onExit) onExit();
            };

            // Register exit handlers
            process.on('exit', handleExit);
            process.on('SIGINT', handleExit);
            process.on('SIGTERM', handleExit);

            try {
                const stream = await client.chat.completions.create({
                    model: model ?? defaultModel,
                    max_tokens: maxTokens,
                    stream: true,
                    tools: tools.length ?
                        tools.map((t) => ({
                            type: "function",
                            function: {
                                name: t.name,
                                description: t.description,
                                parameters: t.parameters
                            }
                        }))
                        : undefined,
                    messages: system ? [{ role: "system", content: system }, ...chat] : chat,
                } as any);

                const calls: { id: string, name: string, args: string }[] = [];
                let text = "";
                let usage: Usage = { output: 0, input: 0 }
                let stop: StopReason = "stop";
                for await (const chunk of stream as any) {
                    if (abortController.signal.aborted) {
                        throw new Error("Request aborted due to process exit");
                    }
                    const choice = chunk.choices[0];
                    if (choice?.delta.content) {
                        text += choice.delta.content;
                        yield {
                            type: 'text_delta',
                            delta: choice.delta.content
                        }
                    }

                    for await (const tc of choice?.delta.tool_calls ?? []) {
                        if (!calls[tc.index]) {
                            calls[tc.index] = {
                                id: tc.id ?? `call_${tc.index}`,
                                name: tc.function?.name ?? "",
                                args: tc.function?.arguments ?? ""
                            };
                        }
                        else {
                            calls[tc.index]!.args += tc.function?.arguments
                        }
                    }

                    if (choice?.finish_reason == "stop") stop = "stop"
                    else if (choice?.finish_reason == "length") stop = "length"
                    if (chunk.usage) usage = { input: chunk.usage.prompt_tokens, output: chunk.usage.completion_tokens };
                }
                const contentBlock: ContentBlock[] = text ? [{ type: "text", text }] : []
                for (const c of calls) {
                    contentBlock.push({ type: "toolCall", id: c.id, name: c.name, arguments: JSON.parse(c.args) ?? {} })
                }
                if (contentBlock.some(c => c.type === "toolCall")) stop = "toolUse";
                yield {
                    type: "done",
                    message: {
                        role: "assistant",
                        stopReason: stop,
                        usage,
                        content: contentBlock
                    }
                }
            } finally {
                // Cleanup event listeners
                process.off('exit', handleExit);
                process.off('SIGINT', handleExit);
                process.off('SIGTERM', handleExit);
            }
        }
    }
}
