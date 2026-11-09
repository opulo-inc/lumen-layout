import type { GerberNode, Filetype } from '@tracespace/parser';
import * as Tree from '../tree';
import type { Tool } from '../tool-store';
import type { Location } from '../location-store';
export interface GraphicPlotter {
    plot(node: GerberNode, tool: Tool | undefined, location: Location): Tree.ImageGraphic[];
}
export declare function createGraphicPlotter(filetype: Filetype): GraphicPlotter;
