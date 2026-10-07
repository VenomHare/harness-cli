import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Tool } from "../types";

export const WriteTool: Tool = {
    name: "WriteTool",
    id: "writetool",
    description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file, relative to current folder"
            },
            content: {
                type: "string",
                description: "Content to write to the file"
            },
        },
        required: ["path", "content"],
    },
    getDisplayString(result) {
        const lines = result.split("\n");
        if (lines.length > 3) {
            return lines.slice(0, 4).join("\n") + "\n....";
        }
        return result;
    },
    async execute(args) {
        await writeFile(resolve(process.cwd(), String(args.path)), String(args.content), "utf8");
        return `wrote ${String(args.path)}`;
    }
}
