import type { Tool } from "../types";
import { BashTool } from "./bash";
import { ReadTool } from "./read";
import { WriteTool } from "./write";

export const tools: Tool[] = [ReadTool]
