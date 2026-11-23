# @mrcgrtz/redux-responsive

[![Test](https://github.com/mrcgrtz/redux-responsive/actions/workflows/test.yml/badge.svg)](https://github.com/mrcgrtz/redux-responsive/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/mrcgrtz/redux-responsive/badge.svg?branch=main)](https://coveralls.io/github/mrcgrtz/redux-responsive?branch=main)
[![npm](https://img.shields.io/npm/v/@mrcgrtz/redux-responsive.svg)](https://www.npmjs.com/package/@mrcgrtz/redux-responsive)

A Redux reducer for managing the responsive state of your application.

```tsx
import { useSelector } from 'react-redux'

function Greeting() {
    const browser = useSelector((state: RootState) => state.browser)

    if (browser.lessThan.small) return <p>Secret message for small viewports!</p>
    if (browser.lessThan.medium) return <p>Between "small" and "medium".</p>
    return <p>Wider than "medium".</p>
}
```

- Written in TypeScript, ships as ES modules with type definitions
- Works with Redux 5 and Redux Toolkit; serializable actions only
- Optional React 19 bindings (`useResponsiveStyles` hook and `StyleSheet` HOC)
- Dispatches only when the viewport crosses a breakpoint or changes orientation

> This is the maintained continuation of [`redux-responsive`](https://github.com/AlecAivazis/redux-responsive) by Alec Aivazis, which has been archived. Coming from `redux-responsive@4`? See the [migration guide](CHANGELOG.md#migration-guide).

## Why store responsive state in Redux?

redux-responsive **does not require React**, but it is commonly used with it.

Wrapping components in responsive wrapper components quickly leads to boilerplate, and many copies of such a wrapper may register many resize handlers. Keeping the responsive state in the store reduces noise in components and guarantees a single set of listeners, built on [`MediaQueryList`](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList) so the store is only updated when needed.

## Installation

```sh
npm install @mrcgrtz/redux-responsive
```

redux-responsive requires `redux@^5`. The React bindings additionally require `react@^19` and `react-redux@^9`.

## Setup

Add the reducer to your root reducer (you can name the key whatever you want) and add the store enhancer, which keeps the state in sync with the window.

### With Redux Toolkit

```ts
import { configureStore } from '@reduxjs/toolkit'
import { responsiveStateReducer, responsiveStoreEnhancer } from '@mrcgrtz/redux-responsive'

export const store = configureStore({
    reducer: {
        browser: responsiveStateReducer,
    },
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(responsiveStoreEnhancer),
})
```

### With plain Redux

```ts
import { applyMiddleware, combineReducers, compose, legacy_createStore as createStore } from 'redux'
import { responsiveStateReducer, responsiveStoreEnhancer } from '@mrcgrtz/redux-responsive'

const reducer = combineReducers({ browser: responsiveStateReducer })

export const store = createStore(
    reducer,
    compose(responsiveStoreEnhancer, applyMiddleware(...middleware))
)
```

The default breakpoints match common device sizes:

```ts
const defaultBreakpoints = {
    extraSmall: 480,
    small: 768,
    medium: 992,
    large: 1200,
}
```

## The responsive state

The reducer adds an object with the following keys to the store:

- `mediaType` (_string_): the largest breakpoint category the viewport satisfies.
- `orientation` (_`'portrait' | 'landscape' | null`_): the viewport orientation.
- `lessThan` (_object_): whether the viewport is smaller than each breakpoint.
- `greaterThan` (_object_): whether the viewport is larger than each breakpoint.
- `is` (_object_): whether the viewport currently is each breakpoint.
- `breakpoints` (_object_): the breakpoints, including the infinity media type.

```ts
const { browser } = store.getState()

browser.mediaType // e.g. 'large'
browser.orientation // 'landscape'
browser.greaterThan.medium // true if wider than the "medium" breakpoint
browser.is.small // true if browser.mediaType === 'small'
```

All fields are fully typed: `browser.is.huge` is a type error unless `huge` is one of your breakpoints.

## Custom breakpoints

```ts
import { createResponsiveStateReducer } from '@mrcgrtz/redux-responsive'

const browser = createResponsiveStateReducer({
    extraSmall: 500,
    small: 700,
    medium: 1000,
    large: 1280,
    extraLarge: 1400,
    // strings are used as custom media queries
    print: 'print',
})
```

### The infinity media type

When the viewport is wider than the largest breakpoint, `mediaType` is `'infinity'`. To rename it, pass the `infinity` option:

```ts
// null uses the default breakpoints
const browser = createResponsiveStateReducer(null, { infinity: 'veryBig' })
```

## Adding computed fields

Pass an `extraFields` function to add fields to the responsive state whenever it is recalculated:

```ts
const browser = createResponsiveStateReducer(null, {
    extraFields: ({ greaterThan, is }) => ({
        greaterThanOrEqual: Object.fromEntries(
            Object.entries(greaterThan).map(([mediaType, value]) => [
                mediaType,
                value || is[mediaType as keyof typeof is],
            ])
        ),
    }),
})
```

### Tracking window attributes

To track attributes such as the width, read them in `extraFields`:

```ts
const browser = createResponsiveStateReducer(null, {
    extraFields: () => ({ width: window.innerWidth }),
})
```

The enhancer only recalculates when the viewport crosses a breakpoint, **not on every resize**. Request a recalculation yourself when you need one:

```ts
import { calculateResponsiveState } from '@mrcgrtz/redux-responsive'

window.addEventListener('resize', () => store.dispatch(calculateResponsiveState()))
```

`calculateResponsiveState()` takes no window: the enhancer measures the window and attaches the result, so the action stays serializable.

## Server-side rendering

Server-rendered markup must match the first client render. Disable the initial calculation so both use the default state:

```ts
import { createResponsiveStoreEnhancer } from '@mrcgrtz/redux-responsive'

const enhancer = createResponsiveStoreEnhancer({ calculateInitialState: false })
```

Then request the calculation once the client has hydrated:

```tsx
import { hydrateRoot } from 'react-dom/client'
import { calculateResponsiveState } from '@mrcgrtz/redux-responsive'

hydrateRoot(
    document.getElementById('app')!,
    <Provider store={store}>
        <App />
    </Provider>
)

store.dispatch(calculateResponsiveState())
```

### Setting the initial media type

If you know the initial media type (e.g. from the user agent), set it on the reducer:

```ts
const browser = createResponsiveStateReducer(null, { initialMediaType: 'small' })
```

### Observing another window

The enhancer observes `globalThis.window` by default. Pass any object with a `matchMedia` method to observe something else, such as an iframe's window:

```ts
createResponsiveStoreEnhancer({ window: iframe.contentWindow })
```

## React bindings

Responsive styles often look like this:

```tsx
<div style={browser.lessThan.medium ? styles.elementThin : styles.element} />
```

`@mrcgrtz/redux-responsive/react` lets you declare overrides inside the style instead, using keys of the form `_lessThan_<mediaType>`, `_greaterThan_<mediaType>` and `_equal_<mediaType>`. Overrides apply in this order: `lessThan` (largest to smallest), `greaterThan` (smallest to largest), then `equal`.

### `useResponsiveStyles`

```tsx
import { useResponsiveStyles } from '@mrcgrtz/redux-responsive/react'

const stylesheet = {
    element: {
        color: 'blue',
        _lessThan_medium: { color: 'black' },
    },
}

function Component() {
    const styles = useResponsiveStyles(stylesheet)
    return <div style={styles.element} />
}
```

The stylesheet can also be a function of the responsive state and props:

```tsx
const styles = useResponsiveStyles(
    (browser, props) => ({ element: { opacity: props.active ? 1 : 0.5 } }),
    props
)
```

If the responsive state is not stored under `browser`, pass a selector:

```tsx
useResponsiveStyles(stylesheet, undefined, {
    selectResponsiveState: (state: RootState) => state.screen,
})
```

### `StyleSheet` higher-order component

For existing class components, the `StyleSheet` HOC passes the resolved styles as the `styles` prop:

```tsx
import { StyleSheet } from '@mrcgrtz/redux-responsive/react'

const Component = StyleSheet(stylesheet)(({ styles }) => <div style={styles.element} />)

// with a custom state key
StyleSheet(stylesheet, { reducerName: 'screen' })
```

## redux-immutable

The root of your state may be an Immutable.js `Map` or `Record` (e.g. via [redux-immutable](https://www.npmjs.com/package/redux-immutable)). The branch of state managed by redux-responsive must stay plain JavaScript, so keep this in mind when transforming state before hydration.

## FAQ

**redux-responsive returns the wrong breakpoint on mobile devices. What may be causing this?**

You are probably missing the viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`. Read more about it [on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag).

## Development

Requires Node 26 or newer.

```sh
npm install
npm test           # run the tests (node:test, straight from the TypeScript sources)
npm run check      # typecheck, lint (XO) and tests
npm run format     # fix lint and formatting issues
npm run dev        # start the example app
npm run build      # emit dist/
```

## Versioning

[Semver](https://semver.org/) is followed as closely as possible. See the [changelog](CHANGELOG.md) for updates and migration instructions.
