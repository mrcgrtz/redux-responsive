/**
 * Breakpoints map a media type to either the upper bound of its width range (in px)
 * or a custom media query string (e.g. `'print'`).
 */
export type Breakpoints = Readonly<Record<string, number | string>>;

export type DefaultBreakpoints = {
	extraSmall: number;
	small: number;
	medium: number;
	large: number;
};

export type Orientation = 'portrait' | 'landscape' | null;

/** The breakpoints stored in the state, including the infinity media type. */
export type ResolvedBreakpoints<BreakpointMap extends Breakpoints, InfinityName extends string> = BreakpointMap & Record<InfinityName, number>;

export type MediaType<BreakpointMap extends Breakpoints, InfinityName extends string> = Extract<keyof BreakpointMap, string> | InfinityName;

export type BreakpointResults<BreakpointMap extends Breakpoints, InfinityName extends string> = Record<MediaType<BreakpointMap, InfinityName>, boolean>;

export type ResponsiveState<
	BreakpointMap extends Breakpoints = DefaultBreakpoints,
	InfinityName extends string = 'infinity',
> = {
	/** Marker used by the store enhancer to locate the responsive state. */
	_responsiveState: true;
	mediaType: MediaType<BreakpointMap, InfinityName>;
	orientation: Orientation;
	lessThan: BreakpointResults<BreakpointMap, InfinityName>;
	greaterThan: BreakpointResults<BreakpointMap, InfinityName>;
	is: BreakpointResults<BreakpointMap, InfinityName>;
	breakpoints: ResolvedBreakpoints<BreakpointMap, InfinityName>;
};

export type ResponsiveReducerOptions<
	BreakpointMap extends Breakpoints,
	InfinityName extends string,
	ExtraFields extends object,
> = {
	/** The media type to use before the first calculation (e.g. derived from the user agent). */
	initialMediaType?: NoInfer<MediaType<BreakpointMap, InfinityName>>;
	/** The name of the media type above the largest breakpoint. Defaults to `'infinity'`. */
	infinity?: InfinityName;
	/** Computes additional fields that are merged into the responsive state. */
	extraFields?: (state: ResponsiveState<BreakpointMap, InfinityName>) => ExtraFields;
};

/** Adds the extra fields to the state, keeping the plain state type when there are none. */
export type WithExtraFields<S, ExtraFields> = [keyof ExtraFields] extends [never] ? S : S & ExtraFields;

export type ResponsiveEnhancerOptions = {
	/** Calculate the responsive state as soon as the store is created. Defaults to `true`. */
	calculateInitialState?: boolean;
	/** The window to observe. Defaults to `globalThis.window`. */
	window?: Pick<Window, 'matchMedia'>;
};

/** @deprecated Use `ResponsiveState`. */
// eslint-disable-next-line @typescript-eslint/naming-convention -- v4 name, kept for migration
export type IBrowser<BreakpointMap extends Breakpoints = DefaultBreakpoints> = ResponsiveState<BreakpointMap>;
/** @deprecated Use `Breakpoints`. */
// eslint-disable-next-line @typescript-eslint/naming-convention -- v4 name, kept for migration
export type IBreakPoints = Breakpoints;
