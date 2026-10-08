import type { Tool } from "../types";
import { BashTool } from "./bash";
import { editTool } from "./edit";
import { findTool } from "./find";
import { GrepTool } from "./grep";
import { lsTool } from "./ls";
import { ReadTool } from "./read";
import { statTool } from "./stat";
import { WriteTool } from "./write";

export const tools: Tool[] = [
    ReadTool, 
    WriteTool, 
    BashTool, 
    lsTool, 
    editTool,
    statTool,
    findTool
]
// GrepTool, 
