import type { ImageGraphic, ImageShape, ImagePath, ImageRegion, Shape } from '@tracespace/plotter';
import type { SvgElement } from './types';
export declare function renderGraphic(node: ImageGraphic): SvgElement;
export declare function renderShape(node: ImageShape): SvgElement;
export declare function shapeToElement(shape: Shape): SvgElement;
export declare function renderPath(node: ImagePath | ImageRegion): SvgElement;
