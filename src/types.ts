
export type Usage = { input: number; output: number };
export type StopReason = "stop" | "length" | "toolUse";
export type TextBlock = { type: "text", text: string };
export type ToolCallBlock = { type: "toolCall", id: string, name: string, arguments: Record<string, unknown> };
export type ContentBlock = TextBlock | ToolCallBlock;

export interface ToolSpec {
    name: string,
    id: string,
    description: string,
    parameters: Record<string, unknown>,
}
export type Tool = ToolSpec & { 
    execute(args: Record<string, unknown>): Promise<string> 
    getDisplayString(result: string): string
}

export type ToolMessageResult = { role: "toolResult", toolCallId: string, toolName: string, content: string, isError: boolean, displayString: string }

export type AssistantMessage = {
    role: "assistant";
    content: ContentBlock[],
    usage: Usage;
    stopReason: StopReason;
};

export type UserMessage = {
    role: "user";
    content: string
};
export type Message = UserMessage | AssistantMessage | ToolMessageResult
export type StreamEvent =
    | { type: "text_delta"; delta: string }
    | { type: "done"; message: AssistantMessage };


export interface CreateOpenAICompactProviderParams {
    name: string,
    defaultModel: string,
    baseURL: string,
    apiKey: string
}

export type StreamParams = {
    messages: Message[],
    model?: string,
    maxTokens?: number,
    system?: string;
    tools?: Tool[],
    onExit?: () => void
}
export type Provider = {
    name: string,
    defaultModel: string,
    stream(params: StreamParams): AsyncIterable<StreamEvent>
}

export type AgentEvents =
    | { type: "text", delta: string }
    | { type: "tool_start", toolCall: ToolCallBlock }
    | { type: "tool_end", toolCall: ToolCallBlock, result: string, isError: boolean }
    | { type: "turn_end", message: AssistantMessage }
    | { type: "message", message: Message }
    | { type: "done", message: AssistantMessage }

export type AgentOptions = {
    provider: Provider,
    system?: string,
    model?: string,
    tools: Tool[],
    messages: Message[],
    maxTurns?: number,
    onEvent(event: AgentEvents): Promise<void>,
    onExit?: () => void
}

export type Model = { id: string, is_free: boolean }
export type ModelsList = Record<string, Model[]>