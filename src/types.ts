/**
 * Breakpoints map a media type to either the upper bound of its width range (in px)
 * or a custom media query string (e.g. `'print'`).
 */
export type Breakpoints = Readonly<Record<string, number | string>>

export type DefaultBreakpoints = {
    extraSmall: number
    small: number
    medium: number
    large: number
}

export type Orientation = 'portrait' | 'landscape' | null

/** The breakpoints stored in the state, including the infinity media type. */
export type ResolvedBreakpoints<BP extends Breakpoints, Inf extends string> = BP & {
    [K in Inf]: number
}

export type MediaType<BP extends Breakpoints, Inf extends string> = Extract<keyof BP, string> | Inf

export type BreakpointResults<BP extends Breakpoints, Inf extends string> = {
    [K in MediaType<BP, Inf>]: boolean
}

export interface ResponsiveState<
    BP extends Breakpoints = DefaultBreakpoints,
    Inf extends string = 'infinity',
> {
    /** Marker used by the store enhancer to locate the responsive state. */
    _responsiveState: true
    mediaType: MediaType<BP, Inf>
    orientation: Orientation
    lessThan: BreakpointResults<BP, Inf>
    greaterThan: BreakpointResults<BP, Inf>
    is: BreakpointResults<BP, Inf>
    breakpoints: ResolvedBreakpoints<BP, Inf>
}

export interface ResponsiveReducerOptions<
    BP extends Breakpoints,
    Inf extends string,
    EF extends object,
> {
    /** The media type to use before the first calculation (e.g. derived from the user agent). */
    initialMediaType?: NoInfer<MediaType<BP, Inf>>
    /** The name of the media type above the largest breakpoint. Defaults to `'infinity'`. */
    infinity?: Inf
    /** Computes additional fields that are merged into the responsive state. */
    extraFields?: (state: ResponsiveState<BP, Inf>) => EF
}

/** Adds the extra fields to the state, keeping the plain state type when there are none. */
export type WithExtraFields<S, EF> = [keyof EF] extends [never] ? S : S & EF

export interface ResponsiveEnhancerOptions {
    /** Calculate the responsive state as soon as the store is created. Defaults to `true`. */
    calculateInitialState?: boolean
    /** The window to observe. Defaults to `globalThis.window`. */
    window?: Pick<Window, 'matchMedia'>
}

/** @deprecated Use `ResponsiveState`. */
export type IBrowser<BP extends Breakpoints = DefaultBreakpoints> = ResponsiveState<BP>
/** @deprecated Use `Breakpoints`. */
export type IBreakPoints = Breakpoints
