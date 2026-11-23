import { configureStore } from '@reduxjs/toolkit'
import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { applyMiddleware, combineReducers, compose, legacy_createStore as createStore } from 'redux'
import type { StoreEnhancer } from 'redux'
import { calculateResponsiveState } from './actions.ts'
import { createResponsiveStoreEnhancer } from './enhancer.ts'
import { createResponsiveStateReducer } from './reducer.ts'
import { createFakeWindow } from './test-utils.ts'

const rootReducer = combineReducers({ browser: createResponsiveStateReducer() })

const createResponsiveStore = (width: number, options = {}) => {
    const window = createFakeWindow({ width, height: 600 })
    const store = createStore(rootReducer, createResponsiveStoreEnhancer({ window, ...options }))
    return { store, window }
}

describe('createResponsiveStoreEnhancer', () => {
    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'window')
    })

    it('calculates the initial state by default', () => {
        const { store } = createResponsiveStore(500)
        assert.equal(store.getState().browser.mediaType, 'small')
        assert.equal(store.getState().browser.orientation, 'portrait')
    })

    it('skips the initial calculation when asked to', () => {
        const { store } = createResponsiveStore(500, { calculateInitialState: false })
        assert.equal(store.getState().browser.mediaType, 'infinity')
    })

    it('recalculates when the window crosses a breakpoint', () => {
        const { store, window } = createResponsiveStore(500)
        const listener = mock.fn()
        store.subscribe(listener)

        window.resize({ width: 520 })
        assert.equal(listener.mock.callCount(), 0, 'no dispatch within a media type')

        // crosses a breakpoint and flips the orientation in one go
        window.resize({ width: 1100 })
        assert.equal(store.getState().browser.mediaType, 'large')
        assert.equal(store.getState().browser.orientation, 'landscape')
        assert.equal(listener.mock.callCount(), 1)

        window.resize({ width: 2000 })
        assert.equal(store.getState().browser.mediaType, 'infinity')
    })

    it('recalculates when the orientation changes', () => {
        const { store, window } = createResponsiveStore(500)
        window.resize({ height: 400 })
        assert.equal(store.getState().browser.orientation, 'landscape')
    })

    it('fills in the measurement for manual calculation requests', () => {
        const { store } = createResponsiveStore(900, { calculateInitialState: false })
        store.dispatch(calculateResponsiveState())
        assert.equal(store.getState().browser.mediaType, 'medium')
    })

    it('falls back to globalThis.window at store creation time', () => {
        const enhancer = createResponsiveStoreEnhancer()
        Object.assign(globalThis, { window: createFakeWindow({ width: 300 }) })

        const store = createStore(rootReducer, enhancer)
        assert.equal(store.getState().browser.mediaType, 'extraSmall')
    })

    it('leaves the store untouched without a window', () => {
        const store = createStore(rootReducer, createResponsiveStoreEnhancer())
        assert.equal(store.getState().browser.mediaType, 'infinity')
        store.dispatch(calculateResponsiveState())
        assert.equal(store.getState().browser.mediaType, 'infinity')
    })

    it('composes with other enhancers', () => {
        const window = createFakeWindow({ width: 500 })
        const store = createStore(
            rootReducer,
            compose(createResponsiveStoreEnhancer({ window }), applyMiddleware()) as StoreEnhancer
        )
        assert.equal(store.getState().browser.mediaType, 'small')
    })

    it('works with Redux Toolkit without serializability warnings', () => {
        const warn = mock.method(console, 'error', () => {})
        const window = createFakeWindow({ width: 500 })
        const store = configureStore({
            reducer: { browser: createResponsiveStateReducer() },
            enhancers: (getDefaultEnhancers) =>
                getDefaultEnhancers().concat(createResponsiveStoreEnhancer({ window })),
        })

        window.resize({ width: 900 })
        store.dispatch(calculateResponsiveState())

        assert.equal(store.getState().browser.mediaType, 'medium')
        assert.equal(warn.mock.callCount(), 0)
        warn.mock.restore()
    })

    it('throws when the responsive state is missing', () => {
        assert.throws(
            () =>
                createStore(
                    combineReducers({ other: () => true }),
                    createResponsiveStoreEnhancer({ window: createFakeWindow() })
                ),
            /could not find the responsive state/
        )
    })
})
