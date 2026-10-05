import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool } from "../types";

export const BashTool: Tool = {
    name: "Bash",
    id: "bashtool",
    description: "Runs bash command in Current working directory",
    parameters: {
        type: "object",
        properties: {
            cmd: {
                type: "string",
                description: "The full command to be executed. It should be compatible with node exec Function"
            },
        },
        required: ["cmd"]
    },
    async execute(args) {
        const exec = promisify(execCallback);
        const { stdout, stderr } = await exec(String(args.cmd));
        if (stderr) {
            throw stderr
        }
        return stdout;
    }
}