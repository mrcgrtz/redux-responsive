import type {Reducer} from 'redux';
import {isCalculateResponsiveStateAction} from './actions.ts';
import type {
	BreakpointResults,
	Breakpoints,
	DefaultBreakpoints,
	MediaType,
	ResolvedBreakpoints,
	ResponsiveReducerOptions,
	ResponsiveState,
	WithExtraFields,
} from './types.ts';

export const defaultBreakpoints: Readonly<DefaultBreakpoints> = Object.freeze({
	extraSmall: 480,
	small: 768,
	medium: 992,
	large: 1200,
});

const mapValues = <T, R>(object: Record<string, T>, f: (value: T, key: string) => R) =>
	Object.fromEntries(Object.entries(object).map(([key, value]) => [key, f(value, key)]));

/**
 * Computes the position of every media type such that large > medium > small.
 * Custom (string) media queries are ordered after all numeric breakpoints.
 */
export function getOrderMap(breakpoints: Breakpoints): Record<string, number> {
	const keys = Object.keys(breakpoints).sort((a, b) => {
		const valueA = breakpoints[a];
		const valueB = breakpoints[b];

		if (typeof valueA === 'number' && typeof valueB === 'string') {
			return -1;
		}

		if (typeof valueA === 'string' && typeof valueB === 'number') {
			return 1;
		}

		return valueA >= valueB ? 1 : -1;
	});

	return Object.fromEntries(keys.map((key, index) => [key, index]));
}

/** Whether the current media type is smaller than each numeric breakpoint. */
export function getLessThan(
	currentMediaType: string,
	breakpoints: Breakpoints,
	order: Record<string, number>,
): Record<string, boolean> {
	return mapValues(
		breakpoints,
		(breakpoint, mediaType) =>
			typeof breakpoint === 'number' && order[currentMediaType] < order[mediaType],
	);
}

/** Whether the current media type is larger than each numeric breakpoint. */
export function getGreaterThan(
	currentMediaType: string,
	breakpoints: Breakpoints,
	order: Record<string, number>,
): Record<string, boolean> {
	return mapValues(
		breakpoints,
		(breakpoint, mediaType) =>
			typeof breakpoint === 'number' && order[currentMediaType] > order[mediaType],
	);
}

/** Whether the current media type equals each media type. */
export function getIs(currentMediaType: string, breakpoints: Breakpoints): Record<string, boolean> {
	return mapValues(breakpoints, (_, mediaType) => mediaType === currentMediaType);
}

/**
 * Creates a reducer that holds the responsive state for the given breakpoints.
 * Passing `null` or `undefined` uses the default breakpoints.
 */
export function createResponsiveStateReducer<
	const InfinityName extends string = 'infinity',
	ExtraFields extends object = Record<never, never>,
>(
	breakpoints?: null,
	options?: ResponsiveReducerOptions<DefaultBreakpoints, InfinityName, ExtraFields>,
): Reducer<WithExtraFields<ResponsiveState<DefaultBreakpoints, InfinityName>, ExtraFields>>;
export function createResponsiveStateReducer<
	const BreakpointMap extends Breakpoints,
	const InfinityName extends string = 'infinity',
	ExtraFields extends object = Record<never, never>,
>(
	breakpoints: BreakpointMap,
	options?: ResponsiveReducerOptions<BreakpointMap, InfinityName, ExtraFields>,
): Reducer<WithExtraFields<ResponsiveState<BreakpointMap, InfinityName>, ExtraFields>>;
export function createResponsiveStateReducer<
	const BreakpointMap extends Breakpoints,
	const InfinityName extends string,
	ExtraFields extends object,
>(
	breakpoints?: BreakpointMap | null,
	options: ResponsiveReducerOptions<BreakpointMap, InfinityName, ExtraFields> = {},
): Reducer<ResponsiveState<BreakpointMap, InfinityName> & ExtraFields> {
	const {initialMediaType, infinity = 'infinity' as InfinityName, extraFields} = options;
	const resolved = Object.freeze({
		...(breakpoints ?? defaultBreakpoints),
		[infinity]: Infinity,
	}) as ResolvedBreakpoints<BreakpointMap, InfinityName>;
	const order = getOrderMap(resolved);

	const compute = (
		mediaType: MediaType<BreakpointMap, InfinityName>,
		orientation: ResponsiveState['orientation'],
	) => {
		const state: ResponsiveState<BreakpointMap, InfinityName> = {
			_responsiveState: true,
			mediaType,
			orientation,
			lessThan: getLessThan(mediaType, resolved, order) as BreakpointResults<BreakpointMap, InfinityName>,
			greaterThan: getGreaterThan(mediaType, resolved, order) as BreakpointResults<BreakpointMap, InfinityName>,
			is: getIs(mediaType, resolved) as BreakpointResults<BreakpointMap, InfinityName>,
			breakpoints: resolved,
		};
		const extra = extraFields?.(state);
		return (extra ? {...state, ...extra} : state) as ResponsiveState<BreakpointMap, InfinityName> & ExtraFields;
	};

	return (state, action) => {
		if (isCalculateResponsiveStateAction(action) && action.payload) {
			const {mediaType, orientation} = action.payload;
			return compute(mediaType as MediaType<BreakpointMap, InfinityName>, orientation);
		}

		return state ?? compute(initialMediaType ?? infinity, null);
	};
}
