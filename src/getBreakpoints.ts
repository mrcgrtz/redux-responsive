import type { Breakpoints } from './types.ts'

// Immutable.js collections (e.g. from redux-immutable) are traversed through their own API.
interface ImmutableLike {
    getIn(path: readonly string[]): unknown
    toSeq(): { keys(): Iterable<string> }
}

const isImmutable = (value: object): value is ImmutableLike =>
    typeof (value as Partial<ImmutableLike>).getIn === 'function' &&
    typeof (value as Partial<ImmutableLike>).toSeq === 'function'

const getIn = (obj: object, path: readonly string[]): unknown =>
    isImmutable(obj)
        ? obj.getIn(path)
        : path.reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], obj)

const keysOf = (obj: object): string[] =>
    isImmutable(obj) ? Array.from(obj.toSeq().keys()) : Object.keys(obj)

/** Breadth-first search for the object carrying the `marker` key. */
function findMarker(tree: object, marker: string, maxDepth = 20): string[] | null {
    const queue: string[][] = [[]]

    while (queue.length > 0) {
        const path = queue.shift()!
        if (path.length > maxDepth) continue

        const current = getIn(tree, path)
        if (current && typeof current === 'object') {
            if ((current as Record<string, unknown>)[marker]) return path
            queue.push(...keysOf(current).map((key) => [...path, key]))
        }
    }

    return null
}

/** Locates the responsive state anywhere in the store state and returns its breakpoints. */
export function getBreakpoints(state: unknown): Breakpoints {
    const path = state && typeof state === 'object' ? findMarker(state, '_responsiveState') : null

    if (!path) {
        throw new Error(
            'redux-responsive: could not find the responsive state in the store. ' +
                'Make sure the responsive state reducer is part of your root reducer.'
        )
    }

    return (getIn(state as object, path) as { breakpoints: Breakpoints }).breakpoints
}
