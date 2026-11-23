import reactHooks from 'eslint-plugin-react-hooks';

/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
	{
		files: ['**/*.{ts,tsx}'],
		...reactHooks.configs.flat.recommended,
	},
	{
		rules: {
			// Keep the leading asterisks in JSDoc blocks and allow single-line blocks
			'jsdoc/require-asterisk-prefix': 'off',
			'unicorn/single-line-block-comment-style': 'off',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		rules: {
			// `null` is part of the public API (`orientation: null`, `createResponsiveStateReducer(null)`)
			// and survives JSON serialization of the state, unlike `undefined`
			'unicorn/no-null': 'off',
			// XO's defaults minus the `object` and `null` bans, see above
			'@typescript-eslint/no-restricted-types': [
				'error',
				{
					types: {
						Buffer: {
							message: 'Use Uint8Array instead.',
							suggest: ['Uint8Array'],
						},
						'[]': 'Don\'t use the empty array type `[]`. Use `SomeType[]` instead.',
					},
				},
			],
		},
	},
	{
		files: ['src/**/*.test.ts', 'src/**/*.test-d.ts', 'src/fake-window.ts', 'example/**'],
		rules: {
			// `describe` and `it` from `node:test` return promises the test runner awaits
			'@typescript-eslint/no-floating-promises': 'off',
			// React components and the library's `_lessThan_medium` style keys
			'@typescript-eslint/naming-convention': 'off',
			// `StyleSheet()` and Immutable.js record factories are not constructors
			'new-cap': 'off',
			'unicorn/no-top-level-side-effects': 'off',
			'unicorn/max-nested-calls': 'off',
		},
	},
	{
		// Type-level tests consist of expressions that are only checked by `tsc`
		files: ['src/**/*.test-d.ts'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-empty-function': 'off',
		},
	},
	{
		// The example page is not published, so it needs no social media metadata
		files: ['example/**/*.html'],
		rules: {
			'@html-eslint/require-open-graph-protocol': 'off',
		},
	},
	{
		// `package.json` is always part of the package, the explicit export is for tooling
		files: ['package.json'],
		rules: {
			'package-json/prefer-files-field': 'off',
		},
	},
];

export default xoConfig;
