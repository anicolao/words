import { expect } from 'chai';

import {
	words,
    play,
    initialWordsState,
	type WordsState
} from '$lib/components/words';
import { describe, it } from 'vitest';

describe('words', () => {
	it('initial state', () => {
		const nextState = words({
            ...initialWordsState,
        }, play);
		expect(nextState.board.length).to.equals(225);
	});
});
