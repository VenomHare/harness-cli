import type { AgentOptions, AssistantMessage, Message } from "../types";

export async function runAgent(options: AgentOptions) {
    const { maxTurns = 20, provider, model, system, tools, messages, onEvent } = options;

    const push = (message: Message) => {
        messages.push(message)
        onEvent({ type: "message", message })
    }

    for (let turn = 0; turn <= maxTurns; ++turn) {
        let assistantMsg: AssistantMessage | undefined;
        for await (const chunk of provider.stream({ messages, model, tools, system })) {
            if (chunk.type === "text_delta") {
                onEvent({ type: "text", delta: chunk.delta })
            }
            else {
                assistantMsg = chunk.message
            }
        }
        if (!assistantMsg) throw new Error("AssistantMsg is Empty");
        push(assistantMsg);
        onEvent({ type: "turn_end", message: assistantMsg })

        if (assistantMsg.stopReason !== "toolUse") return;

        for (const call of assistantMsg.content) {
            if (call.type !== "toolCall") continue;
            onEvent({ type: "tool_start", toolCall: call });
            let result: string;
            let isError: boolean = false;
            try {
                const tool = tools.find((t) => t.name === call.name)
                if (!tool) throw new Error("Unknown Tool Call from LLM. Tool Name: " + call.name);
                result = await tool.execute(call.arguments);
            }
            catch (error) {
                result = `Error ${(error instanceof Error) ? error.message : String(error)}`
                isError = true
            }
            onEvent({ type: "tool_end", toolCall: call, result, isError });
            push({ role: "toolResult", toolCallId: call.id, toolName: call.name, content: result, isError });
        }
    }
    throw new Error(`Stopped after ${maxTurns} Turns`);

}