import { log } from "../lib/config";
import type { AgentOptions, AssistantMessage, Message } from "../types";

export async function runAgent(options: AgentOptions) {
    const { maxTurns = 20, provider, model, system, tools, messages, onEvent, onExit } = options;
    const localMessages = [...messages];
    const push = (message: Message) => {
        localMessages.push(message);
        onEvent({ type: "message", message })
    }

    for (let turn = 0; turn <= maxTurns; ++turn) {
        let assistantMsg: AssistantMessage | undefined;
        log(`Before Making next api call messages are ${JSON.stringify(localMessages)}`)
        for await (const chunk of provider.stream({ messages:localMessages, model, tools, system, maxTokens: 12498, onExit })) {
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

        if (assistantMsg.stopReason !== "toolUse") {
            onEvent({ type: "done", message: assistantMsg })
            return;
        }


        for (const call of assistantMsg.content) {
            if (call.type !== "toolCall") continue;
            onEvent({ type: "tool_start", toolCall: call });
            let result: string;
            let isError: boolean = false;
            let displayString = "";
            try {
                const tool = tools.find((t) => t.name === call.name)
                if (!tool) throw new Error("Unknown Tool Call from LLM. Tool Name: " + call.name);
                result = await tool.execute(call.arguments);
                displayString = tool.getDisplayString(result);
            }
            catch (error) {
                result = `Error ${(error instanceof Error) ? error.message : String(error)}`
                isError = true
            }
            onEvent({ type: "tool_end", toolCall: call, result, isError });
            log("Added ToolResult for call " + call.id);
            push({ role: "toolResult", toolCallId: call.id, toolName: call.name, content: result, isError, displayString });

        }
    }
    throw new Error(`Stopped after ${maxTurns} Turns`);

}