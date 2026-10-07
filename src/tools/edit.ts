import {
    readFile,
    writeFile,
    rename,
    unlink,
    chmod,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Tool } from "../types.ts";

type EditOperation = {
    /**
     * Exact text that must exist in the file.
     */
    old: string;

    /**
     * Replacement text.
     */
    new: string;

    /**
     * Replace every occurrence instead of requiring exactly one.
     * Defaults to false.
     */
    replace_all?: boolean;
};

type EditArgs = {
    /**
     * Path relative to the current working directory.
     */
    path: string;

    /**
     * Exact text replacements.
     *
     * Each operation is applied sequentially.
     */
    edits?: EditOperation[];

    /**
     * Unified diff to apply instead of `edits`.
     *
     * The patch should use standard unified-diff syntax:
     *
     * --- a/file.ts
     * +++ b/file.ts
     * @@ -1,3 +1,4 @@
     *  existing
     * +added
     *  existing
     */
    patch?: string;

    /**
     * Don't actually write the file.
     *
     * Returns the resulting diff and summary.
     */
    dry_run?: boolean;

    /**
     * SHA-256 hash of the file contents the caller expects.
     *
     * If the file changed since the AI last read it, the edit fails
     * instead of silently modifying a newer version.
     */
    expected_hash?: string;

    /**
     * Allow creating a file when it doesn't exist.
     */
    create_if_missing?: boolean;

    /**
     * Optional explicit file contents for creating a missing file.
     *
     * This is intentionally separate from `edits`, because there is
     * nothing to match in a missing file.
     */
    initial_content?: string;
};

type DiffLine = {
    type: "context" | "add" | "remove";
    text: string;
};

function hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}

function splitLines(text: string): {
    lines: string[];
    trailingNewline: boolean;
} {
    const trailingNewline = text.endsWith("\n");

    // Normalize only for diff/edit processing.
    const normalized = text.replace(/\r\n/g, "\n");

    let lines = normalized.split("\n");

    if (trailingNewline && lines.at(-1) === "") {
        lines.pop();
    }

    return {
        lines,
        trailingNewline,
    };
}

function joinLines(lines: string[], trailingNewline: boolean): string {
    const result = lines.join("\n");
    return trailingNewline ? `${result}\n` : result;
}

function countOccurrences(text: string, search: string): number {
    if (search === "") return 0;

    let count = 0;
    let index = 0;

    while (true) {
        const found = text.indexOf(search, index);

        if (found === -1) {
            break;
        }

        count++;
        index = found + search.length;
    }

    return count;
}

function applyTextEdits(
    original: string,
    edits: EditOperation[],
): string {
    let result = original;

    for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];

        if (!edit || typeof edit.old !== "string" || typeof edit.new !== "string") {
            throw new Error(
                `Invalid edit #${i + 1}: "old" and "new" must both be strings`,
            );
        }

        if (edit.old.length === 0) {
            throw new Error(
                `Invalid edit #${i + 1}: "old" cannot be empty`,
            );
        }

        const occurrences = countOccurrences(result, edit.old);

        if (occurrences === 0) {
            throw new Error(
                `Edit #${i + 1} failed: the specified text was not found in the file.\n\n` +
                `Looking for:\n${edit.old}`,
            );
        }

        if (!edit.replace_all && occurrences !== 1) {
            throw new Error(
                `Edit #${i + 1} is ambiguous: found ${occurrences} occurrences.\n\n` +
                `Use a more specific "old" string or set "replace_all": true.\n\n` +
                `Looking for:\n${edit.old}`,
            );
        }

        if (edit.replace_all) {
            result = result.split(edit.old).join(edit.new);
        } else {
            const index = result.indexOf(edit.old);

            result =
                result.slice(0, index) +
                edit.new +
                result.slice(index + edit.old.length);
        }
    }

    return result;
}

/**
 * Small Myers-style line diff implementation.
 *
 * Produces a useful unified diff without requiring an external dependency.
 */
function diffLines(
    before: string,
    after: string,
): DiffLine[] {
    const a = splitLines(before).lines;
    const b = splitLines(after).lines;

    const n = a.length;
    const m = b.length;

    // For very large files, avoid allocating an enormous DP matrix.
    // A coarse diff is preferable to crashing the agent.
    const maxCells = 2_000_000;

    if (n * m > maxCells) {
        return [
            ...a.map((line) => ({
                type: "remove" as const,
                text: line,
            })),
            ...b.map((line) => ({
                type: "add" as const,
                text: line,
            })),
        ];
    }

    const dp: number[][] = Array.from(
        { length: n + 1 },
        () => new Array<number>(m + 1).fill(0),
    );

    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            if (a[i] === b[j]) {
                dp[i]![j] = dp[i + 1]![j + 1]! + 1;
            } else {
                dp[i]![j] = Math.max(
                    dp[i + 1]![j]!,
                    dp[i]![j + 1]!,
                );
            }
        }
    }

    const result: DiffLine[] = [];

    let i = 0;
    let j = 0;

    while (i < n && j < m) {
        if (a[i] === b[j]) {
            result.push({
                type: "context",
                text: a[i]!,
            });

            i++;
            j++;
            continue;
        }

        if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
            result.push({
                type: "remove",
                text: a[i]!,
            });

            i++;
        } else {
            result.push({
                type: "add",
                text: b[j]!,
            });

            j++;
        }
    }

    while (i < n) {
        result.push({
            type: "remove",
            text: a[i++]!,
        });
    }

    while (j < m) {
        result.push({
            type: "add",
            text: b[j++]!,
        });
    }

    return result;
}

function renderUnifiedDiff(
    path: string,
    before: string,
    after: string,
): string {
    const diff = diffLines(before, after);

    if (diff.length === 0) {
        return "";
    }

    const beforeLines = splitLines(before).lines;
    const afterLines = splitLines(after).lines;

    const output: string[] = [
        `--- a/${path}`,
        `+++ b/${path}`,
        `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ];

    for (const line of diff) {
        if (line.type === "context") {
            output.push(` ${line.text}`);
        } else if (line.type === "add") {
            output.push(`+${line.text}`);
        } else {
            output.push(`-${line.text}`);
        }
    }

    return output.join("\n");
}

/**
 * Apply a unified diff.
 *
 * This implementation intentionally supports the common single-file
 * unified diff format generated by coding agents.
 */
function applyUnifiedPatch(
    original: string,
    patch: string,
): string {
    const patchLines = patch
        .replace(/\r\n/g, "\n")
        .split("\n");

    // Ignore the --- / +++ headers.
    let index = 0;

    while (
        index < patchLines.length &&
        (
            patchLines[index]!.startsWith("--- ") ||
            patchLines[index]!.startsWith("+++ ")
        )
    ) {
        index++;
    }

    const hunks: {
        oldStart: number;
        oldCount: number;
        newStart: number;
        newCount: number;
        lines: string[];
    }[] = [];

    const hunkRegex =
        /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

    while (index < patchLines.length) {
        const line = patchLines[index];

        if (!line) {
            index++;
            continue;
        }

        const match = line.match(hunkRegex);

        if (!match) {
            throw new Error(
                `Invalid unified diff: expected a hunk header, got:\n${line}`,
            );
        }

        const oldStart = Number(match[1]);
        const oldCount = match[2] === undefined ? 1 : Number(match[2]);
        const newStart = Number(match[3]);
        const newCount = match[4] === undefined ? 1 : Number(match[4]);

        index++;

        const hunkLines: string[] = [];

        let oldSeen = 0;
        let newSeen = 0;

        while (
            index < patchLines.length &&
            !patchLines[index]!.startsWith("@@ ")
        ) {
            const hunkLine = patchLines[index]!;

            // Git/unified diff metadata.
            if (
                hunkLine.startsWith("\\ No newline at end of file")
            ) {
                index++;
                continue;
            }

            if (
                !hunkLine.startsWith(" ") &&
                !hunkLine.startsWith("+") &&
                !hunkLine.startsWith("-")
            ) {
                break;
            }

            hunkLines.push(hunkLine);

            if (hunkLine.startsWith(" ") || hunkLine.startsWith("-")) {
                oldSeen++;
            }

            if (hunkLine.startsWith(" ") || hunkLine.startsWith("+")) {
                newSeen++;
            }

            index++;
        }

        if (oldSeen !== oldCount || newSeen !== newCount) {
            throw new Error(
                `Invalid unified diff hunk: expected ` +
                `${oldCount}/${newCount} lines but found ` +
                `${oldSeen}/${newSeen}`,
            );
        }

        hunks.push({
            oldStart,
            oldCount,
            newStart,
            newCount,
            lines: hunkLines,
        });
    }

    const source = splitLines(original);
    const input = source.lines;

    const output: string[] = [];

    let sourceIndex = 0;

    for (const hunk of hunks) {
        const hunkStart = hunk.oldStart - 1;

        if (hunkStart < sourceIndex || hunkStart > input.length) {
            throw new Error(
                `Patch hunk starts outside the current file at line ${hunk.oldStart}`,
            );
        }

        // Copy unchanged lines before this hunk.
        while (sourceIndex < hunkStart) {
            output.push(input[sourceIndex++]!);
        }

        for (const line of hunk.lines) {
            const marker = line[0];
            const content = line.slice(1);

            if (marker === " ") {
                if (input[sourceIndex] !== content) {
                    throw new Error(
                        `Patch context mismatch at line ${sourceIndex + 1}.\n` +
                        `Expected:\n${content}\n` +
                        `Found:\n${input[sourceIndex] ?? "<EOF>"}`,
                    );
                }

                output.push(input[sourceIndex]!);
                sourceIndex++;
            } else if (marker === "-") {
                if (input[sourceIndex] !== content) {
                    throw new Error(
                        `Patch removal mismatch at line ${sourceIndex + 1}.\n` +
                        `Expected:\n${content}\n` +
                        `Found:\n${input[sourceIndex] ?? "<EOF>"}`,
                    );
                }

                sourceIndex++;
            } else if (marker === "+") {
                output.push(content);
            }
        }
    }

    // Copy remaining source.
    while (sourceIndex < input.length) {
        output.push(input[sourceIndex++]!);
    }

    return joinLines(
        output,
        source.trailingNewline,
    );
}

async function atomicWrite(
    path: string,
    content: string,
    mode: number,
): Promise<void> {
    const directory = dirname(path);
    const tempPath = resolve(
        directory,
        `.ai-edit-${randomUUID()}.tmp`,
    );

    try {
        await writeFile(tempPath, content, "utf8");
        await chmod(tempPath, mode & 0o7777);
        await rename(tempPath, path);
    } catch (error) {
        try {
            await unlink(tempPath);
        } catch {
            // Ignore cleanup failure.
        }

        throw error;
    }
}

function summarizeDiff(diff: string): {
    added: number;
    removed: number;
} {
    if (!diff) {
        return {
            added: 0,
            removed: 0,
        };
    }

    let added = 0;
    let removed = 0;

    for (const line of diff.split("\n")) {
        if (line.startsWith("+++") || line.startsWith("---")) {
            continue;
        }

        if (line.startsWith("+")) {
            added++;
        } else if (line.startsWith("-")) {
            removed++;
        }
    }

    return { added, removed };
}

export const editTool: Tool = {
    id: "edit",
    name: "Edit",
    description:
        "Safely edit a file using exact text replacements or a unified diff. " +
        "Returns the resulting diff. Refuses ambiguous replacements and can " +
        "verify an expected SHA-256 hash to prevent editing stale files. " +
        "Supports dry-run and atomic writes.",

    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description:
                    "Path to the file, relative to the current working directory",
            },

            edits: {
                type: "array",
                description:
                    "One or more exact old/new text replacements. " +
                    "By default each old string must occur exactly once.",
                items: {
                    type: "object",
                    properties: {
                        old: {
                            type: "string",
                            description:
                                "Exact text to find in the file",
                        },
                        new: {
                            type: "string",
                            description:
                                "Replacement text",
                        },
                        replace_all: {
                            type: "boolean",
                            description:
                                "Replace every occurrence. Defaults to false.",
                        },
                    },
                    required: ["old", "new"],
                },
            },

            patch: {
                type: "string",
                description:
                    "Unified diff to apply. Use this for larger or line-oriented edits.",
            },

            dry_run: {
                type: "boolean",
                description:
                    "Calculate and return the diff without writing the file.",
            },

            expected_hash: {
                type: "string",
                description:
                    "Expected SHA-256 hash of the current file contents. " +
                    "Fails if the file changed since it was read.",
            },

            create_if_missing: {
                type: "boolean",
                description:
                    "Allow creating a missing file.",
            },

            initial_content: {
                type: "string",
                description:
                    "Contents for a newly created file. Requires create_if_missing.",
            },
        },
        required: ["path"],
    },

    async execute(args) {
        const path = resolve(
            process.cwd(),
            String(args.path),
        );

        const hasEdits =
            Array.isArray(args.edits) &&
            args.edits.length > 0;

        const hasPatch =
            typeof args.patch === "string" &&
            args.patch.length > 0;

        if (hasEdits && hasPatch) {
            throw new Error(
                'Provide either "edits" or "patch", not both.',
            );
        }

        let original = "";
        let exists = true;
        let mode = 0o644;

        try {
            const file = await readFile(path, "utf8");
            original = file;

            // Preserve existing permissions.
            try {
                const { stat } = await import("node:fs/promises");
                const s = await stat(path);
                mode = s.mode;
            } catch {
                // Keep default mode.
            }
        } catch (error: any) {
            if (error?.code !== "ENOENT") {
                throw error;
            }

            exists = false;
        }

        if (!exists) {
            if (!args.create_if_missing) {
                throw new Error(
                    `File does not exist: ${path}\n` +
                    `Set "create_if_missing": true to create it.`,
                );
            }

            if (args.expected_hash) {
                throw new Error(
                    "Cannot use expected_hash when creating a new file.",
                );
            }

            if (
                typeof args.initial_content !== "string"
            ) {
                throw new Error(
                    "A missing file requires " +
                    '"initial_content" when create_if_missing is true.',
                );
            }

            original = "";
        }

        // Protect against editing a stale version of the file.
        if (args.expected_hash) {
            const actualHash = hashContent(original);

            if (actualHash !== String(args.expected_hash)) {
                throw new Error(
                    `File changed since it was read.\n` +
                    `Expected SHA-256: ${args.expected_hash}\n` +
                    `Actual SHA-256:   ${actualHash}\n\n` +
                    `Read the file again before editing it.`,
                );
            }
        }

        let updated: string;

        if (!exists) {
            updated = String(args.initial_content);
        } else if (hasEdits) {
            updated = applyTextEdits(
                original,
                args.edits as EditOperation[],
            );
        } else if (hasPatch) {
            updated = applyUnifiedPatch(
                original,
                String(args.patch),
            );
        } else {
            throw new Error(
                'Nothing to edit. Provide "edits" or "patch".',
            );
        }

        if (updated === original) {
            return [
                `path: ${path}`,
                `changed: false`,
                `message: no changes`,
                `hash: ${hashContent(original)}`,
            ].join("\n");
        }

        const diff = renderUnifiedDiff(
            path,
            original,
            updated,
        );

        const summary = summarizeDiff(diff);

        if (!args.dry_run) {
            await atomicWrite(
                path,
                updated,
                mode,
            );
        }

        return [
            `path: ${path}`,
            `changed: true`,
            `written: ${args.dry_run ? "false (dry-run)" : "true"}`,
            `added: ${summary.added} lines`,
            `removed: ${summary.removed} lines`,
            `old_hash: ${hashContent(original)}`,
            `new_hash: ${hashContent(updated)}`,
            "",
            "diff:",
            diff,
        ].join("\n");
    },

    getDisplayString(result) {
        // The full result is useful to the model, but don't flood the UI
        // with enormous diffs.
        const lines = result.split("\n");

        const maxLines = 80;

        if (lines.length <= maxLines) {
            return result;
        }

        return (
            lines.slice(0, maxLines).join("\n") +
            `\n... (${lines.length - maxLines} more lines)`
        );
    },
};
