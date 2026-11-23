import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { combineReducers, legacy_createStore as createStore } from 'redux'
import { calculateResponsiveState } from '../actions.ts'
import { createResponsiveStateReducer } from '../reducer.ts'
import { StyleSheet, useResponsiveStyles } from './index.ts'
import type { ResponsiveStyleSheet } from './index.ts'

const storeWith = (key: string, mediaType: string) =>
    createStore(combineReducers({ [key]: createResponsiveStateReducer() }), {
        [key]: createResponsiveStateReducer()(
            undefined,
            calculateResponsiveState({ mediaType, orientation: null })
        ),
    })

const render = (store: ReturnType<typeof storeWith>, element: ReactElement) =>
    renderToStaticMarkup(createElement(Provider, { store, children: element }))

const stylesheet = {
    box: { color: 'black', _lessThan_medium: { color: 'red' } },
} satisfies ResponsiveStyleSheet

describe('useResponsiveStyles', () => {
    function Box() {
        const styles = useResponsiveStyles(stylesheet)
        return createElement('p', { style: styles.box })
    }

    it('resolves the stylesheet against the responsive state', () => {
        assert.equal(
            render(storeWith('browser', 'small'), createElement(Box)),
            '<p style="color:red"></p>'
        )
        assert.equal(
            render(storeWith('browser', 'large'), createElement(Box)),
            '<p style="color:black"></p>'
        )
    })

    it('accepts a stylesheet function and a custom selector', () => {
        function Label({ text }: { text: string }) {
            const styles = useResponsiveStyles(
                (browser, props: { text: string }) => ({
                    label: { content: `${props.text}-${browser.mediaType}` },
                }),
                { text },
                { selectResponsiveState: (state: { screen: never }) => state.screen }
            )
            return createElement('span', null, styles.label.content)
        }

        assert.equal(
            render(storeWith('screen', 'medium'), createElement(Label, { text: 'hi' })),
            '<span>hi-medium</span>'
        )
    })
})

describe('StyleSheet', () => {
    it('passes the resolved styles as a prop', () => {
        const Box = StyleSheet(stylesheet)(
            ({ styles, id }: { id: string; styles: { box: CSSProperties } }) =>
                createElement('p', { id, style: styles.box })
        )

        assert.equal(
            render(storeWith('browser', 'small'), createElement(Box, { id: 'x' })),
            '<p id="x" style="color:red"></p>'
        )
    })

    it('reads the responsive state from a custom reducer name', () => {
        const Box = StyleSheet(stylesheet, { reducerName: 'screen' })(({ styles }) =>
            createElement('p', { style: styles.box })
        )

        assert.equal(
            render(storeWith('screen', 'large'), createElement(Box)),
            '<p style="color:black"></p>'
        )
    })
})
