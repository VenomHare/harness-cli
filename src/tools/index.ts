import type { Tool } from "../types";
import { BashTool } from "./bash";
import { ReadTool } from "./read";

export const tools: Tool[] = [ReadTool, BashTool]
