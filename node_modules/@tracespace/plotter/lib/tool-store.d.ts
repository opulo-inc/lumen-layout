import type { GerberNode, SimpleShape, HoleShape, MacroBlock } from '@tracespace/parser';
export declare const SIMPLE_TOOL = "simpleTool";
export declare const MACRO_TOOL = "macroTool";
export interface SimpleTool {
    type: typeof SIMPLE_TOOL;
    shape: SimpleShape;
    hole?: HoleShape;
}
export interface MacroTool {
    type: typeof MACRO_TOOL;
    macro: MacroBlock[];
    variableValues: number[];
}
export type Tool = SimpleTool | MacroTool;
export interface ToolStore {
    use(node: GerberNode): Tool | undefined;
}
export declare function createToolStore(): ToolStore;
