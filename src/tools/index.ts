import type { Tool } from "../types";
import { BashTool } from "./bash";
import { editTool } from "./edit";
import { GrepTool } from "./grep";
import { lsTool } from "./ls";
import { ReadTool } from "./read";
import { WriteTool } from "./write";

export const tools: Tool[] = [ReadTool, WriteTool, BashTool, GrepTool, lsTool, editTool]
