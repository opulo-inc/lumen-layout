import type { GerberTree, UnitsType, Format, ZeroSuppression } from '@tracespace/parser';
export interface PlotOptions {
    units: UnitsType;
    coordinateFormat: Format;
    zeroSuppression: ZeroSuppression;
}
export declare function getPlotOptions(tree: GerberTree): PlotOptions;
