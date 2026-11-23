import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculateResponsiveState } from './actions.ts'
import {
    createResponsiveStateReducer,
    defaultBreakpoints,
    getGreaterThan,
    getIs,
    getLessThan,
    getOrderMap,
} from './reducer.ts'

const init = { type: '@@INIT' }

describe('createResponsiveStateReducer', () => {
    it('uses the default breakpoints plus the infinity media type', () => {
        const state = createResponsiveStateReducer()(undefined, init)

        assert.deepEqual(state.breakpoints, { ...defaultBreakpoints, infinity: Infinity })
        assert.equal(state.mediaType, 'infinity')
        assert.equal(state.orientation, null)
        assert.equal(state._responsiveState, true)
    })

    it('treats null breakpoints as the defaults', () => {
        const state = createResponsiveStateReducer(null)(undefined, init)
        assert.deepEqual(Object.keys(state.breakpoints), [
            ...Object.keys(defaultBreakpoints),
            'infinity',
        ])
    })

    it('does not mutate the given breakpoints', () => {
        const breakpoints = Object.freeze({ small: 500, large: 1000 })
        createResponsiveStateReducer(breakpoints)(undefined, init)
        assert.deepEqual(breakpoints, { small: 500, large: 1000 })
    })

    it('returns the input state for unrelated actions', () => {
        const reducer = createResponsiveStateReducer()
        const state = reducer(undefined, init)
        assert.equal(reducer(state, { type: 'unrelated' }), state)
    })

    it('ignores calculation requests without a measurement', () => {
        const reducer = createResponsiveStateReducer()
        const state = reducer(undefined, init)
        assert.equal(reducer(state, calculateResponsiveState()), state)
    })

    it('computes the state from the measured media type and orientation', () => {
        const reducer = createResponsiveStateReducer({ small: 500, medium: 1000, large: 1500 })
        const state = reducer(
            undefined,
            calculateResponsiveState({ mediaType: 'medium', orientation: 'landscape' })
        )

        assert.equal(state.mediaType, 'medium')
        assert.equal(state.orientation, 'landscape')
        assert.deepEqual(state.lessThan, {
            small: false,
            medium: false,
            large: true,
            infinity: true,
        })
        assert.deepEqual(state.greaterThan, {
            small: true,
            medium: false,
            large: false,
            infinity: false,
        })
        assert.deepEqual(state.is, { small: false, medium: true, large: false, infinity: false })
    })

    it('uses the initial media type before the first calculation', () => {
        const reducer = createResponsiveStateReducer(
            { small: 500, medium: 1000 },
            { initialMediaType: 'small' }
        )
        const state = reducer(undefined, init)

        assert.equal(state.mediaType, 'small')
        assert.equal(state.is.small, true)
        assert.equal(state.lessThan.medium, true)
    })

    it('supports a custom infinity media type', () => {
        const state = createResponsiveStateReducer(null, { infinity: 'veryBig' })(undefined, init)

        assert.equal(state.mediaType, 'veryBig')
        assert.equal(state.breakpoints.veryBig, Infinity)
        assert.equal(state.is.veryBig, true)
    })

    it('merges extra fields into the state', () => {
        const reducer = createResponsiveStateReducer(null, {
            extraFields: ({ greaterThan, is }) => ({
                greaterThanOrEqual: Object.fromEntries(
                    Object.entries(greaterThan).map(([key, value]) => [
                        key,
                        value || is[key as keyof typeof is],
                    ])
                ),
            }),
        })
        const state = reducer(
            undefined,
            calculateResponsiveState({ mediaType: 'medium', orientation: null })
        )

        assert.equal(state.greaterThanOrEqual.medium, true)
        assert.equal(state.greaterThanOrEqual.small, true)
        assert.equal(state.greaterThanOrEqual.large, false)
    })
})

describe('breakpoint helpers', () => {
    const breakpoints = { small: 500, medium: 800, large: 1000, print: 'print' }
    const order = getOrderMap(breakpoints)

    it('orders numeric breakpoints before custom media queries', () => {
        assert.deepEqual(order, { small: 0, medium: 1, large: 2, print: 3 })
    })

    it('computes lessThan, greaterThan and is', () => {
        assert.deepEqual(getLessThan('medium', breakpoints, order), {
            small: false,
            medium: false,
            large: true,
            print: false,
        })
        assert.deepEqual(getGreaterThan('medium', breakpoints, order), {
            small: true,
            medium: false,
            large: false,
            print: false,
        })
        assert.deepEqual(getIs('print', breakpoints), {
            small: false,
            medium: false,
            large: false,
            print: true,
        })
    })
})
