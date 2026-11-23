import type {Breakpoints} from './types.ts';

// Immutable.js collections (e.g. from redux-immutable) are traversed through their own API.
type ImmutableLike = {
	getIn(path: readonly string[]): unknown;
	toSeq(): {keys(): Iterable<string>};
};

const isImmutable = (value: object): value is ImmutableLike =>
	typeof (value as Partial<ImmutableLike>).getIn === 'function'
	&& typeof (value as Partial<ImmutableLike>).toSeq === 'function';

function getIn(object: object, path: readonly string[]): unknown {
	if (isImmutable(object)) {
		return object.getIn(path);
	}

	let current: unknown = object;
	for (const key of path) {
		current = (current as Record<string, unknown>)[key];
	}

	return current;
}

const keysOf = (object: object): string[] =>
	// Immutable.js iterators do not inherit from `Iterator.prototype`, so they have no `toArray()`
	// eslint-disable-next-line unicorn/prefer-iterator-to-array
	isImmutable(object) ? [...object.toSeq().keys()] : Object.keys(object);

/** Breadth-first search for the object carrying the `marker` key. */
function findMarker(tree: object, marker: string, maxDepth = 20): string[] | null {
	const queue: string[][] = [[]];

	while (queue.length > 0) {
		const path = queue.shift()!;
		if (path.length > maxDepth) {
			continue;
		}

		const current = getIn(tree, path);
		if (typeof current !== 'object' || current === null) {
			continue;
		}

		if ((current as Record<string, unknown>)[marker] === true) {
			return path;
		}

		queue.push(...keysOf(current).map(key => [...path, key]));
	}

	return null;
}

/** Locates the responsive state anywhere in the store state and returns its breakpoints. */
export function getBreakpoints(state: unknown): Breakpoints {
	const path = typeof state === 'object' && state !== null ? findMarker(state, '_responsiveState') : null;

	if (path === null) {
		throw new Error(
			'redux-responsive: could not find the responsive state in the store. '
			+ 'Make sure the responsive state reducer is part of your root reducer.',
		);
	}

	return (getIn(state as object, path) as {breakpoints: Breakpoints}).breakpoints;
}
