import type { Tool } from "../types";
import { BashTool } from "./bash";
import { GrepTool } from "./grep";
import { ReadTool } from "./read";

export const tools: Tool[] = [ReadTool, BashTool, GrepTool]
