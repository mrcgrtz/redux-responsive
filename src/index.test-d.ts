// Type-level tests, checked by `npm run typecheck`.
import {configureStore} from '@reduxjs/toolkit';
import {
	applyMiddleware,
	combineReducers,
	compose,
	legacy_createStore as createStore,
	type Reducer,
	type StoreEnhancer,
} from 'redux';
import {createElement, type CSSProperties} from 'react';
import {
	calculateResponsiveState,
	createResponsiveStateReducer,
	createResponsiveStoreEnhancer,
	responsiveStateReducer,
	responsiveStoreEnhancer,
	type CalculateResponsiveStateAction,
	type Orientation,
	type ResponsiveState,
} from './index.ts';
import {StyleSheet, useResponsiveStyles} from './react/index.ts';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const expectType = <T extends true>(_: T) => {};

// Default reducer and enhancer
const store = createStore(
	combineReducers({browser: responsiveStateReducer}),
	responsiveStoreEnhancer,
);
const {browser} = store.getState();
expectType<
	Equal<typeof browser.mediaType, 'extraSmall' | 'small' | 'medium' | 'large' | 'infinity'>
>(true);
expectType<Equal<typeof browser.orientation, Orientation>>(true);
expectType<Equal<typeof browser.lessThan.small, boolean>>(true);
expectType<Equal<typeof browser, ResponsiveState>>(true);
// @ts-expect-error unknown media type
browser.is.huge;

// Enhancer options and composition
createStore(
	combineReducers({browser: responsiveStateReducer}),
	compose(
		createResponsiveStoreEnhancer({calculateInitialState: false}),
		applyMiddleware(),
	) as StoreEnhancer,
);
const enhancer: StoreEnhancer = createResponsiveStoreEnhancer();
enhancer;
// @ts-expect-error unknown option
createResponsiveStoreEnhancer({foo: true});

// Redux Toolkit
const rtkStore = configureStore({
	reducer: {browser: responsiveStateReducer},
	enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(responsiveStoreEnhancer),
});
expectType<
	Equal<typeof rtkStore.getState extends () => {browser: ResponsiveState} ? true : false, true>
>(true);

// Custom breakpoints, infinity and extra fields
const custom = createResponsiveStateReducer(
	{big: 1000, veryBig: 2000, print: 'print'},
	{
		infinity: 'superBig',
		initialMediaType: 'big',
		extraFields: state => ({foo: state.is.big ? 1 : 0}),
	},
);
type Custom = typeof custom extends Reducer<infer S> ? S : never;
expectType<Equal<Custom['mediaType'], 'big' | 'veryBig' | 'print' | 'superBig'>>(true);
expectType<Equal<Custom['foo'], number>>(true);
expectType<Equal<Custom['breakpoints']['superBig'], number>>(true);
declare const customState: Custom;
// @ts-expect-error default breakpoints are not part of custom ones
customState.lessThan.small;
// @ts-expect-error unknown extra field
customState.bar;

// Null breakpoints keep the defaults
const withExtra = createResponsiveStateReducer(null, {extraFields: () => ({foo: 1})});
type WithExtra = typeof withExtra extends Reducer<infer S> ? S : never;
expectType<Equal<WithExtra['mediaType'], ResponsiveState['mediaType']>>(true);
expectType<Equal<WithExtra['foo'], number>>(true);

// @ts-expect-error unknown initial media type
createResponsiveStateReducer({big: 1000}, {initialMediaType: 'small'});

// Actions
expectType<Equal<ReturnType<typeof calculateResponsiveState>, CalculateResponsiveStateAction>>(true);
calculateResponsiveState({mediaType: 'small', orientation: 'portrait'});
// @ts-expect-error invalid orientation
calculateResponsiveState({mediaType: 'small', orientation: 'sideways'});

// React bindings
export function Hook() {
	const styles = useResponsiveStyles({
		box: {color: 'red', _lessThan_medium: {color: 'blue'}},
	});
	expectType<Equal<keyof typeof styles, 'box'>>(true);
	// @ts-expect-error unknown style
	styles.other;
	// @ts-expect-error invalid pattern value
	useResponsiveStyles({box: {_lessThan_medium: 'blue'}});
	return null;
}

const Wrapped = StyleSheet({box: {color: 'red'}})(({
	styles,
	label,
}: {
	label: string;
	styles: {box: CSSProperties};
}) => {
	styles.box;
	return label;
});
export const wrapped = createElement(Wrapped, {label: 'hi'});
// @ts-expect-error missing own prop
createElement(Wrapped, {});

const WithProps = StyleSheet((state, props: {active: boolean}) => ({
	box: {color: props.active && state.mediaType === 'small' ? 'red' : 'black'},
}))(
	({styles, active}: {active: boolean; styles: {box: CSSProperties}}) =>
		String(active) + styles.box.color,
);
export const withProps = createElement(WithProps, {active: true});
