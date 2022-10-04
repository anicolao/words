import { expect } from 'chai';
import { describe, it } from 'vitest';

import {
	gamedefs,
	play,
	initialGameDefsState,
	type GameDefsState,
	type GameDefinition,
	define_game
} from '$lib/components/gamedefs';

describe('gamedefs', () => {
	it('initial state', () => {
		expect(initialGameDefsState.gameΙds.length).to.equals(0);
	});

	it('define a word game', () => {
		const crossword: GameDefinition = {
			id: '0xDeadBeef',
			properties: { tiles: 'abcdefghijklmnopqrstuvwxyz', name: 'Crossword Game' }
		};
		const nextState = gamedefs(initialGameDefsState, define_game(crossword));
		expect(nextState.gameΙds.length).to.be.equal(1);
	});
});
