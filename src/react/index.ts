import {
	createElement,
	memo,
	useMemo,
	type ComponentType,
	type NamedExoticComponent,
} from 'react';
import {useSelector} from 'react-redux';
import {
	computeStyles,
	type ComputedStyles,
	type ResponsiveStyleSheet,
	type StyleSheetState,
} from './stylesheet.ts';

export {computeStyles, transformStyle} from './stylesheet.ts';
export type {
	Comparison,
	ComputedStyles,
	ResponsiveStyle,
	ResponsiveStyleSheet,
	StyleSheetState,
} from './stylesheet.ts';

export type StyleSheetDefinition<S extends ResponsiveStyleSheet, P> =
    S | ((browser: StyleSheetState, props: P) => S);

export type UseResponsiveStylesOptions = {
	/** Selects the responsive state from the store state. Defaults to `state => state.browser`. */
	selectResponsiveState?: (state: never) => StyleSheetState;
};

const selectBrowser = (state: {browser: StyleSheetState}) => state.browser;

/**
 * Resolves a responsive stylesheet against the responsive state in the store.
 *
 * @example
 * const styles = useResponsiveStyles({ box: { color: 'red', _lessThan_medium: { color: 'blue' } } })
 */
export function useResponsiveStyles<S extends ResponsiveStyleSheet, P = undefined>(
	stylesheet: StyleSheetDefinition<S, P>,
	props?: P,
	{selectResponsiveState = selectBrowser}: UseResponsiveStylesOptions = {},
): ComputedStyles<S> {
	const browser = useSelector(selectResponsiveState);

	return useMemo(
		() =>
			computeStyles(
				browser,
				typeof stylesheet === 'function' ? stylesheet(browser, props as P) : stylesheet,
			),
		[browser, stylesheet, props],
	);
}

export type StyleSheetOptions = {
	/** The key of the responsive state in the root state. Defaults to `'browser'`. */
	reducerName?: string;
};

/**
 * Higher-order component that passes the resolved stylesheet as the `styles` prop.
 * Prefer `useResponsiveStyles` in new code.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- public API name since v4
export function StyleSheet<S extends ResponsiveStyleSheet, P extends object = object>(
	stylesheet: StyleSheetDefinition<S, P>,
	{reducerName = 'browser'}: StyleSheetOptions = {},
) {
	const selectResponsiveState = (state: Record<string, StyleSheetState>) => state[reducerName];

	return <WrappedProps extends P & {styles: ComputedStyles<S>}>(
		Component: ComponentType<WrappedProps>,
	): NamedExoticComponent<Omit<WrappedProps, 'styles'>> => {
		// eslint-disable-next-line @typescript-eslint/naming-convention -- React component
		function WithStyleSheet(props: Omit<WrappedProps, 'styles'>) {
			const styles = useResponsiveStyles(stylesheet, props as unknown as P, {
				selectResponsiveState,
			});
			return createElement(Component, {...props, styles} as WrappedProps);
		}

		WithStyleSheet.displayName = `StyleSheet(${Component.displayName ?? Component.name ?? 'Component'})`;

		return memo(WithStyleSheet);
	};
}
