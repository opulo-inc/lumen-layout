import type { GerberNode } from '@tracespace/parser';
import type { PlotOptions } from './options';
export interface Point {
    x: number;
    y: number;
}
export interface ArcOffsets {
    i: number;
    j: number;
    a: number;
}
export interface Location {
    startPoint: Point;
    endPoint: Point;
    arcOffsets: ArcOffsets;
}
export interface LocationStore {
    use(node: GerberNode, options: PlotOptions): Location;
}
export declare function createLocationStore(): LocationStore;
