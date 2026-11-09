import type { SimpleShape } from '@tracespace/parser';
import * as Tree from '../tree';
import type { Point } from '../location-store';
export declare function createShape(shape: SimpleShape, point: Point): Tree.SimpleShape;
export declare function shapeToSegments(shape: Tree.SimpleShape): Tree.PathSegment[];
