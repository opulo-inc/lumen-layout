import * as Tree from '../tree';
import type { Tool } from '../tool-store';
import type { Location, Point } from '../location-store';
export declare const CW = "cw";
export declare const CCW = "ccw";
export type ArcDirection = typeof CW | typeof CCW;
export declare function plotSegment(location: Location, arcDirection?: ArcDirection, ambiguousArcCenter?: boolean): Tree.PathSegment;
export declare function plotPath(segments: Tree.PathSegment[], tool: Tool | undefined, region?: boolean): Tree.ImageGraphic | undefined;
export declare function getArcPositions(startPoint: Point, endPoint: Point, centerPoint: Point, arcDirection: ArcDirection): [start: Tree.ArcPosition, end: Tree.ArcPosition, center: Tree.Position];
