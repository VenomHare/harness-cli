import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Tool } from "../types";

const MAX_MATCHES = 500;

interface GrepEntry {
    name: string;
    path: string;
    isDirectory: boolean;
}

async function listEntries(dir: string): Promise<GrepEntry[]> {
    const names = await readdir(dir);
    const entries: GrepEntry[] = [];
    for (const name of names) {
        const path = join(dir, name);
        try {
            const s = await stat(path);
            entries.push({ name, path, isDirectory: s.isDirectory() });
        } catch {
            // skip broken symlinks / unreadable entries
        }
    }
    return entries;
}

// Recursively collect regular files under `dir` (skipping .git and node_modules).
async function collectFiles(dir: string, files: string[]): Promise<void> {
    let entries: GrepEntry[];
    try {
        entries = await listEntries(dir);
    } catch {
        return; // unreadable directory: skip it
    }
    for (const { name, path, isDirectory } of entries) {
        if (name === '.git' || name === 'node_modules') continue;
        if (isDirectory) {
            await collectFiles(path, files);
        } else {
            files.push(path);
        }
    }
}

async function grepInFile(file: string, pattern: RegExp, results: string[]): Promise<void> {
    let content: string;
    try {
        content = await readFile(file, 'utf8');
    } catch {
        return; // skip unreadable/binary files
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i] ?? "")) {
            results.push(`${file}:${i + 1}:${lines[i]}`);
            if (results.length >= MAX_MATCHES) return;
        }
        if (results.length >= MAX_MATCHES) return;
    }
}

export const GrepTool: Tool = {
    name: "GrepTool",
    id: "greptool",
    description: "Search for a regex pattern inside files under a directory (recursively). Returns matching file:line:text, like grep -rn.",
    parameters: {
        type: "object",
        properties: {
            pattern: {
                type: "string",
                description: "Regular expression pattern to search for"
            },
            path: {
                type: "string",
                description: "Directory to search in, relative to current folder (default: current folder)"
            },
        },
        required: ["pattern"],
    },
    async execute(args) {
        const patternStr = String(args.pattern);
        let pattern: RegExp;
        try {
            pattern = new RegExp(patternStr);
        } catch (e) {
            return `invalid regex pattern: ${(e as Error).message}`;
        }
        // reset the flag so sticky/global state does not interfere with .test()
        pattern.lastIndex = 0;

        const dir = resolve(process.cwd(), args.path ? String(args.path) : '.');

        let isDir: boolean;
        try {
            isDir = (await stat(dir)).isDirectory();
        } catch {
            return `directory not found: ${dir}`;
        }
        if (!isDir) {
            return `not a directory: ${dir}`;
        }

        const files: string[] = [];
        await collectFiles(dir, files);

        const results: string[] = [];
        for (const file of files) {
            await grepInFile(file, pattern, results);
            if (results.length >= MAX_MATCHES) break;
        }

        if (results.length === 0) return 'no matches found';
        if (results.length >= MAX_MATCHES) {
            return results.join('\n') + `\n[truncated: showing first ${MAX_MATCHES} matches]`;
        }
        return results.join('\n');
    }
}
