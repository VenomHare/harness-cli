
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
export type Tool = ToolSpec & { execute(args: Record<string, unknown>): Promise<string> }

export type ToolMessageResult = { role: "toolResult", toolCallId: string, toolName: string, content: string, isError: boolean }

export type AssistantMessage = {
    role: "assistant";
    content: ContentBlock[],
    usage: Usage;
    stopReason: StopReason;
};

export type UserMessage= {
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
    tools?: Tool[]
}
export type Provider = {
    name: string,
    defaultModel: string,
    stream(params: StreamParams): AsyncIterable<StreamEvent>
}
