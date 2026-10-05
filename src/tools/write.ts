import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Tool } from "../types";
import { writeFile } from 'node:fs/promises';

export const WriteTool: Tool = {
    name: "WriteFile",
    id: "writefile",
    description: "Creates a file and writes the content in that file",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Path to the file, relative to current directory"
            },
            new_string: {
                type: "string",
                description: "Content to write or replace in file"
            }
        },
        required: ["path", "new_string"]
    },
    async execute(args) {
        try {

            await writeFile(resolve(process.cwd(), String(args.path)), String(args.new_string), "utf8");
            return "Created File " + args.path
        }
        catch(err) {
            console.error(err);
            process.exit(1);
        }
    }
}