import type { LayerIdentityMap, ValidLayer, ValidatedLayer } from './types';
export * from './constants';
export * from './types';
export declare function identifyLayers(filenames: string | string[]): LayerIdentityMap;
export declare function getAllLayers(): ValidLayer[];
export declare function validate<T extends {
    side: string | null;
    type: string | null;
}>(target: T): ValidatedLayer;
