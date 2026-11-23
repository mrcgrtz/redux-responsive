import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    browserMatches,
    computeStyles,
    parsePattern,
    sortKeys,
    transformStyle,
} from './stylesheet.ts'
import type { StyleSheetState } from './stylesheet.ts'

const browser: StyleSheetState = {
    greaterThan: { medium: true, large: false },
    lessThan: { medium: false, large: true },
    mediaType: 'large',
    breakpoints: { medium: 800, large: 1000 },
}

describe('stylesheet', () => {
    it('parses style patterns', () => {
        assert.deepEqual(parsePattern('_lessThan_medium'), {
            comparison: 'lessThan',
            size: 'medium',
        })
    })

    it('matches patterns against the responsive state', () => {
        assert.equal(browserMatches(browser, '_greaterThan_medium'), true)
        assert.equal(browserMatches(browser, '_greaterThan_large'), false)
        assert.equal(browserMatches(browser, '_equal_large'), true)
        assert.equal(browserMatches(browser, '_greaterThan_unknown'), false)
        assert.equal(browserMatches(browser, '_bogus_large'), false)
    })

    it('sorts style keys so overrides apply in order', () => {
        const keys = [
            '_lessThan_medium',
            'background',
            '_greaterThan_large',
            'color',
            '_lessThan_large',
            '_equal_medium',
            '_greaterThan_medium',
            'border',
        ]

        assert.deepEqual(sortKeys(keys, ['medium', 'large']), [
            'background',
            'color',
            'border',
            '_lessThan_large',
            '_lessThan_medium',
            '_greaterThan_medium',
            '_greaterThan_large',
            '_equal_medium',
        ])
    })

    it('applies greaterThan overrides after lessThan overrides', () => {
        const style = {
            border: 'black',
            color: 'black',
            _greaterThan_medium: { border: 'blue' },
            _lessThan_large: { border: 'green' },
            _equal_medium: { color: 'red' },
        }

        assert.deepEqual(transformStyle(browser)(style), { border: 'blue', color: 'black' })
    })

    it('resolves a whole stylesheet', () => {
        const style = { border: 'black', _lessThan_large: { border: 'green' } }
        assert.deepEqual(computeStyles(browser, { a: style, b: style }), {
            a: { border: 'green' },
            b: { border: 'green' },
        })
    })
})
