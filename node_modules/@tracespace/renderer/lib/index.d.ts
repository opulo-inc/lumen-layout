import type { ImageTree, SizeEnvelope } from '@tracespace/plotter';
import type { SvgElement, ViewBox } from './types';
export { renderGraphic } from './render';
export type { SvgElement, ViewBox } from './types';
export declare const BASE_SVG_PROPS: {
    version: string;
    xmlns: string;
    'xmlns:xlink': string;
};
export declare const BASE_IMAGE_PROPS: {
    'stroke-linecap': string;
    'stroke-linejoin': string;
    'stroke-width': string;
    'fill-rule': string;
    'clip-rule': string;
    fill: string;
    stroke: string;
};
export declare function render(image: ImageTree, viewBox?: ViewBox): SvgElement;
export declare function renderFragment(image: ImageTree): SvgElement;
export declare function sizeToViewBox(size: SizeEnvelope): ViewBox;
