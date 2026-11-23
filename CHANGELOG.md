# Changelog

## 5.0.0

A full modernization for Redux 5, React 19 and current tooling. See the migration guide below.

### Breaking changes

- **New package name:** `redux-responsive` is archived; this fork is published as `@mrcgrtz/redux-responsive`.
- **ES modules only.** The UMD bundles (`index.js`, `index.min.js`, `react.js`, `react.min.js`) and the `lib/` build are gone. The package exposes `@mrcgrtz/redux-responsive` and `@mrcgrtz/redux-responsive/react` through `exports`. CommonJS code can still `require()` it on Node versions that support loading ES modules.
- **Peer dependencies:** `redux@^5` is required. The React bindings require `react@^19` and `react-redux@^9` (both optional peers).
- **`calculateResponsiveState()` no longer takes a window.** The enhancer measures the window and attaches `{ mediaType, orientation }` as the action's `payload`, so actions are serializable and work with Redux Toolkit's serializability check. Without the enhancer (e.g. on the server) the request is a no-op; pass a payload to set the state explicitly: `calculateResponsiveState({ mediaType: 'small', orientation: null })`.
- **The action shape changed** from `{ type, innerWidth, innerHeight, matchMedia }` to `{ type, payload? }`.
- **The given breakpoints are no longer mutated.** The reducer stores a frozen copy that includes the infinity media type, so `state.breakpoints !== breakpoints`.
- **Custom (string) breakpoints are never `lessThan`/`greaterThan`** another breakpoint; previously the result depended on their sort position.
- **Hand-written type definitions were replaced** by types generated from the TypeScript sources. The `I`-prefixed names are gone except for deprecated `IBrowser` and `IBreakPoints` aliases. Use `ResponsiveState`, `Breakpoints`, `ResponsiveReducerOptions` and `ResponsiveEnhancerOptions` instead.
- **Style patterns other than `_lessThan_`, `_greaterThan_` and `_equal_`** are no longer matched.

### New

- `useResponsiveStyles(stylesheet, props?, { selectResponsiveState? })` hook in `@mrcgrtz/redux-responsive/react`.
- `createResponsiveStoreEnhancer({ window })` observes a custom window (e.g. an iframe).
- Strongly typed state: media types are inferred from your breakpoints, including the custom infinity name and `extraFields`.
- `computeStyles` and `transformStyle` are exported for use outside React components.

### Improvements

- Uses `MediaQueryList.addEventListener('change')` instead of the deprecated `addListener`, and orientation media queries instead of the deprecated `orientationchange` event.
- A single resize that flips several media queries now dispatches once instead of once per query.
- The `StyleSheet` HOC is built on the hook instead of `connect`, preserves the wrapped component's props in its type, and is memoized.
- The `mediaquery` dependency is replaced by a small internal implementation; the package has no runtime dependencies.

### Tooling

- TypeScript sources, built with `tsc`; tests run on `node:test` directly from the sources.
- XO for linting and formatting, husky and lint-staged for pre-commit fixes, Vite for the example app, GitHub Actions for CI (tests, npm publishing with provenance, Dependabot auto-merge).
- Removed Babel 6, webpack 2, Jest 19, dtslint and Travis CI. Coverage from the built-in test runner is reported to Coveralls.

### Migration guide

1. Replace `redux-responsive` with `@mrcgrtz/redux-responsive` in your `package.json` and imports.
1. Upgrade to `redux@^5` (and `react@^19`, `react-redux@^9` if you use the React bindings).
1. Replace `store.dispatch(calculateResponsiveState(window))` with `store.dispatch(calculateResponsiveState())`.
1. If you test reducers directly with actions carrying `matchMedia`, pass a payload instead:
   `reducer(state, calculateResponsiveState({ mediaType: 'medium', orientation: 'landscape' }))`.
1. Replace imports of `IBrowser`, `IBreakPoints`, `IResponsiveReducerOptions` and `IResponsiveEnhancerOptions` with `ResponsiveState`, `Breakpoints`, `ResponsiveReducerOptions` and `ResponsiveEnhancerOptions`.
1. If you relied on the UMD bundle via a `<script>` tag, load the ES module from a CDN that serves npm packages as ESM instead.
1. Optionally replace `StyleSheet(stylesheet)(Component)` with the `useResponsiveStyles` hook.

## Earlier versions

See the [wiki changelog](https://github.com/AlecAivazis/redux-responsive/wiki/Changelog).
