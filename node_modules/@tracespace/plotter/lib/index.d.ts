import type { GerberTree } from '@tracespace/parser';
import type { ImageTree } from './tree';
export * from './tree';
export * as BoundingBox from './bounding-box';
export { TWO_PI, positionsEqual } from './coordinate-math';
export declare function plot(tree: GerberTree): ImageTree;
