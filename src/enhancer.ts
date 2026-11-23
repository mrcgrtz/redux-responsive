import type {StoreEnhancer, UnknownAction} from 'redux';
import {calculateResponsiveState, isCalculateResponsiveStateAction, type CalculateResponsiveStatePayload} from './actions.ts';
import {getBreakpoints} from './get-breakpoints.ts';
import {orientationQueries, toMediaQueries} from './media-queries.ts';
import type {Orientation, ResponsiveEnhancerOptions} from './types.ts';

const matchFirst = (matchMedia: Window['matchMedia'], queries: Record<string, string>) =>
	Object.keys(queries).findLast(key => matchMedia(queries[key]).matches);

/**
 * Creates a store enhancer that keeps the responsive state in sync with the window. It only
 * dispatches when the window crosses a breakpoint or changes orientation.
 */
export function createResponsiveStoreEnhancer({
	calculateInitialState = true,
	window: explicitTarget,
}: ResponsiveEnhancerOptions = {}): StoreEnhancer {
	return createStore => (reducer, preloadedState) => {
		const store = createStore(reducer, preloadedState);
		const target = explicitTarget ?? globalThis.window;

		if (typeof target?.matchMedia !== 'function') {
			return store;
		}

		const matchMedia = target.matchMedia.bind(target);
		const breakpoints = getBreakpoints(store.getState());
		const mediaQueries = toMediaQueries(breakpoints);
		const infinity =
			Object.keys(breakpoints).find(key => breakpoints[key] === Infinity) ?? 'infinity';

		const measure = (): CalculateResponsiveStatePayload => ({
			mediaType: matchFirst(matchMedia, mediaQueries) ?? infinity,
			orientation: (matchFirst(matchMedia, orientationQueries) as Orientation) ?? null,
		});

		// The most recent measurement; a single resize can flip several queries at once
		let last: CalculateResponsiveStatePayload | undefined;

		// Fill in the measurement for calculation requests so the action stays serializable
		const baseDispatch = store.dispatch as (action: UnknownAction) => UnknownAction;
		const dispatch = ((action: UnknownAction) => {
			if (isCalculateResponsiveStateAction(action) && !action.payload) {
				last = measure();
				return baseDispatch({...action, payload: last});
			}

			return baseDispatch(action);
		}) as typeof store.dispatch;

		const recalculate = () => {
			const next = measure();
			if (last?.mediaType === next.mediaType && last.orientation === next.orientation) {
				return;
			}

			last = next;
			baseDispatch({...calculateResponsiveState(next)});
		};

		for (const query of [
			...Object.values(mediaQueries),
			...Object.values(orientationQueries),
		]) {
			matchMedia(query).addEventListener('change', event => {
				if (event.matches) {
					recalculate();
				}
			});
		}

		if (calculateInitialState) {
			recalculate();
		}

		return {...store, dispatch};
	};
}
