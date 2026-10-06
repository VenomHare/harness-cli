#!/usr/bin/env bun

import { fileURLToPath } from 'bun';
import { config } from 'dotenv'
import { parseArgs } from 'node:util'
import { getProvider } from './providers/main';
import type { AssistantMessage, Message } from './types';
import { ReadTool } from './tools/read';
import { tools } from './tools';
import { runAgent } from './agent/main';
import { render } from 'ink';
import { App } from './tui/app';

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

// if (!values.prompt) {
//     console.error("Prompt toh dal");
//     process.exit(1);
// }

// const provider = getProvider(values.provider);
// const messages: Message[] = [{ role: "user", content: values.prompt }]

// await runAgent({
//     messages,
//     provider,
//     model: values.model,
//     tools,
//     async onEvent(e) {
//         if (e.type === "text") process.stdout.write(e.delta);
//         else if (e.type === "tool_start") console.log(`\n ${e.toolCall.name} ${JSON.stringify(e.toolCall.arguments)}`);
//         else if (e.type === "tool_end") {
//             const lines = e.result.split("\n").length;
//             console.log(`\n ${e.isError ? e.result : lines}`)
//         }
//         else if (e.type === "turn_end") {
//             console.log(`\n\n Provider: ${provider.name} | ${values.model ?? provider.defaultModel} Input Tokens: ${e.message.usage.input} | Output Tokens: ${e.message.usage.output}`);
//         }
//     }
// })

render(<App defaultPrompt={values.prompt} provider={getProvider(values.provider)} model={values.model} />)