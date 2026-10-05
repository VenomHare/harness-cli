#!/usr/bin/env bun

import { fileURLToPath } from 'bun';
import { config } from 'dotenv'
import { parseArgs } from 'node:util'
import { getProvider } from './providers/main';
import type { AssistantMessage, Message } from './types';
import { ReadTool } from './tools/read';
import { tools } from './tools';
import { runAgent } from './agent/main';

config({
    path: fileURLToPath(new URL("../.env", import.meta.url)),
    quiet: true,
});

const { values } = parseArgs({
    options: {
        "prompt": { type: "string", short: "p" },
        "model": { type: "string", short: "m" },
        "provider": { type: "string", default: "openrouter" }
    },
})
console.log(values);
if (!values.prompt) {
    console.error("Prompt toh dal");
    process.exit(1);
}

const provider = getProvider(values.provider);
const messages: Message[] = [{ role: "user", content: values.prompt }]

await runAgent({
    messages,
    provider,
    model: values.model,
    tools,
    async onEvent(e) {
        if (e.type === "text") process.stdout.write(e.delta);
        else if (e.type === "tool_start") console.log(`\n ${e.toolCall.name}`);
        else if (e.type === "tool_end") {
            const lines = e.result.split("\n").length;
            console.log(`\n ${e.isError ? e.result : lines}`)
        }
        else if (e.type === "turn_end") {
            console.log(`\n\n Provider: ${provider.name} | ${values.model ?? provider.defaultModel} Input Tokens: ${e.message.usage.input} | Output Tokens: ${e.message.usage.output}`);
        }
    }
})





// async function callModel(): Promise<AssistantMessage> {
//     try {
//         const stream = await provider.stream({
//             model: values.model,
//             messages,
//             tools
//         })
//         for await (const chunk of stream) {
//             if (chunk.type == "text_delta") {
//                 process.stdout.write(chunk.delta);
//             }

//             if (chunk.type == "done") {
//                 console.log(`\n\n Provider: ${provider.name} | ${values.model ?? provider.defaultModel} Input Tokens: ${chunk.message.usage.input} | Output Tokens: ${chunk.message.usage.output}`);
//                 return chunk.message;
//             }
//         }
//         throw new Error("Stream Ended without a done chunk");
//     }
//     catch (err) {
//         console.error((err as unknown as any).message)
//         process.exit(1);
//     }
// }

// const firstCall = await callModel();
// messages.push(firstCall);
// console.log("### firstCall Stop Reason: " + firstCall.stopReason);
// if (firstCall.stopReason === "toolUse") {
//     for (const block of firstCall.content) {
//         if (block.type !== "toolCall") continue;
//         console.log(`-> ${block.name}(${JSON.stringify(block.arguments)})`);
//         let isError = false;
//         let content = ""
//         try {
//             content = await ReadTool.execute(block.arguments);
//         }
//         catch (error) {
//             content = `Failed to read file. Error: ${(error as unknown as any).message}`
//             isError = true
//         }
//         messages.push({ role: "toolResult", toolCallId: block.id, toolName: block.name, content, isError })
//     }
//     const secondCall = await callModel();
//     messages.push(secondCall);
//     if (secondCall.stopReason === "toolUse") {
//         for (const block of secondCall.content) {
//             if (block.type !== "toolCall") continue;
//             console.log(`-> ${block.name}(${JSON.stringify(block.arguments)})`);
//             let isError = false;
//             let content = ""
//             try {
//                 content = await ReadTool.execute(block.arguments);
//             }
//             catch (error) {
//                 content = `Failed to read file. Error: ${(error as unknown as any).message}`
//                 isError = true
//             }
//             messages.push({ role: "toolResult", toolCallId: block.id, toolName: block.name, content, isError })
//         }
//         messages.push(await callModel())
//     }
// }
