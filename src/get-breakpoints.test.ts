import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {Map, Record as ImmutableRecord} from 'immutable';
import {
	combineReducers,
	legacy_createStore as createStore,
	type Reducer,
	type UnknownAction,
} from 'redux';
import {getBreakpoints} from './get-breakpoints.ts';
import {createResponsiveStateReducer, defaultBreakpoints} from './reducer.ts';

const reducer = createResponsiveStateReducer();

// What redux-immutable's combineReducers does: keep each slice in an Immutable.js collection
type ImmutableCollection = {
	get(key: string): unknown;
	set(key: string, value: unknown): ImmutableCollection;
};
const immutableCombine =
	(reducers: Record<string, Reducer>, initial: ImmutableCollection = Map<string, unknown>()) =>
		(state: ImmutableCollection | undefined, action: UnknownAction) => {
			let next = state ?? initial;
			for (const [key, slice] of Object.entries(reducers)) {
				next = next.set(key, slice(next.get(key), action) as unknown);
			}

			return next;
		};

const expected = {...defaultBreakpoints, infinity: Infinity};

describe('getBreakpoints', () => {
	it('finds the responsive state at the root', () => {
		const store = createStore(combineReducers({browser: reducer}));
		assert.deepEqual(getBreakpoints(store.getState()), expected);
	});

	it('finds the responsive state anywhere in the state', () => {
		const store = createStore(
			combineReducers({
				foo: combineReducers({
					bar: combineReducers({baz: reducer}),
					quux: () => true,
				}),
			}),
		);
		assert.deepEqual(getBreakpoints(store.getState()), expected);
	});

	it('finds the responsive state in an Immutable.js Map', () => {
		const store = createStore(
			immutableCombine({
				foo: immutableCombine({bar: immutableCombine({baz: reducer})}),
			}),
		);
		assert.deepEqual(getBreakpoints(store.getState()), expected);
	});

	it('finds the responsive state in an Immutable.js Record', () => {
		const Inner = ImmutableRecord<{baz: unknown}>({baz: undefined});
		const Outer = ImmutableRecord<{foo: unknown}>({foo: Inner()});
		const store = createStore(
			immutableCombine({foo: immutableCombine({baz: reducer}, Inner())}, Outer()),
		);
		assert.deepEqual(getBreakpoints(store.getState()), expected);
	});

	it('does not break on \'keys\' or \'getIn\' state keys', () => {
		const store = createStore(
			combineReducers({keys: () => true, getIn: () => true, browser: reducer}),
		);
		assert.deepEqual(getBreakpoints(store.getState()), expected);
	});

	it('throws when there is no responsive state', () => {
		const store = createStore(combineReducers({hello: () => true}));
		assert.throws(() => getBreakpoints(store.getState()), Error);
	});
});
