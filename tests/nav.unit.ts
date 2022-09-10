import { expect } from 'chai';

import { navigate_to, nav, initialState } from '$lib/components/nav';
import { describe, it } from 'vitest';

describe('navigation state', () => {
	it('can set the current page', () => {
		const nextState = nav(initialState, navigate_to('timing'));
		expect(nextState.active).to.equal('timing');
	});

	it('defaults to bluetooth', () => {
		const s = undefined as unknown as string;
		const nextState = nav(initialState, navigate_to(s));
		expect(nextState.active).to.equal('bluetooth');
	});
});
