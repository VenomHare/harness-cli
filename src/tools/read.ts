import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Tool } from "../types";


export const ReadTool: Tool = {
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