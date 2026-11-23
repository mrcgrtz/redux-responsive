import {createResponsiveStoreEnhancer} from './enhancer.ts';
import {createResponsiveStateReducer} from './reducer.ts';

export {CALCULATE_RESPONSIVE_STATE, calculateResponsiveState} from './actions.ts';
export type {CalculateResponsiveStateAction, CalculateResponsiveStatePayload} from './actions.ts';
export {createResponsiveStoreEnhancer} from './enhancer.ts';
export {createResponsiveStateReducer, defaultBreakpoints} from './reducer.ts';
export type * from './types.ts';

/** A responsive state reducer using the default breakpoints. */
export const responsiveStateReducer = createResponsiveStateReducer();
/** A store enhancer using the default options. */
export const responsiveStoreEnhancer = createResponsiveStoreEnhancer();
