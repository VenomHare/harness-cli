#!/usr/bin/env bun

import { fileURLToPath } from 'bun';
import { config } from 'dotenv'
import { parseArgs } from 'node:util'
import OpenAI from 'openai';
import { getProvider } from './providers/main';
import type { AssistantMessage, Message, Tool, ToolMessageResult } from './types';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

config({
    path: fileURLToPath(new URL("../.env", import.meta.url)),
    quiet: true,
});

const { values } = parseArgs({
    options: {
        "prompt": { type: "string", short: "p" },
        "model": { type: "string", short: "m" },
        "provider": { type: "string", default: "openrouter" }
    }
})
if (!values.prompt) {
    console.error("Prompt toh dal");
    process.exit(1);
}

const readTool: Tool = {
    name: "ReadTool",
    id: "readtool",
    description: "Reads a file and return its contents",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file, relative to current folder"
            },
        },
        required: ["path"]
    },
    async execute(args) {
        return readFile(resolve(process.cwd(), String(args.path)), "utf8");
    }
}
const tools: Tool[] = [readTool]

const provider = getProvider(values.provider);
const messages: Message[] = [{ role: "user", content: values.prompt }]
async function callModel(): Promise<AssistantMessage> {
    try {
        const stream = await provider.stream({
            model: values.model,
            messages,
            tools
        })
        for await (const chunk of stream) {
            if (chunk.type == "text_delta") {
                process.stdout.write(chunk.delta);
            }

            if (chunk.type == "done") {
                console.log(`\n\n Provider: ${provider.name} | ${values.model ?? provider.defaultModel} Input Tokens: ${chunk.message.usage.input} | Output Tokens: ${chunk.message.usage.output}`);
                return chunk.message;
            }
        }
        throw new Error("Stream Ended without a done chunk");
    }
    catch (err) {
        console.error((err as unknown as any).message)
        process.exit(1);
    }
}

const firstCall = await callModel();
messages.push(firstCall);
console.log("### firstCall Stop Reason: " + firstCall.stopReason);
if (firstCall.stopReason === "toolUse") {
    for (const block of firstCall.content) {
        if (block.type !== "toolCall") continue;
        console.log(`-> ${block.name}(${JSON.stringify(block.arguments)})`);
        let isError = false;
        let content = ""
        try {
            content = await readTool.execute(block.arguments);
        }
        catch(error) {
            content = `Failed to read file. Error: ${(error as unknown as any).message}`
            isError = true
        }
        messages.push({ role: "toolResult", toolCallId: block.id, toolName: block.name, content, isError })
    }
    messages.push(await callModel())
}
