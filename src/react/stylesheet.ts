import type {CSSProperties} from 'react';
import type {ResponsiveState} from '../types.ts';

export type Comparison = 'lessThan' | 'greaterThan' | 'equal';

/** A style with optional responsive overrides, e.g. `{ color: 'red', _lessThan_medium: { color: 'blue' } }`. */
// `& object` rejects primitives, which TypeScript would otherwise accept for an all-optional type
export type ResponsiveStyle = CSSProperties & Record<`_${Comparison}_${string}`, CSSProperties & object>;

export type ResponsiveStyleSheet<K extends string = string> = Record<K, ResponsiveStyle>;

export type ComputedStyles<S extends ResponsiveStyleSheet> = {[K in keyof S]: CSSProperties};

// The subset of the responsive state the stylesheet logic depends on
export type StyleSheetState = Pick<
	ResponsiveState<Record<string, number | string>, string>,
    'lessThan' | 'greaterThan' | 'mediaType' | 'breakpoints'
>;

const isResponsiveKey = (key: string) => key.startsWith('_');

/** Splits a pattern like `_lessThan_medium` into its comparison and media type. */
export function parsePattern(pattern: string): {comparison: string; size: string} {
	const [, comparison = '', size = ''] = pattern.split('_', 3);
	return {comparison, size};
}

/** Whether the responsive state matches a pattern like `_lessThan_medium`. */
export function isBrowserMatching(browser: StyleSheetState, pattern: string): boolean {
	const {comparison, size} = parsePattern(pattern);

	if (comparison === 'equal') {
		return browser.mediaType === size;
	}

	return (comparison === 'lessThan' || comparison === 'greaterThan')
		&& (browser[comparison]?.[size] ?? false);
}

/**
 * Orders style keys so that overrides apply in the correct order: plain styles first, then
 * `lessThan` (largest to smallest), `greaterThan` (smallest to largest) and finally `equal`.
 */
export function sortKeys(keys: readonly string[], breakpoints: readonly string[]): string[] {
	const n = breakpoints.length;

	const rank = (key: string) => {
		if (!isResponsiveKey(key)) {
			return 0;
		}

		const {comparison, size} = parsePattern(key);
		const position = breakpoints.indexOf(size) + n;

		if (comparison === 'equal') {
			return 3 * n;
		}

		return comparison === 'lessThan' ? (2 * n) - position : position;
	};

	return keys
		.map(key => ({key, rank: rank(key)}))
		.sort((a, b) => a.rank - b.rank)
		.map(({key}) => key);
}

/** Resolves a single responsive style against the responsive state. */
export const transformStyle =
	(browser: StyleSheetState) =>
		(style: ResponsiveStyle): CSSProperties => {
			const breakpoints = Object.keys(browser.breakpoints).sort(
				(a, b) => browser.breakpoints[a] - browser.breakpoints[b],
			);
			const result: Record<string, unknown> = {};
			const entries = style as Record<string, unknown>;

			for (const key of sortKeys(Object.keys(style), breakpoints)) {
				if (!isResponsiveKey(key)) {
					result[key] = entries[key];
				} else if (isBrowserMatching(browser, key)) {
					Object.assign(result, entries[key]);
				}
			}

			return result;
		};

/** Resolves every style of a stylesheet against the responsive state. */
export function computeStyles<S extends ResponsiveStyleSheet>(
	browser: StyleSheetState,
	stylesheet: S,
): ComputedStyles<S> {
	const transform = transformStyle(browser);
	return Object.fromEntries(
		Object.entries(stylesheet).map(([key, style]) => [key, transform(style)]),
	) as ComputedStyles<S>;
}
