import type { Reducer } from 'redux'
import { isCalculateResponsiveStateAction } from './actions.ts'
import type {
    BreakpointResults,
    Breakpoints,
    DefaultBreakpoints,
    MediaType,
    ResolvedBreakpoints,
    ResponsiveReducerOptions,
    ResponsiveState,
    WithExtraFields,
} from './types.ts'

export const defaultBreakpoints: Readonly<DefaultBreakpoints> = Object.freeze({
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
})

const mapValues = <T, R>(obj: Record<string, T>, f: (value: T, key: string) => R) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, f(value, key)]))

/**
 * Computes the position of every media type such that large > medium > small.
 * Custom (string) media queries are ordered after all numeric breakpoints.
 */
export function getOrderMap(breakpoints: Breakpoints): Record<string, number> {
    const keys = Object.keys(breakpoints).sort((a, b) => {
        const valueA = breakpoints[a]
        const valueB = breakpoints[b]

        if (typeof valueA === 'number' && typeof valueB === 'string') return -1
        if (typeof valueA === 'string' && typeof valueB === 'number') return 1
        return valueA >= valueB ? 1 : -1
    })

    return Object.fromEntries(keys.map((key, index) => [key, index]))
}

/** Whether the current media type is smaller than each numeric breakpoint. */
export function getLessThan(
    currentMediaType: string,
    breakpoints: Breakpoints,
    order: Record<string, number>
): Record<string, boolean> {
    return mapValues(
        breakpoints,
        (breakpoint, mediaType) =>
            typeof breakpoint === 'number' && order[currentMediaType] < order[mediaType]
    )
}

/** Whether the current media type is larger than each numeric breakpoint. */
export function getGreaterThan(
    currentMediaType: string,
    breakpoints: Breakpoints,
    order: Record<string, number>
): Record<string, boolean> {
    return mapValues(
        breakpoints,
        (breakpoint, mediaType) =>
            typeof breakpoint === 'number' && order[currentMediaType] > order[mediaType]
    )
}

/** Whether the current media type equals each media type. */
export function getIs(currentMediaType: string, breakpoints: Breakpoints): Record<string, boolean> {
    return mapValues(breakpoints, (_, mediaType) => mediaType === currentMediaType)
}

/**
 * Creates a reducer that holds the responsive state for the given breakpoints.
 * Passing `null` or `undefined` uses the default breakpoints.
 */
export function createResponsiveStateReducer<
    const Inf extends string = 'infinity',
    EF extends object = Record<never, never>,
>(
    breakpoints?: null,
    options?: ResponsiveReducerOptions<DefaultBreakpoints, Inf, EF>
): Reducer<WithExtraFields<ResponsiveState<DefaultBreakpoints, Inf>, EF>>
export function createResponsiveStateReducer<
    const BP extends Breakpoints,
    const Inf extends string = 'infinity',
    EF extends object = Record<never, never>,
>(
    breakpoints: BP,
    options?: ResponsiveReducerOptions<BP, Inf, EF>
): Reducer<WithExtraFields<ResponsiveState<BP, Inf>, EF>>
export function createResponsiveStateReducer<
    const BP extends Breakpoints,
    const Inf extends string,
    EF extends object,
>(
    breakpoints?: BP | null,
    options: ResponsiveReducerOptions<BP, Inf, EF> = {}
): Reducer<ResponsiveState<BP, Inf> & EF> {
    const { initialMediaType, infinity = 'infinity' as Inf, extraFields } = options
    const resolved = Object.freeze({
        ...(breakpoints ?? defaultBreakpoints),
        [infinity]: Infinity,
    }) as ResolvedBreakpoints<BP, Inf>
    const order = getOrderMap(resolved)

    const compute = (
        mediaType: MediaType<BP, Inf>,
        orientation: ResponsiveState['orientation']
    ) => {
        const state: ResponsiveState<BP, Inf> = {
            _responsiveState: true,
            mediaType,
            orientation,
            lessThan: getLessThan(mediaType, resolved, order) as BreakpointResults<BP, Inf>,
            greaterThan: getGreaterThan(mediaType, resolved, order) as BreakpointResults<BP, Inf>,
            is: getIs(mediaType, resolved) as BreakpointResults<BP, Inf>,
            breakpoints: resolved,
        }
        return { ...state, ...extraFields?.(state) } as ResponsiveState<BP, Inf> & EF
    }

    return (state, action) => {
        if (isCalculateResponsiveStateAction(action) && action.payload) {
            const { mediaType, orientation } = action.payload
            return compute(mediaType as MediaType<BP, Inf>, orientation)
        }
        return state ?? compute(initialMediaType ?? infinity, null)
    }
}
