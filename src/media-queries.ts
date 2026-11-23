import type {Breakpoints} from './types.ts';

/**
 * Translates breakpoints into one media query per media type. Numeric breakpoints become
 * contiguous width ranges, string breakpoints are used as custom media queries verbatim.
 */
export function toMediaQueries(breakpoints: Breakpoints): Record<string, string> {
	const ranges = Object.entries(breakpoints)
		.filter((entry): entry is [string, number] => typeof entry[1] === 'number')
		.sort(([, a], [, b]) => a - b);

	const queries: Record<string, string> = {};

	for (const [index, [mediaType, max]] of ranges.entries()) {
		const min = index === 0 ? null : ranges[index - 1][1] + 1;

		if (min === null) {
			queries[mediaType] = `screen and (max-width: ${max}px)`;
		} else if (max === Infinity) {
			queries[mediaType] = `screen and (min-width: ${min}px)`;
		} else {
			queries[mediaType] = `screen and (min-width: ${min}px) and (max-width: ${max}px)`;
		}
	}

	for (const [mediaType, query] of Object.entries(breakpoints)) {
		if (typeof query === 'string') {
			queries[mediaType] = query;
		}
	}

	return queries;
}

export const orientationQueries = {
	portrait: '(orientation: portrait)',
	landscape: '(orientation: landscape)',
} as const;
