import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {toMediaQueries} from './media-queries.ts';

describe('toMediaQueries', () => {
	it('turns numeric breakpoints into contiguous width ranges', () => {
		assert.deepEqual(toMediaQueries({large: 1000, small: 500, infinity: Infinity}), {
			small: 'screen and (max-width: 500px)',
			large: 'screen and (min-width: 501px) and (max-width: 1000px)',
			infinity: 'screen and (min-width: 1001px)',
		});
	});

	it('passes custom media queries through', () => {
		assert.deepEqual(toMediaQueries({small: 500, print: 'print'}), {
			small: 'screen and (max-width: 500px)',
			print: 'print',
		});
	});
});
